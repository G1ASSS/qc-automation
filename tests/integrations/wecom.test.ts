import { describe, expect, it } from 'vitest';
import { wecomDecryptMsg, wecomEncryptMsg, wecomSignature, wecomVerifyUrl, wecomXmlField } from '../../src/integrations/wecom/wecomCrypto.js';
import crypto from 'node:crypto';

const TOKEN = 'testtoken123';
const AES_KEY = crypto.randomBytes(32).toString('base64').slice(0, 43);
const CORP = 'wwcorp123';

describe('wecom crypto', () => {
  it('encrypt/decrypt round-trips with corp binding', () => {
    const { encrypt } = wecomEncryptMsg({ replyMsg: '<xml><Content>hi</Content></xml>', corpId: CORP, token: TOKEN, encodingAesKey: AES_KEY, timestamp: '1700000000', nonce: '12345' });
    const out = wecomDecryptMsg({ encryptB64: encrypt, encodingAesKey: AES_KEY, expectedCorpId: CORP });
    expect(out.msg).toBe('<xml><Content>hi</Content></xml>');
    expect(out.corpId).toBe(CORP);
  });

  it('rejects wrong corp id', () => {
    const { encrypt } = wecomEncryptMsg({ replyMsg: 'hello', corpId: CORP, token: TOKEN, encodingAesKey: AES_KEY });
    expect(() => wecomDecryptMsg({ encryptB64: encrypt, encodingAesKey: AES_KEY, expectedCorpId: 'wwOTHER' })).toThrow();
  });

  it('verify-url accepts correctly signed echostr', () => {
    const { encrypt: echostr } = wecomEncryptMsg({ replyMsg: 'echo-test', corpId: CORP, token: TOKEN, encodingAesKey: AES_KEY, timestamp: '1700000001', nonce: 'n1' });
    const sig = wecomSignature(TOKEN, '1700000001', 'n1', echostr);
    const echo = wecomVerifyUrl({ msgSignature: sig, timestamp: '1700000001', nonce: 'n1', echostr, token: TOKEN, encodingAesKey: AES_KEY, corpId: CORP });
    expect(echo).toBe('echo-test');
  });

  it('rejects tampered signature', () => {
    expect(() => wecomVerifyUrl({ msgSignature: 'bad', timestamp: 't', nonce: 'n', echostr: 'e', token: TOKEN, encodingAesKey: AES_KEY })).toThrow();
  });

  it('extracts XML fields with and without CDATA', () => {
    expect(wecomXmlField('<xml><Encrypt><![CDATA[ABC]]></Encrypt></xml>', 'Encrypt')).toBe('ABC');
    expect(wecomXmlField('<xml><MsgType>text</MsgType></xml>', 'MsgType')).toBe('text');
    expect(wecomXmlField('<xml></xml>', 'Missing')).toBeNull();
  });
});
