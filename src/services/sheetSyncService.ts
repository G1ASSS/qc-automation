import { prisma } from '../database/prisma.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { appendSheetRow, tidySheet } from '../integrations/google-sheets/sheetsClient.js';

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
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncStatus: 'PENDING', sheetSyncError: msg.slice(0, 2000), retryCount: attempt },
      });
      await delay(backoffMs(attempt));
      // Re-read: stop if another worker already synced it.
      const fresh = await prisma.qcInspection.findUnique({ where: { id } });
      if (!fresh || fresh.sheetSyncStatus === 'SYNCED') return 'synced';
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

/** Background retry loop: picks up PENDING/FAILED rows (e.g. after restarts) and syncs them. */
export function startSheetRetryWorker(intervalMs = 60_000): NodeJS.Timeout {
  async function tick(): Promise<void> {
    try {
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
