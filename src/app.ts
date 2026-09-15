import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';
import { webhookRouter } from './routes/webhookRoutes.js';
import { qcRouter } from './routes/qcRoutes.js';
import { miscRouter } from './routes/miscRoutes.js';
import { errorHandler } from './middleware/security.js';
import { dashboardHtml } from './controllers/dashboardController.js';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ chatId: (req.body as { message?: { chat?: { id?: number } } })?.message?.chat?.id }),
      redact: ['req.headers.authorization', 'req.headers["x-telegram-bot-api-secret-token"]', 'req.body.token'],
    }),
  );

  const limiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false });
  app.use(limiter);
  const webhookLimiter = rateLimit({ windowMs: 60_000, max: 600, standardHeaders: true, legacyHeaders: false });

  app.get('/', (_req, res) => {
    res.type('html').send(dashboardHtml());
  });

  app.use('/webhooks', webhookLimiter, webhookRouter);
  app.use('/api/qc', qcRouter);
  app.use(miscRouter);

  // Malformed-JSON guard: express.json throws SyntaxError — ack webhooks with 200, 400 elsewhere.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError) {
      logger.warn({ path: req.path }, 'Invalid JSON body');
      if (req.path.startsWith('/webhooks/')) {
        res.status(200).json({ ok: true, ignored: true });
        return;
      }
      res.status(400).json({ ok: false, error: 'invalid_json' });
      return;
    }
    next(err as Error);
  });

  app.use(errorHandler);
  return app;
}
