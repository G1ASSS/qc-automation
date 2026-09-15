import { startSheetRetryWorker } from '../services/sheetSyncService.js';
import { logger } from '../config/logger.js';

/** Standalone entrypoint if the retry worker should run as its own process. */
if (require.main === module) {
  logger.info('Starting standalone sheet-retry worker');
  startSheetRetryWorker(60_000);
}
