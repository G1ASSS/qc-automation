import { google, type sheets_v4 } from 'googleapis';
import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { qcCheckDisplay, factoryRank, processRank } from '../../services/excelExportService.js';

export const SHEET_HEADERS = [
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
  'Model Number',
  'Colour',
] as const;

/** Grid width used for reads/writes (A:AB): wider than the 20 real columns so
 *  overflow from misplaced rows round-trips losslessly until rescued. */
export const GRID_WIDTH = 28;
const GRID_LAST_COL = 'AB';

let cachedSheets: sheets_v4.Sheets | null = null;

// Serialize all Sheets mutations: concurrent append/tidy calls race on the
// grid (one call's row positions go stale while another inserts/sorts).
let sheetsQueue: Promise<void> = Promise.resolve();

function runSheetsExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const task = sheetsQueue.then(() => fn());
  sheetsQueue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

function loadServiceAccount(): { client_email: string; private_key: string } {
  const raw = config.googleServiceAccountJson;
  if (raw) {
    const trimmed = raw.trim();
    // Allow base64-encoded JSON as well (common in cloud env vars).
    const jsonText = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonText) as { client_email?: string; private_key?: string };
    if (!parsed.client_email || !parsed.private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is invalid');
    return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, '\n') };
  }
  const file = config.googleServiceAccountKeyFile;
  if (file) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { client_email?: string; private_key?: string };
    if (!parsed.client_email || !parsed.private_key) throw new Error('Service-account file is invalid');
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  }
  throw new Error('Google service-account credentials are not configured');
}

export function getSheetsClient(): sheets_v4.Sheets | null {
  if (cachedSheets) return cachedSheets;
  if (!config.googleSheetId) {
    logger.warn('GOOGLE_SHEET_ID not configured — Sheets sync disabled');
    return null;
  }
  try {
    const creds = loadServiceAccount();
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    cachedSheets = google.sheets({ version: 'v4', auth });
    return cachedSheets;
  } catch (err) {
    logger.error({ err }, 'Failed to initialise Google Sheets client');
    return null;
  }
}

export function isSheetsConfigured(): boolean {
  return Boolean(config.googleSheetId) && Boolean(config.googleServiceAccountJson ?? config.googleServiceAccountKeyFile);
}

function toDisplayDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export interface SheetRowInput {
  inspectionDate: string; // ISO
  inspectionType: string;
  factory: string;
  process: string | null;
  jobNumber: string;
  number: string | null;
  machineNumber: string | null;
  inspectionTime: string | null;
  qcCheck: string | null;
  qcResult: string | null;
  status: string | null;
  telegramUsername: string | null;
  receivedAt: Date;
  modelNumber?: string | null;
  colour?: string | null;
  defectRemark: string | null;
  shift: string | null;
  inspectionQty: number | null;
  foundQty: number | null;
  totalNg: number | null;
}

export function formatReceivedBangkok(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function toSheetValues(input: SheetRowInput): unknown[][] {
  const received = formatReceivedBangkok(input.receivedAt);
  return [
    [
      toDisplayDate(input.inspectionDate), // A Date
      input.inspectionType, // B Inspection Type
      input.factory, // C Factory
      input.process ?? '', // D Process
      input.jobNumber, // E Job Number
      '', // F (blank spacer)
      input.number ?? '', // G Number
      '', // H (blank spacer)
      qcCheckDisplay(input.qcCheck), // I QC Check (pcs count only)
      input.machineNumber ?? '', // J Machine No
      input.qcResult ?? '', // K QC Result
      input.inspectionTime ?? '', // L Time
      input.status ?? '', // M Status
      input.defectRemark ?? '', // N Defect / Remark
      input.inspectionQty ?? '', // O Inspection Qty
      input.foundQty ?? '', // P Found Qty
      input.totalNg ?? '', // Q Total NG
      input.shift ?? '', // R Shift
      input.telegramUsername ? `@${input.telegramUsername}` : '', // S Telegram User
      received, // T Received At
      input.modelNumber ?? '', // U Model Number
      input.colour ?? '', // V Colour
    ],
  ];
}

export async function ensureHeaderRow(): Promise<void> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) return;
  const tab = config.googleSheetTab;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!A1:V1` });
  const firstRow = res.data.values?.[0] as string[] | undefined;
  const expected = [...SHEET_HEADERS];
  if (!firstRow || firstRow.join('|') !== expected.join('|')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tab}!A1:V1`,
      valueInputOption: 'RAW',
      requestBody: { values: [expected] },
    });
    logger.info('Google Sheets header row ensured');
  }
}

/**
 * Append one QC row. Returns the 1-based row number of the appended row, or
 * null when the API response carries no usable range (callers treat null as
 * "unverified" — see syncOneRecordToSheets, which reads the row back).
 */
export async function appendSheetRow(input: SheetRowInput): Promise<number | null> {
  return runSheetsExclusive(async () => appendInner(input));
}

