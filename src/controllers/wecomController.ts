import type { Request, Response } from 'express';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { parseQCMessage } from '../parsers/qcParser.js';
import { ParsedQCDataSchema } from '../validators/qcValidator.js';
import { createQcInspection, saveFailedMessage } from '../services/qcService.js';
import { enqueueSheetSync } from '../services/sheetSyncService.js';
import { buildFailureReply, buildSuccessReply } from '../integrations/telegram/telegramApi.js';
import { sendWecomMessage } from '../integrations/wecom/wecomApi.js';
import { wecomDecryptMsg, wecomSignature, wecomVerifyUrl, wecomXmlField } from '../integrations/wecom/wecomCrypto.js';

const WECOM_HELP = [
  'QC Report Bot',
  '',
  'Send a QC inspection report and I will save it automatically.',
  '',
  'Report format example:',
  'IPQC Random Inspection 15/09/2026',
  'Factory 2 Row hole',
  'Job Number: TD-HM-014',
  'Number: 4',
  'Machine No: 23',
  'Time: 15:03',
  'QC check 100%=1pc.',
  'QC check Ok.',
  'unfinished',
  '',
  'For NG, add a line like: Defect: scratch 5pcs',
].join('\n');

/** GET callback verification (WeCom console → save URL). Replies with plain echo text. */
export function wecomVerifyHandler(req: Request, res: Response): void {
  try {
    const token = config.wecomToken;
    const aesKey = config.wecomAesKey;
    if (!token || !aesKey) {
      res.status(500).send('wecom not configured');
      return;
    }
    const { msg_signature = '', timestamp = '', nonce = '', echostr = '' } = req.query as Record<string, string>;
    const echo = wecomVerifyUrl({
      msgSignature: msg_signature,
      timestamp,
      nonce,
      echostr,
      token,
      encodingAesKey: aesKey,
      corpId: config.wecomCorpId,
    });
    res.type('text').send(echo);
  } catch (err) {
    logger.warn({ err }, 'WeCom URL verification failed');
    res.status(403).send('verify failed');
  }
}

/** POST message callback. Always ack fast; heavy work + reply go through the API. */
export async function wecomMessageHandler(req: Request, res: Response): Promise<void> {
  // Ack immediately so WeCom never retries while we process.
  res.type('text').send('success');
  try {
    const token = config.wecomToken;
    const aesKey = config.wecomAesKey;
    const corpId = config.wecomCorpId;
    const agentId = config.wecomAgentId;
    if (!token || !aesKey || !corpId || !agentId) {
      logger.warn('WeCom message ignored: not configured');
      return;
    }
    const { msg_signature = '', timestamp = '', nonce = '' } = req.query as Record<string, string>;
    const rawXml = typeof req.body === 'string' ? req.body : '';
    const encrypt = wecomXmlField(rawXml, 'Encrypt');
    if (!encrypt) {
      logger.warn('WeCom callback without Encrypt field');
      return;
    }
    if (wecomSignature(token, timestamp, nonce, encrypt) !== msg_signature) {
      logger.warn('WeCom callback signature mismatch');
      return;
    }
    const { msg: innerXml } = wecomDecryptMsg({ encryptB64: encrypt, encodingAesKey: aesKey, expectedCorpId: corpId });
    const msgType = wecomXmlField(innerXml, 'MsgType');
    const fromUser = wecomXmlField(innerXml, 'FromUserName') ?? '';
    const msgIdStr = wecomXmlField(innerXml, 'MsgId') ?? '0';
    if (msgType !== 'text') return; // ignore images/voice/events in v1
    const text = (wecomXmlField(innerXml, 'Content') ?? '').trim();
    if (!text) return;

    if (text.startsWith('/')) {
      await sendWecomMessage(fromUser, WECOM_HELP);
      return;
    }

    const result = parseQCMessage(text);
    // Negative chat namespace avoids any collision with Telegram ids.
    const chatId = -1 - agentId;
    const messageId = Number(BigInt(msgIdStr || '0') & BigInt(0x7fffffff));
    const receivedAt = new Date();

    if (!result.success || !result.data) {
      const missing = result.errors;
      await saveFailedMessage({
        originalMessage: text,
        telegramMessageId: messageId,
        telegramChatId: chatId,
        telegramUserId: undefined,
        telegramUsername: fromUser || undefined,
        errorReason: missing.join('; ') || 'unparseable message',
        missingFields: missing,
        receivedAt,
      });
      await sendWecomMessage(fromUser, buildFailureReply(missing));
      return;
    }
    const zod = ParsedQCDataSchema.safeParse(result.data);
    if (!zod.success) {
      const details = zod.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      await saveFailedMessage({
        originalMessage: text,
        telegramMessageId: messageId,
        telegramChatId: chatId,
        telegramUsername: fromUser || undefined,
        errorReason: details.join('; '),
        missingFields: details,
        receivedAt,
      });
      await sendWecomMessage(fromUser, buildFailureReply(details));
      return;
    }
    const { record, duplicate } = await createQcInspection({
      ...zod.data,
      originalMessage: text,
      telegramMessageId: messageId,
      telegramChatId: chatId,
      telegramUsername: fromUser || undefined,
      receivedAt,
    });
    if (duplicate) return;
    enqueueSheetSync((record as { id: string }).id);
    await sendWecomMessage(fromUser, buildSuccessReply(zod.data));
  } catch (err) {
    logger.error({ err }, 'WeCom message processing error');
  }
}
