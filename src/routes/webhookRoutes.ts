import { Router } from 'express';
import { telegramWebhookHandler } from '../controllers/webhookController.js';
import { telegramSecretCheck } from '../middleware/security.js';

export const webhookRouter = Router();

webhookRouter.post('/telegram', telegramSecretCheck, telegramWebhookHandler);
