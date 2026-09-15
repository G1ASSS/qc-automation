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
  });

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;

export async function checkDatabase(): Promise<'connected' | 'disconnected'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return 'disconnected';
  }
}
