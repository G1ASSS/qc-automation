import type { Request, Response } from 'express';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

function apiBase(): string {
  const token = config.telegramBotToken;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  return `https://api.telegram.org/bot${token}`;
}

export async function setWebhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const baseUrl = (req.body?.url as string | undefined) ?? config.publicBaseUrl;
    if (!baseUrl) {
      res.status(400).json({ ok: false, error: 'Provide { "url": "https://..." } or set PUBLIC_BASE_URL' });
      return;
    }
    const url = `${baseUrl.replace(/\/$/, '')}/webhooks/telegram`;
    const body: Record<string, string> = { url };
    if (config.telegramWebhookSecret) body.secret_token = config.telegramWebhookSecret;
    const r = await fetch(`${apiBase()}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    logger.info({ url, data }, 'Telegram setWebhook result');
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, url, telegram: data });
  } catch (err) {
    logger.error({ err }, 'setWebhook failed');
    res.status(500).json({ ok: false, error: 'set_webhook_failed' });
  }
}

export async function deleteWebhookHandler(_req: Request, res: Response): Promise<void> {
  try {
    const r = await fetch(`${apiBase()}/deleteWebhook?drop_pending_updates=false`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    logger.info({ data }, 'Telegram deleteWebhook result');
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, telegram: data });
  } catch (err) {
    logger.error({ err }, 'deleteWebhook failed');
    res.status(500).json({ ok: false, error: 'delete_webhook_failed' });
  }
}
