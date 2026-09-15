import { prisma } from '../database/prisma.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { appendSheetRow } from '../integrations/google-sheets/sheetsClient.js';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const base = config.sheetsBaseDelayMs;
  return Math.min(base * 2 ** attempt, 5 * 60 * 1000);
}

/**
 * Sync a single QC record to Google Sheets exactly once.
 * Guarded by sheetSyncStatus so concurrent/duplicate deliveries never create duplicate rows:
 * only rows in PENDING/FAILED transition; SYNCED rows are skipped.
 */
export async function syncOneRecordToSheets(id: string): Promise<void> {
  const rec = await prisma.qcInspection.findUnique({ where: { id } });
  if (!rec) return;
  if (rec.sheetSyncStatus === 'SYNCED') return;

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
        inspectionTime: rec.inspectionTime,
        qcCheck: rec.qcCheck,
        qcResult: rec.qcResult,
        defectRemark: rec.defectRemark,
        status: rec.status,
        telegramUsername: rec.telegramUsername,
        receivedAt: rec.receivedAt,
      });
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncStatus: 'SYNCED', sheetRowNumber: rowNumber, sheetSyncedAt: new Date(), sheetSyncError: null },
      });
      logger.info({ qcId: id, rowNumber }, 'Google Sheets sync: row appended');
      return;
    } catch (err) {
      attempt += 1;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err, qcId: id, attempt }, 'Google Sheets sync failed');
      if (attempt >= maxRetries) {
        await prisma.qcInspection.update({
          where: { id },
          data: { sheetSyncStatus: 'FAILED', sheetSyncError: msg.slice(0, 2000), retryCount: attempt },
        });
        return;
      }
      await prisma.qcInspection.update({
        where: { id },
        data: { sheetSyncStatus: 'PENDING', sheetSyncError: msg.slice(0, 2000), retryCount: attempt },
      });
      await delay(backoffMs(attempt));
      // Re-read: stop if another worker already synced it.
      const fresh = await prisma.qcInspection.findUnique({ where: { id } });
      if (!fresh || fresh.sheetSyncStatus === 'SYNCED') return;
    }
  }
}

/** Fire-and-forget wrapper used by the webhook path (never throws). */
export function enqueueSheetSync(id: string): void {
  void syncOneRecordToSheets(id).catch((err) => logger.error({ err, qcId: id }, 'Sheet sync enqueue failed'));
}

/** Background retry loop: picks up PENDING/FAILED rows (e.g. after restarts) and syncs them. */
export function startSheetRetryWorker(intervalMs = 60_000): NodeJS.Timeout {
  async function tick(): Promise<void> {
    try {
      const pending = await prisma.qcInspection.findMany({
        where: { sheetSyncStatus: { in: ['PENDING', 'FAILED'] } },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      for (const rec of pending) {
        // Skip FAILED rows that exhausted retries; they stay FAILED for manual review.
        if (rec.sheetSyncStatus === 'FAILED' && rec.retryCount >= config.sheetsMaxRetries) continue;
        await syncOneRecordToSheets(rec.id);
      }
      if (pending.length > 0) logger.info({ count: pending.length }, 'Sheet retry worker processed pending rows');
    } catch (err) {
      logger.error({ err }, 'Sheet retry worker tick failed');
    }
  }
  void tick();
  return setInterval(() => void tick(), intervalMs);
}
