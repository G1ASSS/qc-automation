import type { Request, Response } from 'express';
import { checkDatabase } from '../database/prisma.js';
import { config } from '../config/env.js';
import { isSheetsConfigured } from '../integrations/google-sheets/sheetsClient.js';

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const database = await checkDatabase();
  res.json({
    status: 'ok',
    database,
    telegram: config.telegramBotToken ? 'configured' : 'not configured',
    sheets: isSheetsConfigured() ? 'configured' : 'not configured',
  });
}

export async function readyHandler(_req: Request, res: Response): Promise<void> {
  const database = await checkDatabase();
  if (database !== 'connected') {
    res.status(503).json({ ready: false, database });
    return;
  }
  res.json({ ready: true, database });
}
