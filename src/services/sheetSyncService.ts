import { prisma } from '../database/prisma.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { appendSheetRow, dbRowSheetKey, removeSheetRowsByKeys, tidySheet } from '../integrations/google-sheets/sheetsClient.js';
import { parseQCMessage } from '../parsers/qcParser.js';
import { ParsedQCDataSchema } from '../validators/qcValidator.js';
import { createQcInspection } from './qcService.js';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const base = config.sheetsBaseDelayMs;
  return Math.min(base * 2 ** attempt, 5 * 60 * 1000);
}

export type SheetSyncOutcome = 'synced' | 'failed' | 'deferred';

// Google enforces per-minute quotas (e.g. 60 reads/min/user). Those are not
// record-specific failures, so they must not consume retry attempts.
const QUOTA_ERROR_RE = /quota exceeded|rate limit|too many requests/i;

/**
 * Sync a single QC record to Google Sheets exactly once.
 * Guarded by sheetSyncStatus so concurrent/duplicate deliveries never create duplicate rows:
 * only rows in PENDING/FAILED transition; SYNCED rows are skipped.
 */
export async function syncOneRecordToSheets(id: string): Promise<SheetSyncOutcome> {
  const rec = await prisma.qcInspection.findUnique({ where: { id } });
  if (!rec) return 'failed';
  if (rec.sheetSyncStatus === 'SYNCED') return 'synced';

  // Atomically claim the row before appending. Without this, two callers
  // (webhook fire-and-forget + worker tick) could both append the same row.
  const claim = await prisma.qcInspection.updateMany({
    where: { id, sheetSyncStatus: { in: ['PENDING', 'FAILED'] } },
    data: { sheetSyncStatus: 'SYNCING' },
  });
  if (claim.count === 0) return 'synced';

  const maxRetries = config.sheetsMaxRetries;
  let attempt = rec.retryCount;
  for (;;) {
    try {
      const rowNumber = await appendSheetRow({
        inspectionDate: rec.inspectionDate.toISOString().slice(0, 10),
        inspectionType: rec.inspectionType,
        factory: rec.factory,
        process: rec.process,
        jobNumber: rec.jobNumber,
        number: rec.number,
        machineNumber: rec.machineNumber,
        modelNumber: rec.modelNumber,
        colour: rec.colour,
        inspectionTime: rec.inspectionTime,
        qcCheck: rec.qcCheck,
        qcResult: rec.qcResult,
        defectRemark: rec.defectRemark,
        shift: rec.shift,
        inspectionQty: rec.inspectionQty,
        foundQty: rec.foundQty,
        totalNg: rec.totalNg,
        status: rec.status,
        telegramUsername: rec.telegramUsername,
        receivedAt: rec.receivedAt,
      });
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncStatus: 'SYNCED', sheetRowNumber: rowNumber, sheetSyncedAt: new Date(), sheetSyncError: null },
      });
      logger.info({ qcId: id, rowNumber }, 'Google Sheets sync: row appended');
      return 'synced';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (QUOTA_ERROR_RE.test(msg)) {
        await prisma.qcInspection.update({
          where: { id },
          data: { sheetSyncStatus: 'PENDING', sheetSyncError: msg.slice(0, 2000), retryCount: 0 },
        });
        logger.warn({ qcId: id }, 'Google Sheets quota reached: deferring sync to next worker tick');
        return 'deferred';
      }
      attempt += 1;
      logger.error({ err, qcId: id, attempt }, 'Google Sheets sync failed');
      if (attempt >= maxRetries) {
        await prisma.qcInspection.update({
          where: { id },
          data: { sheetSyncStatus: 'FAILED', sheetSyncError: msg.slice(0, 2000), retryCount: attempt },
        });
        return 'failed';
      }
      // Stay claimed (SYNCING) while backing off so no other caller can
      // append the same row in the meantime.
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncError: msg.slice(0, 2000), retryCount: attempt },
      });
      await delay(backoffMs(attempt));
    }
  }
}

/** Fire-and-forget wrapper used by the webhook path (never throws). */
export function enqueueSheetSync(id: string): void {
  void syncOneRecordToSheets(id).catch((err) => logger.error({ err, qcId: id }, 'Sheet sync enqueue failed'));
}

/** Requeue rows that exhausted retries on a problem the app now handles:
 *  a too-small sheet grid or a burst of API quota errors. Without this they
 *  would stay FAILED forever because the worker skips exhausted rows. */
