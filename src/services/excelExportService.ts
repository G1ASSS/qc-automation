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

/**
 * Excel display for QC Check: just the pcs count, e.g. "100%=1pc." -> 1,
 * "Random Inspection 30pcs; Found 30pcs" -> 30. Non-quantity text is kept as-is.
 */
export function qcCheckDisplay(qcCheck: string | null): string | number {
  if (!qcCheck) return '';
  const m = /(\d+)\s*pcs?\.?/i.exec(qcCheck);
  if (m) return Number(m[1]);
  const trimmed = qcCheck.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return qcCheck;
}

/**
 * Rank for process ordering in reports: hole processes first, then
 * Row border line (A), then (B), then other named processes alphabetically,
 * empty last. e.g. "Row hole"/"hole line" -> 0, "Row border line (A)" -> 1.
 */
export function processRank(process: string | null): number {
  const p = (process ?? '').trim().toLowerCase();
  if (!p) return 99;
  if (/border/.test(p)) {
    if (/\(a\)|\ba\b/.test(p)) return 1;
    if (/\(b\)|\bb\b/.test(p)) return 2;
    return 3;
  }
  if (/\bhole\b/.test(p)) return 0;
  return 50;
}

interface QcRowLike {
  inspectionDate: Date;
  factory: string;
  process: string | null;
  createdAt: Date;
}

/** Report order: date asc, factory number asc, process rank, arrival order. Time untouched. */
export function compareQcRows(a: QcRowLike, b: QcRowLike): number {
  const d = a.inspectionDate.getTime() - b.inspectionDate.getTime();
  if (d !== 0) return d;
  const f = factoryRank(a.factory) - factoryRank(b.factory);
  if (f !== 0) return f;
  const fn = a.factory.toLowerCase().localeCompare(b.factory.toLowerCase());
  if (fn !== 0) return fn;
  const r = processRank(a.process) - processRank(b.process);
  if (r !== 0) return r;
  const p = (a.process ?? '').toLowerCase().localeCompare((b.process ?? '').toLowerCase());
  if (p !== 0) return p;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/** Rank for factory ordering: "Factory 2" -> 2; non-standard names sort after, A-Z. */
export function factoryRank(factory: string | null): number {
  const m = /factory\s*(\d+)/i.exec((factory ?? '').trim());
  return m ? Number(m[1]) : 99999;
}

const HEADERS = [
  'Date',
  'Inspection Type',
  'Factory',
  'Process',
  'Job Number',
  '',
  'Number',
  '',
  'QC Check',
  'Machine No',
  'QC Result',
  'Time',
  'Status',
  'Defect / Remark',
  'Inspection Qty',
  'Found Qty',
  'Total NG',
  'Shift',
  'Telegram User',
  'Received At',
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
  // Date asc, then factory number, then process group order (hole -> border A -> border B), then arrival.
  rows.sort((a, b) => compareQcRows(
    { inspectionDate: a.inspectionDate, factory: a.factory, process: a.process, createdAt: a.createdAt },
    { inspectionDate: b.inspectionDate, factory: b.factory, process: b.process, createdAt: b.createdAt },
  ));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'QC Automation';
  wb.created = new Date();
  const ws = wb.addWorksheet('QC Reports');

  ws.columns = [
    { header: HEADERS[0], key: 'date', width: 12 }, // A Date
    { header: HEADERS[1], key: 'type', width: 24 }, // B Inspection Type
    { header: HEADERS[2], key: 'factory', width: 12 }, // C Factory
    { header: HEADERS[3], key: 'process', width: 14 }, // D Process
    { header: HEADERS[4], key: 'job', width: 14 }, // E Job Number
    { header: HEADERS[5], key: 'blank1', width: 3 }, // F (blank spacer)
    { header: HEADERS[6], key: 'number', width: 9 }, // G Number
    { header: HEADERS[7], key: 'blank2', width: 3 }, // H (blank spacer)
    { header: HEADERS[8], key: 'qcCheck', width: 18 }, // I QC Check
    { header: HEADERS[9], key: 'machine', width: 11 }, // J Machine No
    { header: HEADERS[10], key: 'qcResult', width: 10 }, // K QC Result
    { header: HEADERS[11], key: 'time', width: 9 }, // L Time
    { header: HEADERS[12], key: 'status', width: 12 }, // M Status
    { header: HEADERS[13], key: 'defect', width: 30 }, // N Defect / Remark
    { header: HEADERS[14], key: 'inspectionQty', width: 13 }, // O Inspection Qty
    { header: HEADERS[15], key: 'foundQty', width: 10 }, // P Found Qty
    { header: HEADERS[16], key: 'totalNg', width: 10 }, // Q Total NG
    { header: HEADERS[17], key: 'shift', width: 8 }, // R Shift
    { header: HEADERS[18], key: 'user', width: 16 }, // S Telegram User
    { header: HEADERS[19], key: 'received', width: 18 }, // T Received At
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 22;

  for (const r of rows) {
    const iso = r.inspectionDate.toISOString().slice(0, 10);
    const isNg = (r.qcResult ?? '').toUpperCase() === 'NG';
    const row = ws.addRow({
      date: formatDateForDisplay(iso),
      type: r.inspectionType,
      factory: r.factory,
      process: r.process ?? '',
      job: r.jobNumber,
      blank1: '',
      number: r.number ?? '',
      blank2: '',
      qcCheck: qcCheckDisplay(r.qcCheck),
      machine: r.machineNumber ?? '',
      qcResult: r.qcResult ?? '',
      time: r.inspectionTime ?? '',
      status: r.status ?? '',
      defect: r.defectRemark ?? '',
      inspectionQty: r.inspectionQty ?? '',
      foundQty: r.foundQty ?? '',
      totalNg: r.totalNg ?? '',
      shift: r.shift ?? '',
      user: r.telegramUsername ? `@${r.telegramUsername}` : '',
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
    // Highlight NG rows so problem reports stand out in the export.
    if (isNg) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4E4' } };
      });
      row.getCell('qcResult').font = { bold: true, color: { argb: 'FFC00000' } };
      if (r.totalNg != null) row.getCell('totalNg').font = { bold: true, color: { argb: 'FFC00000' } };
    }
  }

  ws.autoFilter = { from: 'A1', to: 'T1' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Borders + alignment for all data cells
  const thin: ExcelJS.Border = { style: 'thin', color: { argb: 'FFB0B0B0' } };
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
      if (rowNumber > 1) cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  // Auto-tune widths (bounded) based on content length (blank spacers stay narrow)
  const NARROW_BLANK_KEYS = new Set(['blank1', 'blank2']);
  ws.columns.forEach((col) => {
    if (NARROW_BLANK_KEYS.has(String((col as { key?: unknown }).key ?? ''))) {
      col.width = 3;
      return;
    }
    let max = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? '').length;
      if (len > max) max = len;
    });
    col.width = Math.min(32, Math.max(col.width ?? 10, max + 2));
  });

  return wb;
}
