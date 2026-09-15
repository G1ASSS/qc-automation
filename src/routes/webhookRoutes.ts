import { Router, text } from 'express';
import { telegramWebhookHandler } from '../controllers/webhookController.js';
import { wecomMessageHandler, wecomVerifyHandler } from '../controllers/wecomController.js';
import { telegramSecretCheck } from '../middleware/security.js';

export const webhookRouter = Router();

webhookRouter.post('/telegram', telegramSecretCheck, telegramWebhookHandler);
webhookRouter.get('/wecom', wecomVerifyHandler);
webhookRouter.post('/wecom', text({ type: '*/*', limit: '256kb' }), wecomMessageHandler);
