import { prisma } from '../database/prisma.js';
import { logger } from '../config/logger.js';
import type { ParsedQCData, TelegramMeta } from '../types/qc.js';
import type { QcFilter } from '../validators/qcValidator.js';

export interface CreateQcInput extends ParsedQCData, TelegramMeta {}

function toBigInt(v: number | undefined): bigint | undefined {
  return v === undefined ? undefined : BigInt(v);
}

/**
 * Idempotent create: (telegramChatId, telegramMessageId) is unique.
 * Returns { record, duplicate } — duplicate=true when the message was already stored.
 */
export async function createQcInspection(input: CreateQcInput): Promise<{ record: unknown; duplicate: boolean }> {
  const chatId = BigInt(input.telegramChatId);
  try {
    const record = await prisma.qcInspection.create({
      data: {
        inspectionDate: new Date(`${input.inspectionDate}T00:00:00.000Z`),
        inspectionType: input.inspectionType,
        factory: input.factory,
        process: input.process,
        jobNumber: input.jobNumber,
        number: input.number,
        machineNumber: input.machineNumber,
        inspectionTime: input.inspectionTime,
        qcCheck: input.qcCheck,
        qcResult: input.qcResult,
        defectRemark: input.defectRemark,
        status: input.status,
        originalStatus: input.originalStatus,
        originalMessage: input.originalMessage,
        telegramMessageId: input.telegramMessageId,
        telegramChatId: chatId,
        telegramUserId: toBigInt(input.telegramUserId) ?? null,
        telegramUsername: input.telegramUsername ?? null,
        receivedAt: input.receivedAt,
        sheetSyncStatus: 'PENDING',
        retryCount: 0,
      },
    });
    logger.info(
      { messageId: input.telegramMessageId, chatId: String(chatId), qcId: record.id },
      'Database insert: QC inspection saved',
    );
    return { record, duplicate: false };
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    ) {
      const existing = await prisma.qcInspection.findUnique({
        where: {
          uq_telegram_chat_message: { telegramChatId: chatId, telegramMessageId: input.telegramMessageId },
        },
      });
      logger.info(
        { messageId: input.telegramMessageId, chatId: String(chatId) },
        'Duplicate Telegram message ignored (idempotency)',
      );
      return { record: existing, duplicate: true };
    }
    throw err;
  }
}

export async function findExisting(chatId: number | bigint, messageId: number): Promise<unknown> {
  return prisma.qcInspection.findUnique({
    where: { uq_telegram_chat_message: { telegramChatId: BigInt(chatId), telegramMessageId: messageId } },
  });
}

export async function listQcInspections(filter: QcFilter): Promise<{ rows: unknown[]; total: number }> {
  const where: Record<string, unknown> = {};
  if (filter.date) {
    const d = new Date(`${filter.date}T00:00:00.000Z`);
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    where.inspectionDate = { gte: d, lt: next };
  }
  if (filter.factory) where.factory = { equals: filter.factory, mode: 'insensitive' };
  if (filter.jobNumber) where.jobNumber = { equals: filter.jobNumber, mode: 'insensitive' };
  if (filter.machineNumber) where.machineNumber = { equals: filter.machineNumber, mode: 'insensitive' };
  if (filter.status) where.status = { equals: filter.status, mode: 'insensitive' };
  if (filter.inspectionType) where.inspectionType = { contains: filter.inspectionType, mode: 'insensitive' };

  const [rows, total] = await Promise.all([
    prisma.qcInspection.findMany({
      where,
      orderBy: [{ inspectionDate: 'desc' }, { createdAt: 'desc' }],
      take: filter.limit,
      skip: filter.offset,
    }),
    prisma.qcInspection.count({ where }),
  ]);
  return { rows, total };
}

export interface TodayStats {
  date: string;
  total: number;
  ok: number;
  ng: number;
  unfinished: number;
  byFactory: { factory: string; total: number }[];
}

export async function getTodayStats(bangkokISODate: string): Promise<TodayStats> {
  const start = new Date(`${bangkokISODate}T00:00:00.000Z`);
  // NOTE: inspectionDate is stored as a calendar date (UTC midnight). Bangkok-day scoping uses the same
  // calendar date token; for stricter TZ-day semantics, scope on receivedAt converted in SQL.
  // Here we scope inspections whose inspectionDate equals the Bangkok calendar date — matches business use.
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const where = { inspectionDate: { gte: start, lt: end } };
  const [total, ok, ng, unfinished, groups] = await Promise.all([
    prisma.qcInspection.count({ where }),
    prisma.qcInspection.count({ where: { ...where, qcResult: { equals: 'OK', mode: 'insensitive' } } }),
    prisma.qcInspection.count({ where: { ...where, qcResult: { equals: 'NG', mode: 'insensitive' } } }),
    prisma.qcInspection.count({ where: { ...where, status: { equals: 'Unfinished', mode: 'insensitive' } } }),
    prisma.qcInspection.groupBy({ by: ['factory'], where, _count: { _all: true } }),
  ]);
  return {
    date: bangkokISODate,
    total,
    ok,
    ng,
    unfinished,
    byFactory: groups.map((g) => ({ factory: g.factory, total: g._count._all })),
  };
}

export async function saveFailedMessage(input: {
  originalMessage: string;
  telegramMessageId?: number;
  telegramChatId?: number;
  telegramUserId?: number;
  telegramUsername?: string;
  errorReason: string;
  missingFields: string[];
  receivedAt: Date;
}): Promise<void> {
  await prisma.failedMessage.create({
    data: {
      originalMessage: input.originalMessage,
      telegramMessageId: input.telegramMessageId ?? null,
      telegramChatId: input.telegramChatId !== undefined ? BigInt(input.telegramChatId) : null,
      telegramUserId: input.telegramUserId !== undefined ? BigInt(input.telegramUserId) : null,
      telegramUsername: input.telegramUsername ?? null,
      errorReason: input.errorReason,
      missingFields: input.missingFields,
      receivedAt: input.receivedAt,
    },
  });
  logger.warn(
    { messageId: input.telegramMessageId, chatId: input.telegramChatId },
    'Saved failed QC message for review',
  );
}

export function serializeQcRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const k of ['telegramChatId', 'telegramUserId'] as const) {
    if (typeof out[k] === 'bigint') out[k] = String(out[k]);
  }
  return out;
}
