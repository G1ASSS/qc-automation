import type { Request, Response } from 'express';
import { TelegramUpdateSchema } from '../validators/qcValidator.js';
import { ParsedQCDataSchema } from '../validators/qcValidator.js';
import { parseQCMessage } from '../parsers/qcParser.js';
import { createQcInspection, findExisting, saveFailedMessage } from '../services/qcService.js';
import { enqueueSheetSync } from '../services/sheetSyncService.js';
import {
  buildFailureReply,
  buildSuccessReply,
  sendTelegramMessage,
} from '../integrations/telegram/telegramApi.js';
import { handleTelegramCommand } from '../services/commandService.js';
import { chatAllowlistLog } from '../middleware/security.js';
import { logger } from '../config/logger.js';

interface IncomingMessage {
  message_id: number;
  chat: { id: number; type?: string; title?: string };
  from?: { id: number; username?: string };
  text?: string;
  caption?: string;
  date?: number;
}

export async function telegramWebhookHandler(req: Request, res: Response): Promise<void> {
  let update: unknown;
  try {
    const parsed = TelegramUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Telegram webhook: invalid update shape');
      res.status(200).json({ ok: true, ignored: true });
      return;
    }
    update = parsed.data;
  } catch (err) {
    logger.error({ err }, 'Telegram webhook: failed to parse body');
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  const u = update as { message?: IncomingMessage; channel_post?: IncomingMessage };
  const msg: IncomingMessage | undefined = u.message ?? u.channel_post;
  if (!msg) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  const text = (msg.text ?? msg.caption ?? '').trim();
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  const userId = msg.from?.id;
  const username = msg.from?.username;
  const receivedAt = msg.date ? new Date(msg.date * 1000) : new Date();

  logger.info({ messageId, chatId, hasText: Boolean(text) }, 'Telegram webhook received');

  if (!text) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  // Admin commands (work in groups and DMs).
  if (text.startsWith('/')) {
    try {
      const handled = await handleTelegramCommand({ command: text, chatId, username });
      res.status(200).json({ ok: true, command: handled });
    } catch (err) {
      logger.error({ err, chatId }, 'Telegram command failed');
      res.status(200).json({ ok: true });
    }
    return;
  }

  // Chat allowlist: ignore unauthorized chats (log + 200 so Telegram stops retrying).
  if (!chatAllowlistLog(chatId)) {
    logger.warn({ chatId, messageId }, 'Ignored message from non-allowlisted chat');
    res.status(200).json({ ok: true, ignored: true, reason: 'chat_not_allowed' });
    return;
  }

  try {
    // Idempotency gate: Telegram retries deliveries (at-least-once).
    const existing = await findExisting(chatId, messageId).catch(() => null);
    if (existing) {
      logger.info({ messageId, chatId }, 'Duplicate webhook delivery ignored');
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }

    const result = parseQCMessage(text);
    logger.info({ messageId, chatId, success: result.success }, 'Parsing result');

    if (!result.success || !result.data) {
      const missing = result.errors;
      await saveFailedMessage({
        originalMessage: text,
        telegramMessageId: messageId,
        telegramChatId: chatId,
        telegramUserId: userId,
        telegramUsername: username,
        errorReason: missing.join('; ') || 'unparseable message',
        missingFields: missing,
        receivedAt,
      });
      await sendTelegramMessage(chatId, buildFailureReply(missing));
      res.status(200).json({ ok: true, saved: false, errors: missing });
      return;
    }

    const zod = ParsedQCDataSchema.safeParse(result.data);
    if (!zod.success) {
      const details = zod.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      await saveFailedMessage({
        originalMessage: text,
        telegramMessageId: messageId,
        telegramChatId: chatId,
        telegramUserId: userId,
        telegramUsername: username,
        errorReason: details.join('; '),
        missingFields: details,
        receivedAt,
      });
      await sendTelegramMessage(chatId, buildFailureReply(details));
      res.status(200).json({ ok: true, saved: false, errors: details });
      return;
    }

    const { record, duplicate } = await createQcInspection({
      ...zod.data,
      originalMessage: text,
      telegramMessageId: messageId,
      telegramChatId: chatId,
      telegramUserId: userId,
      telegramUsername: username,
      receivedAt,
    });

    if (duplicate) {
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }

    const rec = record as { id: string };
    enqueueSheetSync(rec.id);
    await sendTelegramMessage(chatId, buildSuccessReply(zod.data));
    res.status(200).json({ ok: true, saved: true, id: rec.id });
  } catch (err) {
    // Never crash on one malformed message; always ack Telegram to avoid retry storms.
    logger.error({ err, messageId, chatId }, 'Webhook processing error');
    res.status(200).json({ ok: true, saved: false, error: 'processing_failed' });
  }
}
