import pino from 'pino';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Never log secrets: redact known secret-bearing keys anywhere in logged objects.
export const logger = pino({
  level,
  redact: {
    paths: [
      'botToken',
      'TELEGRAM_BOT_TOKEN',
      'telegramBotToken',
      '*.botToken',
      'GOOGLE_SERVICE_ACCOUNT_JSON',
      'googleServiceAccountJson',
      '*.googleServiceAccountJson',
      'DATABASE_URL',
      'databaseUrl',
      '*.password',
      'password',
      'authorization',
      'Authorization',
      'req.headers.authorization',
      'req.headers["x-telegram-bot-api-secret-token"]',
    ],
    censor: '[REDACTED]',
  },
});
