import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../src/database/prisma.js', () => ({
  prisma: { qcInspection: { findUnique: vi.fn() } },
  checkDatabase: vi.fn(),
}));

vi.mock('../../src/services/qcService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/qcService.js')>();
  return { ...actual, createQcInspection: vi.fn(), findExisting: vi.fn(), saveFailedMessage: vi.fn() };
});

vi.mock('../../src/services/sheetSyncService.js', () => ({ enqueueSheetSync: vi.fn() }));
vi.mock('../../src/integrations/telegram/telegramApi.js', () => ({
  sendTelegramMessage: vi.fn(),
  buildSuccessReply: () => '✅ QC report saved successfully.',
  buildFailureReply: () => '⚠️ QC report could not be processed.',
}));

import { telegramWebhookHandler } from '../../src/controllers/webhookController.js';
import { findExisting, createQcInspection } from '../../src/services/qcService.js';

const SAMPLE = `IPQC Random Inspection 15/09/2026
Factory 2 Row hole
Job Number: TD-HM-014
Number: 4
Machine No: 23
⏰Time: 15:03
📌QC check 100%=1pc.
✅QC check Ok.
❌unfinished`;

function mockRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; code: { status?: number; body?: unknown } } {
  const state: { status?: number; body?: unknown } = {};
  const json = vi.fn((body: unknown) => {
    state.body = body;
  });
  const status = vi.fn((code: number) => {
    state.status = code;
    return { json };
  });
  return { status: status as never, json: json as never, code: state };
}

describe('webhook handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves a valid QC report exactly once (duplicate deliveries are deduped)', async () => {
    vi.mocked(findExisting).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'existing' });
    vi.mocked(createQcInspection).mockResolvedValue({ record: { id: 'new-id' }, duplicate: false });

    const body = { update_id: 1, message: { message_id: 10, chat: { id: 123 }, from: { id: 9 }, text: SAMPLE, date: 1757890000 } };
    const res1 = mockRes();
    await telegramWebhookHandler({ body } as never, res1 as never);
    expect(res1.code.status).toBe(200);
    expect(createQcInspection).toHaveBeenCalledTimes(1);

    const res2 = mockRes();
    await telegramWebhookHandler({ body } as never, res2 as never);
    expect(res2.code.body).toMatchObject({ duplicate: true });
    expect(createQcInspection).toHaveBeenCalledTimes(1); // no second insert
  });

  it('acks invalid messages with 200 and never throws', async () => {
    vi.mocked(findExisting).mockResolvedValue(null);
    const body = { update_id: 2, message: { message_id: 11, chat: { id: 123 }, from: { id: 9 }, text: 'Good morning', date: 1757890000 } };
    const res = mockRes();
    await telegramWebhookHandler({ body } as never, res as never);
    expect(res.code.status).toBe(200);
  });
});
