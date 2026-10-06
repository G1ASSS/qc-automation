import type { Request, Response } from 'express';
import { QcFilterSchema } from '../validators/qcValidator.js';
import { listQcInspections, serializeQcRow } from '../services/qcService.js';
import { buildQcWorkbook, qcReportFileName } from '../services/excelExportService.js';
import { buildDailySummary, buildNightSummary } from '../services/summaryService.js';
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