async function requeueRecoverableSyncFailures(): Promise<void> {
  try {
    const result = await prisma.qcInspection.updateMany({
      where: {
        sheetSyncStatus: 'FAILED',
        OR: [
          { sheetSyncError: { contains: 'exceeds grid limits', mode: 'insensitive' } },
          { sheetSyncError: { contains: 'quota exceeded', mode: 'insensitive' } },
          { sheetSyncError: { contains: 'rate limit', mode: 'insensitive' } },
        ],
      },
      data: { sheetSyncStatus: 'PENDING', retryCount: 0, sheetSyncError: null },
    });
    if (result.count > 0) {
      logger.info({ count: result.count }, 'Requeued recoverable sheet sync failures');
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to requeue recoverable sheet sync failures');
  }
}

export interface ReparseResult {
  ok: boolean;
  status: number;
  error?: string;
  details?: unknown;
  sheetRowNumber?: number;
}

/**
 * Re-parse a stored record from its original message and repair DB + sheet.
 * Used after parser improvements to fix rows that were stored with bad values.
 */
export async function reparseQcRecord(id: string): Promise<ReparseResult> {
  const rec = await prisma.qcInspection.findUnique({ where: { id } });
  if (!rec) return { ok: false, status: 404, error: 'not_found' };

  const parsed = parseQCMessage(rec.originalMessage);
  const zod = parsed.success && parsed.data ? ParsedQCDataSchema.safeParse(parsed.data) : null;
  if (!zod || !zod.success) {
    return {
      ok: false,
      status: 422,
      error: 'unparseable',
      details: parsed.success ? zod?.error?.issues : parsed.errors,
    };
  }

  const updated = await prisma.qcInspection.update({
    where: { id },
    data: {
      inspectionDate: new Date(`${zod.data.inspectionDate}T00:00:00.000Z`),
      inspectionType: zod.data.inspectionType,
      factory: zod.data.factory,
      process: zod.data.process,
      jobNumber: zod.data.jobNumber,
      number: zod.data.number,
      machineNumber: zod.data.machineNumber,
      modelNumber: zod.data.modelNumber,
      colour: zod.data.colour,
      inspectionTime: zod.data.inspectionTime,
      qcCheck: zod.data.qcCheck,
      qcResult: zod.data.qcResult,
      defectRemark: zod.data.defectRemark,
      shift: zod.data.shift,
      inspectionQty: zod.data.inspectionQty,
      foundQty: zod.data.foundQty,
      totalNg: zod.data.totalNg,
      status: zod.data.status,
      originalStatus: zod.data.originalStatus,
    },
  });

  // Replace the sheet row so it matches the corrected record.
  if (rec.sheetSyncStatus === 'SYNCED' || rec.sheetRowNumber != null) {
    try {
      await removeSheetRowsByKeys([dbRowSheetKey(rec)]);
      const rowNumber = await appendSheetRow({
        inspectionDate: updated.inspectionDate.toISOString().slice(0, 10),
        inspectionType: updated.inspectionType,
        factory: updated.factory,
        process: updated.process,
        jobNumber: updated.jobNumber,
        number: updated.number,
        machineNumber: updated.machineNumber,
        modelNumber: updated.modelNumber,
        colour: updated.colour,
        inspectionTime: updated.inspectionTime,
        qcCheck: updated.qcCheck,
        qcResult: updated.qcResult,
        defectRemark: updated.defectRemark,
        shift: updated.shift,
        inspectionQty: updated.inspectionQty,
        foundQty: updated.foundQty,
        totalNg: updated.totalNg,
        status: updated.status,
        telegramUsername: updated.telegramUsername,
        receivedAt: updated.receivedAt,
      });
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncStatus: 'SYNCED', sheetRowNumber: rowNumber, sheetSyncedAt: new Date(), sheetSyncError: null },
      });
      return { ok: true, status: 200, sheetRowNumber: rowNumber ?? undefined };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ err, qcId: id }, 'Reparse: sheet update failed, queued for retry');
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncStatus: 'PENDING', sheetSyncError: msg.slice(0, 2000), retryCount: 0 },
      });
      return { ok: true, status: 200, error: 'sheet_update_deferred' };
    }
  }
  return { ok: true, status: 200 };
}

