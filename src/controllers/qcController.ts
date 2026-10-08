import type { Request, Response } from 'express';
import { QcFilterSchema } from '../validators/qcValidator.js';
import { listQcInspections, serializeQcRow } from '../services/qcService.js';
import { buildQcWorkbook, qcReportFileName, buildNightWorkbook, qcNightFileName } from '../services/excelExportService.js';
import { buildDailySummary, buildNightSummary } from '../services/summaryService.js';
import { prisma } from '../database/prisma.js';
import { dbRowSheetKey, removeSheetRowsByKeys } from '../integrations/google-sheets/sheetsClient.js';
import { requireAdminToken } from '../middleware/security.js';
import { todayBangkokISO } from '../utils/timezone.js';
import { logger } from '../config/logger.js';

export async function listQcHandler(req: Request, res: Response): Promise<void> {
  const parsed = QcFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'invalid_filters', details: parsed.error.flatten() });
    return;
  }
  const { rows, total } = await listQcInspections(parsed.data);
  res.json({ ok: true, total, count: (rows as unknown[]).length, data: (rows as Record<string, unknown>[]).map(serializeQcRow) });
}

export async function exportQcHandler(req: Request, res: Response): Promise<void> {
  const parsed = QcFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'invalid_filters' });
    return;
  }
  logger.info({ query: req.query }, 'Export request: building .xlsx');
  const wb = await buildQcWorkbook(parsed.data);
  const fileName = qcReportFileName(new Date());
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  await wb.xlsx.write(res);
  res.end();
}

export async function nightSummaryHandler(req: Request, res: Response): Promise<void> {
  const raw = typeof req.query.date === 'string' ? req.query.date : todayBangkokISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    res.status(400).json({ ok: false, error: 'date must be YYYY-MM-DD' });
    return;
  }
  const u = typeof req.query.user === "string" ? req.query.user : undefined;
  const sh = typeof req.query.shift === "string" ? req.query.shift : undefined;
  const summary = await buildNightSummary(raw, u, sh);
  if (req.query.format === 'text') {
    res.type('text/plain; charset=utf-8').send(summary.text);
    return;
  }
  res.json({ ok: true, data: summary });
}

export async function summaryHandler(req: Request, res: Response): Promise<void> {
  const raw = typeof req.query.date === 'string' ? req.query.date : todayBangkokISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    res.status(400).json({ ok: false, error: 'date must be YYYY-MM-DD' });
    return;
  }
  const u = typeof req.query.user === "string" ? req.query.user : undefined;
  const sh = typeof req.query.shift === "string" ? req.query.shift : undefined;
  const summary = await buildDailySummary(raw, u, sh);
  if (req.query.format === 'text') {
    res.type('text/plain; charset=utf-8').send(summary.text);
    return;
  }
  res.json({ ok: true, data: summary });
}

export async function deleteOneHandler(req: Request, res: Response): Promise<void> {
  if (!requireAdminToken(req, res)) return;
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) {
    res.status(400).json({ ok: false, error: 'missing_id' });
    return;
  }
  const rec = await prisma.qcInspection.findUnique({ where: { id } });
  if (!rec) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  await prisma.qcInspection.delete({ where: { id } });
  let sheetRemoved = false;
  try {
    sheetRemoved = (await removeSheetRowsByKeys([dbRowSheetKey(rec)])) > 0;
  } catch (err) {
    logger.warn({ err, qcId: id }, 'Sheet row cleanup failed after DB delete');
  }
  logger.info({ qcId: id, sheetRemoved }, 'QC inspection deleted');
  res.json({ ok: true, id, sheetRemoved });
}

export async function deleteManyHandler(req: Request, res: Response): Promise<void> {
  if (!requireAdminToken(req, res)) return;
  const parsed = QcFilterSchema.safeParse({ ...req.query, limit: 500, offset: 0 });
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'invalid_filters' });
    return;
  }
  const f = parsed.data;
  const where: Record<string, unknown> = {};
  if (f.date) {
    const d = new Date(`${f.date}T00:00:00.000Z`);
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    where.inspectionDate = { gte: d, lt: next };
  }
  if (f.factory) where.factory = { equals: f.factory, mode: 'insensitive' };
  if (f.jobNumber) where.jobNumber = { equals: f.jobNumber, mode: 'insensitive' };
  if (f.machineNumber) where.machineNumber = { equals: f.machineNumber, mode: 'insensitive' };
  if (f.status) where.status = { equals: f.status, mode: 'insensitive' };
  if (f.inspectionType) where.inspectionType = { contains: f.inspectionType, mode: 'insensitive' };
  if (f.user) where.telegramUsername = { equals: f.user.replace(/^@/, ''), mode: 'insensitive' };
  if (f.shift) (where as { shift?: unknown }).shift = { equals: f.shift, mode: 'insensitive' };
  const rows = await prisma.qcInspection.findMany({ where, take: 500, orderBy: { createdAt: 'asc' } });
  if (rows.length === 0) {
    res.json({ ok: true, deleted: 0, sheetRemoved: 0 });
    return;
  }
  await prisma.qcInspection.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  let sheetRemoved = 0;
  try {
    sheetRemoved = await removeSheetRowsByKeys(rows.map((r) => dbRowSheetKey(r)));
  } catch (err) {
    logger.warn({ err, count: rows.length }, 'Sheet row cleanup failed after bulk DB delete');
  }
  logger.info({ count: rows.length, sheetRemoved }, 'QC inspections bulk deleted');
  res.json({ ok: true, deleted: rows.length, sheetRemoved });
}

export async function exportNightHandler(req: Request, res: Response): Promise<void> {
  const raw = typeof req.query.date === 'string' ? req.query.date : todayBangkokISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    res.status(400).json({ ok: false, error: 'date must be YYYY-MM-DD' });
    return;
  }
  const u = typeof req.query.user === 'string' ? req.query.user : undefined;
  const sh = typeof req.query.shift === 'string' ? req.query.shift : undefined;
  logger.info({ date: raw }, 'Export request: building night .xlsx');
  const wb = await buildNightWorkbook(raw, u, sh);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${qcNightFileName(raw)}"`);
  await wb.xlsx.write(res);
  res.end();
}
