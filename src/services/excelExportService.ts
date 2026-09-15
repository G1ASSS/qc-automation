import ExcelJS from 'exceljs';
import { prisma } from '../database/prisma.js';
import { formatDateForDisplay } from '../utils/timezone.js';
import type { QcFilter } from '../validators/qcValidator.js';

export function qcReportFileName(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `QC_Report_${y}-${m}-${d}.xlsx`;
}

const HEADERS = [
  'Date',
  'Inspection Type',
  'Factory',
  'Process',
  'Job Number',
  'Number',
  'Machine No',
  'Time',
  'QC Check',
  'QC Result',
  'Status',
  'Telegram User',
  'Received At',
  'Defect / Remark',
];

export async function buildQcWorkbook(filter: QcFilter): Promise<ExcelJS.Workbook> {
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

  const rows = await prisma.qcInspection.findMany({
    where,
    orderBy: [{ inspectionDate: 'asc' }, { createdAt: 'asc' }],
    take: 5000,
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'QC Automation';
  wb.created = new Date();
  const ws = wb.addWorksheet('QC Reports');

  ws.columns = [
    { header: HEADERS[0], key: 'date', width: 12 },
    { header: HEADERS[1], key: 'type', width: 24 },
    { header: HEADERS[2], key: 'factory', width: 12 },
    { header: HEADERS[3], key: 'process', width: 14 },
    { header: HEADERS[4], key: 'job', width: 14 },
    { header: HEADERS[5], key: 'number', width: 9 },
    { header: HEADERS[6], key: 'machine', width: 11 },
    { header: HEADERS[7], key: 'time', width: 9 },
    { header: HEADERS[8], key: 'qcCheck', width: 18 },
    { header: HEADERS[9], key: 'qcResult', width: 10 },
    { header: HEADERS[10], key: 'status', width: 12 },
    { header: HEADERS[11], key: 'user', width: 16 },
    { header: HEADERS[12], key: 'received', width: 18 },
    { header: HEADERS[13], key: 'defect', width: 22 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 22;

  for (const r of rows) {
    const iso = r.inspectionDate.toISOString().slice(0, 10);
    ws.addRow({
      date: formatDateForDisplay(iso),
      type: r.inspectionType,
      factory: r.factory,
      process: r.process ?? '',
      job: r.jobNumber,
      number: r.number ?? '',
      machine: r.machineNumber ?? '',
      time: r.inspectionTime ?? '',
      qcCheck: r.qcCheck ?? '',
      qcResult: r.qcResult ?? '',
      status: r.status ?? '',
      user: r.telegramUsername ? `@${r.telegramUsername}` : '',
      defect: r.defectRemark ?? '',
      received: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(r.receivedAt),
    });
  }

  ws.autoFilter = { from: 'A1', to: 'N1' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Borders + alignment for all data cells
  const thin: ExcelJS.Border = { style: 'thin', color: { argb: 'FFB0B0B0' } };
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
      if (rowNumber > 1) cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  // Auto-tune widths (bounded) based on content length
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? '').length;
      if (len > max) max = len;
    });
    col.width = Math.min(32, Math.max(col.width ?? 10, max + 2));
  });

  return wb;
}
