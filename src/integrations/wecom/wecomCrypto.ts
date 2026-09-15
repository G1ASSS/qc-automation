import crypto from 'node:crypto';

/**
 * Tencent WeCom callback crypto (same algorithm as WXBizMsgCrypt).
 * - EncodingAESKey is 43 base64 chars; append '=' to decode to 32 bytes.
 * - Plaintext layout: random(16) + msgLen(4, BE) + msg + corpId, PKCS#7 padded to 32.
 * - Signature: sha1 of sorted [token, timestamp, nonce, encrypt] joined.
 */

const BLOCK_SIZE = 32;

function aesKeyFromEncodingKey(encodingKey: string): Buffer {
  const key = Buffer.from(`${encodingKey}=`, 'base64');
  if (key.length !== 32) throw new Error('Invalid WECOM_AES_KEY (must decode to 32 bytes)');
  return key;
}

function pkcs7Pad(buf: Buffer): Buffer {
  const padLen = BLOCK_SIZE - (buf.length % BLOCK_SIZE) || BLOCK_SIZE;
  const pad = Buffer.alloc(padLen, padLen);
  return Buffer.concat([buf, pad]);
}

function pkcs7Unpad(buf: Buffer): Buffer {
  if (buf.length === 0) throw new Error('Empty decrypt result');
  const padLen = buf[buf.length - 1];
  if (padLen < 1 || padLen > BLOCK_SIZE || padLen > buf.length) throw new Error('Invalid PKCS#7 padding');
  return buf.subarray(0, buf.length - padLen);
}

export function wecomSignature(token: string, timestamp: string, nonce: string, encrypt: string): string {
  const arr = [token, timestamp, nonce, encrypt].sort();
  return crypto.createHash('sha1').update(arr.join('')).digest('hex');
}

export function wecomEncryptMsg(opts: {
  replyMsg: string;
  corpId: string;
  token: string;
  encodingAesKey: string;
  timestamp?: string;
  nonce?: string;
}): { encrypt: string; signature: string; timestamp: string; nonce: string } {
  const { replyMsg, corpId, token, encodingAesKey } = opts;
  const key = aesKeyFromEncodingKey(encodingAesKey);
  const iv = key.subarray(0, 16);
  const random16 = crypto.randomBytes(16);
  const msgBuf = Buffer.from(replyMsg, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(msgBuf.length, 0);
  const plain = pkcs7Pad(Buffer.concat([random16, lenBuf, msgBuf, Buffer.from(corpId, 'utf8')]));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  cipher.setAutoPadding(false);
  const encrypt = Buffer.concat([cipher.update(plain), cipher.final()]).toString('base64');
  const timestamp = opts.timestamp ?? String(Math.floor(Date.now() / 1000));
  const nonce = opts.nonce ?? Math.floor(Math.random() * 1e10).toString();
  return { encrypt, signature: wecomSignature(token, timestamp, nonce, encrypt), timestamp, nonce };
}

export function wecomDecryptMsg(opts: {
  encryptB64: string;
  encodingAesKey: string;
  expectedCorpId?: string;
}): { msg: string; corpId: string } {
  const key = aesKeyFromEncodingKey(opts.encodingAesKey);
  const iv = key.subarray(0, 16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  decipher.setAutoPadding(false);
  const decrypted = pkcs7Unpad(Buffer.concat([decipher.update(Buffer.from(opts.encryptB64, 'base64')), decipher.final()]));
  if (decrypted.length < 20) throw new Error('Decrypted message too short');
  const msgLen = decrypted.readUInt32BE(16);
  const msg = decrypted.subarray(20, 20 + msgLen).toString('utf8');
  const corpId = decrypted.subarray(20 + msgLen).toString('utf8');
  if (opts.expectedCorpId && corpId !== opts.expectedCorpId) {
    throw new Error('CorpId mismatch in decrypted message');
  }
  return { msg, corpId };
}

/** Verify URL-verification signature and decrypt echostr → plain echo text. */
export function wecomVerifyUrl(opts: {
  msgSignature: string;
  timestamp: string;
  nonce: string;
  echostr: string;
  token: string;
  encodingAesKey: string;
  corpId?: string;
}): string {
  const expect = wecomSignature(opts.token, opts.timestamp, opts.nonce, opts.echostr);
  if (expect !== opts.msgSignature) throw new Error('WeCom URL verification signature mismatch');
  return wecomDecryptMsg({ encryptB64: opts.echostr, encodingAesKey: opts.encodingAesKey, expectedCorpId: opts.corpId }).msg;
}

/** Build the encrypted reply envelope XML WeCom expects from POST callbacks. */
export function wecomEnvelopeXml(opts: {
  encrypt: string;
  signature: string;
  timestamp: string;
  nonce: string;
}): string {
  return `<xml><Encrypt><![CDATA[${opts.encrypt}]]></Encrypt><MsgSignature><![CDATA[${opts.signature}]]></MsgSignature><TimeStamp>${opts.timestamp}</TimeStamp><Nonce><![CDATA[${opts.nonce}]]></Nonce></xml>`;
}

/** Minimal XML field extractor for Tencent callback envelopes (avoids new deps). */
export function wecomXmlField(xml: string, field: string): string | null {
  const m = new RegExp(`<${field}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${field}>`).exec(xml);
  return m ? m[1].trim() : null;
}
