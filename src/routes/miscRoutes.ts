import { Router } from 'express';
import { healthHandler, readyHandler } from '../controllers/healthController.js';
import { deleteWebhookHandler, setWebhookHandler } from '../controllers/adminController.js';
import { getDashboardStats } from '../services/commandService.js';
import { prisma } from '../database/prisma.js';
import { serializeQcRow } from '../services/qcService.js';

export const miscRouter = Router();

miscRouter.get('/health', healthHandler);
miscRouter.get('/ready', readyHandler);
miscRouter.post('/api/admin/telegram/set-webhook', setWebhookHandler);
miscRouter.post('/api/admin/telegram/delete-webhook', deleteWebhookHandler);

miscRouter.get('/api/admin/stats', async (req, res, next) => {
  try {
    const u = typeof req.query.user === "string" ? req.query.user : undefined;
    res.json({ ok: true, ...(await getDashboardStats(u)) });
  } catch (err) {
    next(err);
  }
});

miscRouter.get('/api/admin/failed', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const rows = await prisma.failedMessage.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    res.json({
      ok: true,
      data: rows.map((r) => ({
        ...r,
        telegramChatId: r.telegramChatId != null ? String(r.telegramChatId) : null,
        telegramUserId: r.telegramUserId != null ? String(r.telegramUserId) : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

miscRouter.get('/api/admin/pending-sync', async (_req, res, next) => {
  try {
    const rows = await prisma.qcInspection.findMany({
      where: { sheetSyncStatus: { in: ['PENDING', 'FAILED'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ ok: true, data: rows.map((r) => serializeQcRow(r as unknown as Record<string, unknown>)) });
  } catch (err) {
    next(err);
  }
});