async function appendInner(input: SheetRowInput): Promise<number | null> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) throw new Error('Sheets not configured');
  await ensureHeaderRow();
  const tab = config.googleSheetTab;
  const values = toSheetValues(input) as string[][];
  // Write at an explicit row. Never use values.append here: once the header
  // contains blank spacer cells, Sheets' append table-detection splits the
  // grid into multiple tables and new rows land in the wrong columns.
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = await readDataRows();
    const n = (rows?.length ?? 0) + 2; // first empty grid row
    const occupant = rows?.[n - 2];
    if (occupant && occupant.some((v) => String(v ?? '').trim() !== '')) {
      logger.warn({ row: n, attempt }, 'Sheets target row occupied, re-reading');
      continue;
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tab}!A${n}:V${n}`,
      // RAW: preserve exact text (e.g. Number "00892496" keeps leading zeros).
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    logger.info({ rowNumber: n, attempt }, 'Sheets row written at explicit position');
    try {
      await tidyInner();
    } catch (err) {
      logger.warn({ err }, 'Sheet tidy failed (row is still saved)');
    }
    return n;
  }
  throw new Error('Sheets target row occupied after retries');
}

/** Sort key for a sheet data row: column A holds DD/MM/YYYY (display format). */
export function sheetRowDateKey(row: unknown[]): number {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String((row as unknown[])[0] ?? '').trim());
  if (m) return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String((row as unknown[])[0] ?? '').trim());
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const t = Date.parse(String((row as unknown[])[0] ?? ''));
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

/** Pure stable sort of sheet data rows: Date (A), Factory number (C), process group (D), arrival. */
export function sortSheetRows(rows: unknown[][]): unknown[][] {
  const padded = padRows(rows);
  return padded
    .map((r, i) => ({ r, i }))
    .sort(comparePlacedRows)
    .map((d) => d.r);
}

/**
 * Re-order existing sheet data rows (below the header) by Date ascending.
 * Same-date rows keep their relative arrival order. Time values are untouched.
 */
export async function sortSheetByDate(): Promise<void> {
  return runSheetsExclusive(async () => {
    const rows = await readDataRows();
    if (!rows || rows.length < 2) return;
    const sorted = sortSheetRows(rows);
    if (rowsEqual(padRows(rows), sorted)) return;
    await writeDataRows(sorted);
    logger.info({ count: rows.length }, 'Google Sheets rows re-sorted by date');
  });
}

function rowsEqual(a: unknown[][], b: unknown[][]): boolean {
  return a.length === b.length && a.every((r, i) => {
    const o = b[i] as unknown[];
    return r.length === o.length && (r as unknown[]).every((v, j) => v === o[j]);
  });
}

function padRows(rows: unknown[][]): unknown[][] {
  return rows.map((r) => {
    const copy = [...r];
    while (copy.length < GRID_WIDTH) copy.push('');
    return copy;
  });
}

async function readDataRows(): Promise<unknown[][] | null> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) return null;
  // Read past column T on purpose: misplaced rows can overflow there and
  // must be visible to the rescue pass (and preserved, never truncated).
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${config.googleSheetTab}!A2:AB`,
  });
  return (res.data.values ?? []) as unknown[][];
}

async function writeDataRows(rows: unknown[][]): Promise<void> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${config.googleSheetTab}!A2:${GRID_LAST_COL}${rows.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
}

/**
 * Converge the sheet to the desired state: QC Check column holds just the pcs
 * count (e.g. "100%=1pc." -> 1) and rows are sorted by Date ascending.
 * Runs after our own appends and periodically (retry worker) so rows written
 * by other/older bot instances are normalized too. Writes only when changed.
 */
export async function tidySheet(): Promise<void> {
  return runSheetsExclusive(() => tidyInner());
}

/** A row whose 20 values start at column I instead of A (A-H empty). */
export function isShiftedRow(row: unknown[]): boolean {
  const cells = row as unknown[];
  for (let i = 0; i < 8; i++) {
    if (String(cells[i] ?? '').trim() !== '') return false;
  }
  const d = String(cells[8] ?? '').trim();
  if (!/^(\d{1,2})\/(\d{1,2})\/(\d{4})/.test(d) && !/^(\d{4})-(\d{2})-(\d{2})/.test(d)) return false;
  if (String(cells[12] ?? '').trim() === '') return false; // job present at M
  // Bot-written marker: never touch hand-typed rows without one.
  if (!cells.some((v) => typeof v === 'string' && v.startsWith('@'))) return false;
  return true;
}

/** Shift a misplaced row's values back to columns A-T (drops overflow past AB). */
export function rescueShiftedRow(row: unknown[]): unknown[] {
  const tail = (row as unknown[]).slice(8);
  while (tail.length < SHEET_HEADERS.length) tail.push('');
  return tail.slice(0, SHEET_HEADERS.length);
}

/** Identity of a placed row (Date|Job|Time|Received). */
export function sheetRowKey(row: unknown[]): string {
  const c = (i: number): string => String((row as unknown[])[i] ?? '').trim();
  return `${c(0)}|${c(4)}|${c(11)}|${c(19)}`; // Date|Job|Time|Received
}

