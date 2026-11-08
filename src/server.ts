import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { checkDatabase } from './database/prisma.js';
import { startSheetRetryWorker } from './services/sheetSyncService.js';

async function main(): Promise<void> {
  const app = createApp();
  const port = config.port;

  // Check DB but do NOT block startup — Neon free tier can take several seconds
  // to wake from suspension. The app still serves the dashboard while DB reconnects.
  checkDatabase().then((db) => {
    if (db !== 'connected') {
      logger.warn('Starting without database connection — /ready will report 503 until DB is reachable');
    } else {
      logger.info('Database connected');
    }
  }).catch((err) => {
    logger.error({ err }, 'Database startup check failed');
  });

  // Resume pending Google-Sheets syncs after restarts (idempotent worker).
  try {
    startSheetRetryWorker(60_000);
    logger.info('Sheet retry worker started (60s interval)');
  } catch (err) {
    logger.error({ err }, 'Failed to start sheet retry worker');
  }

  app.listen(port, () => {
    logger.info({ port, env: config.nodeEnv }, 'QC automation server listening');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
