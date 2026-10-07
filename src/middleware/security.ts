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

/** Shared-secret gate for destructive admin APIs. Pass
 *  `Authorization: Bearer <ADMIN_TOKEN>` or `?token=<ADMIN_TOKEN>`.
 *  Responds 503 when ADMIN_TOKEN is not configured, 403 on mismatch. */
export function requireAdminToken(req: Request, res: Response): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(503).json({ ok: false, error: 'admin_token_not_configured' });
    return false;
  }
  const header = req.header('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const query = typeof req.query.token === 'string' ? req.query.token : '';
  const got = bearer || query;
  if (got !== expected) {
    logger.warn('Rejected admin API call: bad token');
    res.status(403).json({ ok: false, error: 'forbidden' });
    return false;
  }
  return true;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, 'Unhandled API error');
  if (res.headersSent) return;
  const status = typeof err === 'object' && err !== null && 'status' in err ? Number((err as { status: unknown }).status) || 500 : 500;
  res.status(status).json({ ok: false, error: 'internal_error' });
}
