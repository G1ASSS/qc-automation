import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;

/** Run a simple ping with a hard 8-second timeout so a frozen/suspended
 *  Neon DB never hangs the health endpoint or the whole request pipeline. */
export async function checkDatabase(): Promise<'connected' | 'disconnected'> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB health check timed out after 8s')), 8_000),
      ),
    ]);
    return 'connected';
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return 'disconnected';
  }
}
