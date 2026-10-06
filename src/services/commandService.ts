import { prisma } from '../database/prisma.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { checkDatabase } from '../database/prisma.js';
import { isSheetsConfigured } from '../integrations/google-sheets/sheetsClient.js';
import { sendTelegramMessage } from '../integrations/telegram/telegramApi.js';
import { getTodayStats, serializeQcRow } from './qcService.js';
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
  '/summary [YYYY-MM-DD] - daily work summary',
  '/night [YYYY-MM-DD] - night shift window 20:00-08:00',
  '/mywork [YYYY-MM-DD] - your own inspections today (proves what you did)',
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
  if (cmd === '/summary' || cmd === '/daily') {
    try {
      const { buildDailySummary } = await import('./summaryService.js');
      const m = /^\/(?:summary|daily)(?:@\w+)?\s*(\d{4}-\d{2}-\d{2})?/.exec(command.trim());
      const date = (m && m[1]) || todayBangkokISO();
      const s = await buildDailySummary(date);
      const text = s.text.length > 3900 ? s.text.slice(0, 3900) + '\n...(truncated)' : s.text;
      await sendTelegramMessage(chatId, text);
    } catch (err) {
      logger.error({ err }, 'Failed to build /summary');
      await sendTelegramMessage(chatId, 'Could not build daily summary. Try again later.');
    }
    return true;
  }
  if (cmd === '/mywork') {
    try {
      const { prisma: p2 } = await import('../database/prisma.js');
      const m = /^\/mywork(?:@\w+)?\s*(\d{4}-\d{2}-\d{2})?/.exec(command.trim());
      const date = (m && m[1]) || todayBangkokISO();
      const me = (opts.username ?? '').trim();
      if (!me) { await sendTelegramMessage(chatId, 'Your Telegram username is hidden - set a @username first, then /mywork works.'); return true; }
      const start = new Date(date + 'T00:00:00.000Z');
      const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
      const rows = await p2.qcInspection.findMany({ where: { inspectionDate: { gte: start, lt: end }, telegramUsername: { equals: me, mode: 'insensitive' } }, orderBy: { createdAt: 'asc' }, take: 500 });
      if (rows.length === 0) { await sendTelegramMessage(chatId, '@' + me + ' - no inspections on ' + date + '. If you reported today, check the username matches.'); return true; }
      const ok = rows.filter((r) => (r.qcResult ?? '').toUpperCase() === 'OK').length;
      const ng = rows.filter((r) => (r.qcResult ?? '').toUpperCase() === 'NG').length;
      const jm = new Map();
      for (const r of rows) { const l = jm.get(r.jobNumber) ?? []; l.push(r.machineNumber ?? '-'); jm.set(r.jobNumber, l); }
      const jobStr = [...jm.entries()].map(([j, ms]) => j + '(' + ms.join(',') + ')').join(' ');
      await sendTelegramMessage(chatId, '@' + me + ' ' + date + ': ' + rows.length + ' inspections (OK ' + ok + ', NG ' + ng + ')\n' + jobStr);
    } catch (err) {
      logger.error({ err }, 'Failed /mywork');
      await sendTelegramMessage(chatId, 'Could not load your work. Try again later.');
    }
    return true;
  }
  if (cmd === '/night') {
    try {
      const { buildNightSummary } = await import('./summaryService.js');
      const m = /^\/night(?:@\w+)?\s*(\d{4}-\d{2}-\d{2})?/.exec(command.trim());
      const date = (m && m[1]) || todayBangkokISO();
      const s = await buildNightSummary(date);
      const text = s.text.length > 3900 ? s.text.slice(0, 3900) + '\n...(truncated)' : s.text;
      await sendTelegramMessage(chatId, text);
    } catch (err) {
      logger.error({ err }, 'Failed /night');
      await sendTelegramMessage(chatId, 'Could not build night summary. Try again later.');
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

export async function getDashboardStats(username?: string): Promise<{
  today: Awaited<ReturnType<typeof getTodayStats>>;
  recent: unknown[];
  pendingSync: number;
  failedSync: number;
  failedMessages: number;
}> {
  const who = (username ?? "").trim().replace(/^@/, "");
  const today = await getTodayStats(todayBangkokISO(), who || undefined);
  const mine = who ? { telegramUsername: { equals: who, mode: "insensitive" as const } } : {};
  const [recentRaw, pendingSync, failedSync, failedMessages] = await Promise.all([
    prisma.qcInspection.findMany({ where: mine, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.qcInspection.count({ where: { ...mine, sheetSyncStatus: 'PENDING' } }),
    prisma.qcInspection.count({ where: { ...mine, sheetSyncStatus: 'FAILED' } }),
    prisma.failedMessage.count({ where: { resolved: false } }),
  ]);
  const recent = (recentRaw as unknown as Record<string, unknown>[]).map(serializeQcRow);
  return { today, recent, pendingSync, failedSync, failedMessages };
}