/** Rows left SYNCING by a crashed process would otherwise never be retried. */
async function resetStaleSyncingRows(): Promise<void> {
  try {
    const res = await prisma.qcInspection.updateMany({
      where: { sheetSyncStatus: 'SYNCING', updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      data: { sheetSyncStatus: 'PENDING' },
    });
    if (res.count > 0) logger.warn({ count: res.count }, 'Reset stale SYNCING sheet rows to PENDING');
  } catch (err) {
    logger.warn({ err }, 'Failed to reset stale SYNCING sheet rows');
  }
}

/** How many times a rejected message is re-parsed before we give up on it. */
const FAILED_MESSAGE_MAX_ATTEMPTS = 5;

/**
 * Re-parse previously rejected messages with the current parser. Reports that
 * now parse (e.g. after a new template was supported) are stored and synced.
 * If a record with the same date/factory/process/time already exists the
 * message is treated as a re-send: it is marked resolved, never duplicated.
 */
async function recoverFailedMessages(): Promise<void> {
  try {
    const failed = await prisma.failedMessage.findMany({
      where: { resolved: false, retryCount: { lt: FAILED_MESSAGE_MAX_ATTEMPTS } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    if (failed.length === 0) return;

    let recovered = 0;
    for (const fm of failed) {
      const parsed = parseQCMessage(fm.originalMessage);
      const zod = parsed.success && parsed.data ? ParsedQCDataSchema.safeParse(parsed.data) : null;
      if (!zod || !zod.success || fm.telegramMessageId == null) {
        await prisma.failedMessage.update({ where: { id: fm.id }, data: { retryCount: { increment: 1 } } });
        continue;
      }

      const looksLikeResend = await prisma.qcInspection.findFirst({
        where: {
          inspectionDate: new Date(`${zod.data.inspectionDate}T00:00:00.000Z`),
          factory: zod.data.factory,
          process: zod.data.process,
          inspectionTime: zod.data.inspectionTime,
        },
        select: { id: true },
      });

      if (!looksLikeResend) {
        const { record, duplicate } = await createQcInspection({
          ...zod.data,
          originalMessage: fm.originalMessage,
          telegramMessageId: fm.telegramMessageId,
          telegramChatId: Number(fm.telegramChatId ?? 0),
          telegramUserId: fm.telegramUserId != null ? Number(fm.telegramUserId) : undefined,
          telegramUsername: fm.telegramUsername ?? undefined,
          receivedAt: fm.receivedAt,
        });
        if (!duplicate) {
          enqueueSheetSync((record as { id: string }).id);
          recovered += 1;
        }
      }
      await prisma.failedMessage.update({ where: { id: fm.id }, data: { resolved: true, retryCount: { increment: 1 } } });
    }
    if (recovered > 0) logger.info({ recovered }, 'Recovered previously rejected QC messages');
  } catch (err) {
    logger.warn({ err }, 'Failed-message recovery run failed');
  }
}

/** Background retry loop: picks up PENDING/FAILED rows (e.g. after restarts) and syncs them. */
export function startSheetRetryWorker(intervalMs = 60_000): NodeJS.Timeout {
  async function tick(): Promise<void> {
    try {
      await resetStaleSyncingRows();
      await recoverFailedMessages();
      await requeueRecoverableSyncFailures();
      const pending = await prisma.qcInspection.findMany({
        where: { sheetSyncStatus: { in: ['PENDING', 'FAILED'] } },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      let deferred = false;
      for (const rec of pending) {
        // Skip FAILED rows that exhausted retries; they stay FAILED for manual review.
        if (rec.sheetSyncStatus === 'FAILED' && rec.retryCount >= config.sheetsMaxRetries) continue;
        const outcome = await syncOneRecordToSheets(rec.id);
        if (outcome === 'deferred') {
          deferred = true;
          break;
        }
      }
      if (pending.length > 0) logger.info({ count: pending.length, deferred }, 'Sheet retry worker processed pending rows');
      // Keep the sheet converged (date order + numeric QC Check) even when
      // rows arrive from other/older bot instances sharing this spreadsheet.
      // Skip while quota-throttled so the next tick can use those reads.
      if (!deferred) {
        try {
          await tidySheet();
        } catch (err) {
          logger.warn({ err }, 'Periodic sheet tidy failed');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Sheet retry worker tick failed');
    }
  }
  void tick();
  return setInterval(() => void tick(), intervalMs);
}
