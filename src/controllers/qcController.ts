import type { Request, Response } from 'express';
import { QcFilterSchema } from '../validators/qcValidator.js';
import { listQcInspections, serializeQcRow } from '../services/qcService.js';
import { buildQcWorkbook, qcReportFileName } from '../services/excelExportService.js';
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
