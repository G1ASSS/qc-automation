import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchAccessToken(corpId: string, secret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.token;
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(corpId)}&corpsecret=${encodeURIComponent(secret)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`WeCom gettoken failed: ${data.errcode ?? res.status} ${data.errmsg ?? ''}`.trim());
  }
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 7200) * 1000 };
  return cachedToken.token;
}

/** Send a text message to a WeCom user (async push; callbacks themselves just ack). */
export async function sendWecomMessage(toUser: string, content: string): Promise<void> {
  const corpId = config.wecomCorpId;
  const agentId = config.wecomAgentId;
  const secret = config.wecomSecret;
  if (!corpId || !agentId || !secret) {
    logger.warn('Skipped WeCom reply: WECOM_CORP_ID/AGENT_ID/SECRET not configured');
    return;
  }
  try {
    const token = await fetchAccessToken(corpId, secret);
    const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ touser: toUser, msgtype: 'text', agentid: agentId, text: { content }, safe: 0 }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json().catch(() => ({}))) as { errcode?: number; errmsg?: string };
    if (!res.ok || (data.errcode !== undefined && data.errcode !== 0)) {
      logger.error({ errcode: data.errcode, errmsg: (data.errmsg ?? '').slice(0, 300) }, 'WeCom message/send failed');
    }
  } catch (err) {
    logger.error({ err }, 'WeCom API failure (message/send)');
  }
}

export function isWecomConfigured(): boolean {
  return Boolean(config.wecomCorpId && config.wecomAgentId && config.wecomSecret && config.wecomToken && config.wecomAesKey);
}
