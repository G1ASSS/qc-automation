import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { sendTelegramMessage } from '../../src/integrations/telegram/telegramApi.js';

const OLD_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function resp(status: number, jsonBody: unknown = {}) {
  return { status, ok: status >= 200 && status < 300, json: async () => jsonBody, text: async () => JSON.stringify(jsonBody) };
}

describe('sendTelegramMessage retries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (OLD_TOKEN === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = OLD_TOKEN;
  });

  it('retries once after 429 then delivers with reply threading', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(resp(429, { parameters: { retry_after: 0 } }) as never)
      .mockResolvedValueOnce(resp(200, { ok: true }) as never);
    await sendTelegramMessage(-123, 'hello', { replyTo: 7 });
    expect(fetch).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse((vi.mocked(fetch).mock.calls[1][1] as { body: string }).body);
    expect(secondBody).toMatchObject({ chat_id: -123, text: 'hello', reply_to_message_id: 7 });
  });

  it('gives up gracefully after repeated failures', async () => {
    vi.mocked(fetch).mockResolvedValue(resp(500) as never);
    await sendTelegramMessage(-123, 'hello');
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
