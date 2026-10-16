import { logger } from '../../config/logger.js';
import { config } from '../../config/env.js';

function baseUrl(): string {
  const token = config.telegramBotToken;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  return `https://api.telegram.org/bot${token}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Send a Telegram message with retries. The database save never depends on
 *  this succeeding (replies are best-effort); retries cover Telegram 429
 *  flood-control bursts and transient timeouts that previously dropped
 *  confirmations while the report itself saved fine. */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts?: { replyTo?: number; attempt?: number },
): Promise<void> {
  const token = config.telegramBotToken;
  if (!token) {
    logger.warn({ chatId }, 'Skipped Telegram reply: bot token not configured');
    return;
  }
  const attempt = opts?.attempt ?? 1;
  try {
    const body: Record<string, unknown> = { chat_id: chatId, text };
    if (opts?.replyTo) body.reply_to_message_id = opts.replyTo;
    const res = await fetch(`${baseUrl()}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429 && attempt < 4) {
      let waitMs = 3000;
      try {
        const data = (await res.json()) as { parameters?: { retry_after?: number } };
        if (data.parameters?.retry_after) waitMs = Math.min(data.parameters.retry_after * 1000, 12000);
      } catch { /* fall through with default wait */ }
      logger.warn({ chatId, attempt, waitMs }, 'Telegram flood control: retrying reply');
      await sleep(waitMs);
      await sendTelegramMessage(chatId, text, { replyTo: opts?.replyTo, attempt: attempt + 1 });
      return;
    }
    if (!res.ok) {
      const rbody = await res.text().catch(() => '');
      if (res.status >= 500 && attempt < 3) {
        logger.warn({ chatId, status: res.status, attempt }, 'Telegram 5xx: retrying reply');
        await sleep(2000 * attempt);
        await sendTelegramMessage(chatId, text, { replyTo: opts?.replyTo, attempt: attempt + 1 });
        return;
      }
      logger.error({ chatId, status: res.status, body: rbody.slice(0, 500) }, 'Telegram sendMessage failed');
    }
  } catch (err) {
    if (attempt < 3) {
      logger.warn({ err, chatId, attempt }, 'Telegram send timeout: retrying reply');
      await sleep(2000 * attempt);
      await sendTelegramMessage(chatId, text, { replyTo: opts?.replyTo, attempt: attempt + 1 });
      return;
    }
    logger.error({ err, chatId }, 'Telegram API failure (sendMessage)');
  }
}

export function buildSuccessReply(d: {
  inspectionDate: string;
  factory: string;
  process: string | null;
  jobNumber: string;
  machineNumber: string | null;
  modelNumber?: string | null;
  colour?: string | null;
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
    ...(d.modelNumber ? [`Model: ${d.modelNumber}`] : []),
    ...(d.colour ? [`Colour: ${d.colour}`] : []),
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
