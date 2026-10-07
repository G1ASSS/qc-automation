import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/database/prisma.js', () => ({
  prisma: {
    failedMessage: { findMany: vi.fn(), count: vi.fn() },
    qcInspection: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  },
  checkDatabase: vi.fn(),
}));

import { prisma } from '../../src/database/prisma.js';
import { createApp } from '../../src/app.js';

describe('admin failed endpoint', () => {
  it('serializes BigInt chat/user ids instead of crashing', async () => {
    vi.mocked(prisma.failedMessage.findMany).mockResolvedValue([
      {
        id: 'f1',
        originalMessage: 'hello',
        telegramMessageId: 7,
        telegramChatId: BigInt(-1004410183656),
        telegramUserId: BigInt(1760831587),
        telegramUsername: 'someone',
        errorReason: 'nope',
        missingFields: [],
        receivedAt: new Date('2026-10-07T00:00:00Z'),
        retryCount: 0,
        resolved: false,
        createdAt: new Date('2026-10-07T00:00:00Z'),
        updatedAt: new Date('2026-10-07T00:00:00Z'),
      },
    ] as never);
    const res = await request(createApp()).get('/api/admin/failed?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data[0].telegramChatId).toBe('-1004410183656');
    expect(res.body.data[0].telegramUserId).toBe('1760831587');
  });
});
