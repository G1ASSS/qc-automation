import { google, type sheets_v4 } from 'googleapis';
import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export const SHEET_HEADERS = [
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
] as const;

let cachedSheets: sheets_v4.Sheets | null = null;

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
  number: number | null;
  machineNumber: string | null;
  inspectionTime: string | null;
  qcCheck: string | null;
  qcResult: string | null;
  status: string | null;
  telegramUsername: string | null;
  receivedAt: Date;
  defectRemark: string | null;
}

export function toSheetValues(input: SheetRowInput): unknown[][] {
  const received = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(input.receivedAt);
  return [
    [
      toDisplayDate(input.inspectionDate),
      input.inspectionType,
      input.factory,
      input.process ?? '',
      input.jobNumber,
      input.number ?? '',
      input.machineNumber ?? '',
      input.inspectionTime ?? '',
      input.qcCheck ?? '',
      input.qcResult ?? '',
      input.status ?? '',
      input.telegramUsername ? `@${input.telegramUsername}` : '',
      received,
      input.defectRemark ?? '',
    ],
  ];
}

export async function ensureHeaderRow(): Promise<void> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) return;
  const tab = config.googleSheetTab;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!A1:N1` });
  const firstRow = res.data.values?.[0] as string[] | undefined;
  const expected = [...SHEET_HEADERS];
  if (!firstRow || firstRow.join('|') !== expected.join('|')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tab}!A1:N1`,
      valueInputOption: 'RAW',
      requestBody: { values: [expected] },
    });
    logger.info('Google Sheets header row ensured');
  }
}

/**
 * Append one QC row. Returns the 1-based row number of the appended row (best-effort via updatedRange).
 * Idempotency note: callers must only call this once per QC record (guarded by sheetSyncStatus),
 * and retries reuse exponential backoff without re-appending on success.
 */
export async function appendSheetRow(input: SheetRowInput): Promise<number | null> {
  const sheets = getSheetsClient();
  const sheetId = config.googleSheetId;
  if (!sheets || !sheetId) throw new Error('Sheets not configured');
  await ensureHeaderRow();
  const tab = config.googleSheetTab;
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tab}!A:N`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: toSheetValues(input) as string[][] },
  });
  const updatedRange = res.data.updates?.updatedRange ?? '';
  const m = /!A(\d+)/.exec(updatedRange);
  return m ? Number(m[1]) : null;
}
