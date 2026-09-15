import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

/** Reject webhook calls whose secret-token header does not match. */
export function telegramSecretCheck(req: Request, res: Response, next: NextFunction): void {
  const expected = config.telegramWebhookSecret;
  if (!expected) {
    next();
    return;
  }
  const got = req.header('x-telegram-bot-api-secret-token');
  if (got !== expected) {
    logger.warn('Rejected Telegram webhook: bad secret token');
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }
  next();
}

/** Only allow configured chats to submit QC data (open mode when list is empty). */
export function chatAllowlistLog(chatId: number | string): boolean {
  const allow = config.allowedChatIds;
  if (allow.length === 0) return true;
  return allow.includes(String(chatId));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, 'Unhandled API error');
  if (res.headersSent) return;
  const status = typeof err === 'object' && err !== null && 'status' in err ? Number((err as { status: unknown }).status) || 500 : 500;
  res.status(status).json({ ok: false, error: 'internal_error' });
}
