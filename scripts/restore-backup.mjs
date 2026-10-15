/** Restore a production backup (PROD-BACKUP-*.json) into Postgres.
 *  Matches on the natural unique key (telegram chat + message) so restores
 *  are idempotent and converge even if cuid ids differ.
 *  Preserves sheet-sync state so the sheet is NOT re-synced (no duplicates).
 *
 *  Usage:  DATABASE_URL=postgresql://... node scripts/restore-backup.mjs ./PROD-BACKUP-20261015.json
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const B = (v) => (v === null || v === undefined ? null : BigInt(v));
const D = (v) => (v === null || v === undefined ? null : new Date(v));

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node scripts/restore-backup.mjs <backup.json>');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = data.rows ?? [];
  const failed = data.failed ?? [];

  let created = 0;
  let refreshed = 0;
  for (const x of rows) {
    const key = {
      telegramChatId: BigInt(x.telegramChatId),
      telegramMessageId: x.telegramMessageId,
    };
    const record = {
      inspectionDate: new Date(x.inspectionDate),
      inspectionType: x.inspectionType,
      factory: x.factory,
      process: x.process,
      jobNumber: x.jobNumber,
      number: x.number,
      machineNumber: x.machineNumber,
      modelNumber: x.modelNumber ?? null,
      colour: x.colour ?? null,
      inspectionTime: x.inspectionTime,
      qcCheck: x.qcCheck,
      qcResult: x.qcResult,
      defectRemark: x.defectRemark,
      shift: x.shift,
      inspectionQty: x.inspectionQty,
      foundQty: x.foundQty,
      totalNg: x.totalNg,
      status: x.status,
      originalStatus: x.originalStatus,
      originalMessage: x.originalMessage,
      telegramUserId: B(x.telegramUserId),
      telegramUsername: x.telegramUsername,
      receivedAt: new Date(x.receivedAt),
      sheetSyncStatus: x.sheetSyncStatus ?? 'SYNCED',
      sheetRowNumber: x.sheetRowNumber ?? null,
      sheetSyncedAt: D(x.sheetSyncedAt),
      sheetSyncError: x.sheetSyncError ?? null,
      retryCount: x.retryCount ?? 0,
      createdAt: x.createdAt ? new Date(x.createdAt) : undefined,
      updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined,
    };
    const existing = await prisma.qcInspection.findUnique({
      where: { uq_telegram_chat_message: key },
    });
    if (existing) {
      await prisma.qcInspection.update({ where: { id: existing.id }, data: record });
      refreshed++;
    } else {
      await prisma.qcInspection.create({ data: { id: x.id, ...key, ...record } });
      created++;
    }
  }
  let f = 0;
  for (const x of failed) {
    await prisma.failedMessage.upsert({
      where: { id: x.id },
      update: {},
      create: {
        id: x.id,
        originalMessage: x.originalMessage,
        telegramMessageId: x.telegramMessageId ?? null,
        telegramChatId: B(x.telegramChatId),
        telegramUserId: B(x.telegramUserId),
        telegramUsername: x.telegramUsername ?? null,
        errorReason: x.errorReason,
        missingFields: x.missingFields ?? [],
        receivedAt: new Date(x.receivedAt),
        retryCount: x.retryCount ?? 0,
        resolved: x.resolved ?? false,
        createdAt: x.createdAt ? new Date(x.createdAt) : undefined,
        updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined,
      },
    });
    f++;
  }
  console.log(`inspections: created=${created} refreshed=${refreshed} failed_messages=${f}`);
  console.log('db now:', await prisma.qcInspection.count(), 'inspections');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