/** Build the sheet key for a database record (same shape as sheetRowKey). */
export function dbRowSheetKey(rec: {
  inspectionDate: Date | string;
  jobNumber: string;
  inspectionTime: string | null;
  receivedAt: Date;
}): string {
  const iso = rec.inspectionDate instanceof Date ? rec.inspectionDate.toISOString().slice(0, 10) : String(rec.inspectionDate).slice(0, 10);
  return `${toDisplayDate(iso)}|${(rec.jobNumber ?? '').trim()}|${(rec.inspectionTime ?? '').trim()}|${formatReceivedBangkok(rec.receivedAt)}`;
}

async function getTabSheetId(tab: string): Promise<number | null> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) return null;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId, fields: 'sheets.properties' });
  const found = (meta.data.sheets ?? []).find((s) => s.properties?.title === tab);
  return found?.properties?.sheetId ?? null;
}

/** Delete sheet data rows matching the given keys (first match per key).
 *  Returns how many rows were removed. Serialized with other sheet writes. */
export async function removeSheetRowsByKeys(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  return runSheetsExclusive(async () => {
    const sheets = getSheetsClient();
    const sheetId = config.googleSheetId;
    if (!sheets || !sheetId) throw new Error('Sheets not configured');
    const rows = await readDataRows();
    if (!rows || rows.length === 0) return 0;
    const remaining = new Set(keys);
    const targets: number[] = [];
    rows.forEach((r, i) => {
      if (remaining.size === 0) return;
      const k = sheetRowKey(r);
      if (remaining.has(k)) {
        remaining.delete(k);
        targets.push(i + 2); // 1-based sheet row (header is row 1)
      }
    });
    if (targets.length === 0) return 0;
    const tabId = await getTabSheetId(config.googleSheetTab);
    if (tabId == null) throw new Error('Sheet tab not found');
    targets.sort((a, b) => b - a); // bottom-up so positions stay valid
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: targets.map((row) => ({
          deleteDimension: { range: { sheetId: tabId, dimension: 'ROWS', startIndex: row - 1, endIndex: row } },
        })),
      },
    });
    logger.info({ removed: targets.length }, 'Google Sheets rows deleted by key');
    return targets.length;
  });
}

/** Comparator shared by sortSheetRows and flag bookkeeping (must stay identical). */
function comparePlacedRows(a: { r: unknown[]; i: number }, b: { r: unknown[]; i: number }): number {
  const cell = (x: { r: unknown[] }, k: number): string => String((x.r as unknown[])[k] ?? '');
  return (
    sheetRowDateKey(a.r) - sheetRowDateKey(b.r) ||
    factoryRank(cell(a, 2)) - factoryRank(cell(b, 2)) ||
    cell(a, 2).toLowerCase().localeCompare(cell(b, 2).toLowerCase()) ||
    processRank(cell(a, 3)) - processRank(cell(b, 3)) ||
    cell(a, 3).toLowerCase().localeCompare(cell(b, 3).toLowerCase()) ||
    a.i - b.i
  );
}

async function tidyInner(): Promise<void> {
  const rows = await readDataRows();
  if (rows === null) return;
  // Repair header first: other/older bot instances may have overwritten it
  // with a stale layout, which would misalign every column below.
  try {
    await ensureHeaderRow();
  } catch (err) {
    logger.warn({ err }, 'Sheet header repair failed');
  }
  if (rows.length === 0) return;
  // 1. Rescue misplaced rows (values starting at column I instead of A).
  rows.forEach((r, i) => {
    if (!isShiftedRow(r)) return;
    const fixed = rescueShiftedRow(r);
    const key = sheetRowKey(fixed);
    const dupAt = rows.findIndex((o, j) => j !== i && !isShiftedRow(o) && sheetRowKey(o) === key);
    rows[i] = fixed;
    logger.warn({ row: i + 2, key, duplicateOf: dupAt >= 0 ? dupAt + 2 : null }, 'Rescued misplaced sheet row');
  });
  // 2. Normalize QC Check to the pcs count.
  const QC_CHECK_COL = 8; // column I
  const normalized = padRows(rows).map((r) => {
    const copy = [...r];
    const v = copy[QC_CHECK_COL];
    if (typeof v === 'string' && v !== '') {
      const display = qcCheckDisplay(v);
      if (display !== v) copy[QC_CHECK_COL] = display;
    }
    return copy;
  });
  // 3. Sort into report order; full-width rewrite also clears stale overflow.
  const order = normalized.map((_, i) => i).sort((a, b) => comparePlacedRows({ r: normalized[a]!, i: a }, { r: normalized[b]!, i: b }));
  const sorted = order.map((i) => normalized[i]!);
  if (!rowsEqual(padRows(rows), sorted)) {
    await writeDataRows(sorted);
    logger.info({ count: rows.length }, 'Google Sheets tidied (QC Check numeric + date order)');
  }
}
