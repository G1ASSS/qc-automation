import { prisma } from '../database/prisma.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { checkDatabase } from '../database/prisma.js';
import { isSheetsConfigured } from '../integrations/google-sheets/sheetsClient.js';
import { sendTelegramMessage } from '../integrations/telegram/telegramApi.js';
import { getTodayStats } from './qcService.js';
import { todayBangkokISO } from '../utils/timezone.js';

const HELP_TEXT = [
  '🤖 QC Report Bot',
  '',
  'Send a QC inspection report and I will save it automatically.',
  '',
  'Commands:',
  '/start - welcome message',
  '/help - show this help',
  '/status - system status',
  '/today - today\'s QC summary',
  '/export - get the Excel export link',
  '',
  'Report format example:',
  'IPQC Random Inspection 15/09/2026',
  'Factory 2 Row hole',
  'Job Number: TD-HM-014',
  'Number: 4',
  'Machine No: 23',
  '⏰Time: 15:03',
  '📌QC check 100%=1pc.',
  '✅QC check Ok.',
  '❌unfinished',
].join('\n');

export async function handleTelegramCommand(opts: {
  command: string;
  chatId: number;
  username?: string;
}): Promise<boolean> {
  const { command, chatId } = opts;
  const cmd = command.split('@')[0].split(' ')[0].toLowerCase();

  if (cmd === '/start') {
    await sendTelegramMessage(chatId, '👋 Welcome to the QC Report Bot.\nSend a QC inspection report and I will save it to the database and Google Sheets.\nType /help for the format.');
    return true;
  }
  if (cmd === '/help') {
    await sendTelegramMessage(chatId, HELP_TEXT);
    return true;
  }
  if (cmd === '/status') {
    const db = await checkDatabase().catch(() => 'disconnected' as const);
    const sheets = isSheetsConfigured() ? 'configured' : 'not configured';
    const telegram = config.telegramBotToken ? 'configured' : 'not configured';
    await sendTelegramMessage(chatId, `🟢 Status\nDatabase: ${db}\nTelegram: ${telegram}\nSheets: ${sheets}`);
    return true;
  }
  if (cmd === '/today') {
    try {
      const today = todayBangkokISO();
      const stats = await getTodayStats(today);
      const lines = [
        '📊 Today\'s QC Report',
        '',
        `Total: ${stats.total}`,
        `OK: ${stats.ok}`,
        `NG: ${stats.ng}`,
        `Unfinished: ${stats.unfinished}`,
      ];
      if (stats.byFactory.length > 0) {
        lines.push('', ...stats.byFactory.map((f) => `${f.factory}: ${f.total}`));
      }
      await sendTelegramMessage(chatId, lines.join('\n'));
    } catch (err) {
      logger.error({ err }, 'Failed to build /today summary');
      await sendTelegramMessage(chatId, '⚠️ Could not load today\'s summary. Please try again later.');
    }
    return true;
  }
  if (cmd === '/export') {
    const base = (config.publicBaseUrl ?? '').replace(/\/$/, '');
    if (base) {
      await sendTelegramMessage(chatId, `📥 Download today's Excel export:\n${base}/api/qc/export.xlsx`);
    } else {
      await sendTelegramMessage(chatId, '📥 Excel export is available at GET /api/qc/export.xlsx on the API server.');
    }
    return true;
  }
  return false;
}

export async function getDashboardStats(): Promise<{
  today: Awaited<ReturnType<typeof getTodayStats>>;
  recent: unknown[];
  pendingSync: number;
  failedSync: number;
  failedMessages: number;
}> {
  const today = await getTodayStats(todayBangkokISO());
  const [recent, pendingSync, failedSync, failedMessages] = await Promise.all([
    prisma.qcInspection.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.qcInspection.count({ where: { sheetSyncStatus: 'PENDING' } }),
    prisma.qcInspection.count({ where: { sheetSyncStatus: 'FAILED' } }),
    prisma.failedMessage.count({ where: { resolved: false } }),
  ]);
  return { today, recent, pendingSync, failedSync, failedMessages };
}
