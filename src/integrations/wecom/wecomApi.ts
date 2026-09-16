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

/** Build the WeCom-group summary for a saved QC report (robot markdown). */
export function buildRobotMarkdown(d: {
  inspectionDate: string;
  factory: string;
  process: string | null;
  jobNumber: string;
  machineNumber: string | null;
  inspectionTime: string | null;
  qcResult: string | null;
  status: string | null;
  defectRemark?: string | null;
  shift?: string | null;
  inspectionQty?: number | null;
  foundQty?: number | null;
  totalNg?: number | null;
}): string {
  const displayDate = d.inspectionDate.split('-').reverse().join('/');
  const ok = (d.qcResult ?? '').toUpperCase() === 'OK';
  const lines = [
    `## ${ok ? '✅' : '❌'} QC Report — ${d.jobNumber}`,
    `Date: ${displayDate}`,
    `Factory: ${d.factory}`,
    `Process: ${d.process ?? '-'}`,
    `Machine: ${d.machineNumber ?? '-'}`,
    `Time: ${d.inspectionTime ?? '-'}`,
    `QC Result: ${d.qcResult ?? '-'}`,
    `Status: ${d.status ?? '-'}`,
    `Defect: ${d.defectRemark ?? '-'}`,
  ];
  if (d.shift ?? d.inspectionQty ?? d.foundQty ?? d.totalNg) {
    lines.push(
      `Shift: ${d.shift ?? '-'}`,
      `Inspection Qty: ${d.inspectionQty ?? '-'}`,
      `Found Qty: ${d.foundQty ?? '-'}`,
      `Total NG: ${d.totalNg ?? '-'}`,
    );
  }
  return lines.join('\n');
}

/**
 * Push a text summary to a WeCom group robot (outbound POST — no domain
 * filing needed, unlike app callbacks). Never throws; no-op when unconfigured.
 */
export async function sendWecomRobotMessage(content: string): Promise<boolean> {
  const key = config.wecomRobotKey;
  if (!key) return false;
  try {
    const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msgtype: 'markdown', markdown: { content } }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json().catch(() => ({}))) as { errcode?: number; errmsg?: string };
    if (!res.ok || (data.errcode !== undefined && data.errcode !== 0)) {
      logger.error({ errcode: data.errcode, errmsg: (data.errmsg ?? '').slice(0, 300) }, 'WeCom robot push failed');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, 'WeCom robot push error');
    return false;
  }
}
