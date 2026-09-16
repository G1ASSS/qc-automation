import { logger } from '../../config/logger.js';
import { config } from '../../config/env.js';

function baseUrl(): string {
  const token = config.telegramBotToken;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  return `https://api.telegram.org/bot${token}`;
}

export async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  const token = config.telegramBotToken;
  if (!token) {
    logger.warn({ chatId }, 'Skipped Telegram reply: bot token not configured');
    return;
  }
  try {
    const res = await fetch(`${baseUrl()}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ chatId, status: res.status, body: body.slice(0, 500) }, 'Telegram sendMessage failed');
    }
  } catch (err) {
    logger.error({ err, chatId }, 'Telegram API failure (sendMessage)');
  }
}

export function buildSuccessReply(d: {
  inspectionDate: string;
  factory: string;
  process: string | null;
  jobNumber: string;
  machineNumber: string | null;
  inspectionTime: string | null;
  qcResult: string | null;
  status: string | null;
  defectRemark?: string | null;
  shift?: string | null;
  inspectionQty?: number | null;
  foundQty?: number | null;
  totalNg?: number | null;
}): string {
  const displayDate = d.inspectionDate.split('-').reverse().join('/');
  const lines = [
    '✅ QC report saved successfully.',
    '',
    `Date: ${displayDate}`,
    `Factory: ${d.factory}`,
    `Process: ${d.process ?? '-'}`,
    `Job Number: ${d.jobNumber}`,
    `Machine: ${d.machineNumber ?? '-'}`,
    `Time: ${d.inspectionTime ?? '-'}`,
    `QC Result: ${d.qcResult ?? '-'}`,
    `Status: ${d.status ?? '-'}`,
    `Defect: ${d.defectRemark ?? '-'}`,
  ];
  if (d.shift ?? d.inspectionQty ?? d.foundQty ?? d.totalNg) {
    lines.push(
      `Shift: ${d.shift ?? '-'}`,
      `Inspection Qty: ${d.inspectionQty ?? '-'}`,
      `Found Qty: ${d.foundQty ?? '-'}`,
      `Total NG: ${d.totalNg ?? '-'}`,
    );
  }
  return lines.join('\n');
}

export function buildFailureReply(missingFields: string[]): string {
  const first = missingFields[0] ?? 'required fields';
  return [
    '⚠️ QC report could not be processed.',
    '',
    'Missing or invalid field:',
    first,
    '',
    'Please check the report format and send again.',
  ].join('\n');
}
