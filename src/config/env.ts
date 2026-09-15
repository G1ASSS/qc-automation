function requireEnv(name: string, opts?: { optional?: boolean }): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (opts?.optional) return undefined;
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') return undefined;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function parseIdList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  },
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
  get port(): number {
    return Number(process.env.PORT ?? 3000);
  },
  get databaseUrl(): string | undefined {
    return requireEnv('DATABASE_URL', { optional: true });
  },
  get telegramBotToken(): string | undefined {
    // Required at runtime when Telegram features are used; lazy so tests/health can load without it.
    return process.env.TELEGRAM_BOT_TOKEN || undefined;
  },
  get telegramWebhookSecret(): string | undefined {
    return process.env.TELEGRAM_WEBHOOK_SECRET || undefined;
  },
  get publicBaseUrl(): string | undefined {
    return process.env.PUBLIC_BASE_URL || undefined;
  },
  get googleSheetId(): string | undefined {
    return process.env.GOOGLE_SHEET_ID || undefined;
  },
  get googleServiceAccountJson(): string | undefined {
    return process.env.GOOGLE_SERVICE_ACCOUNT_JSON || undefined;
  },
  get googleServiceAccountKeyFile(): string | undefined {
    return process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || undefined;
  },
  get googleSheetTab(): string {
    return process.env.GOOGLE_SHEET_TAB || 'QC Reports';
  },
  get allowedChatIds(): string[] {
    return parseIdList(process.env.ALLOWED_TELEGRAM_CHAT_IDS);
  },
  get allowedUserIds(): string[] {
    return parseIdList(process.env.ALLOWED_TELEGRAM_USER_IDS);
  },
  get sheetsMaxRetries(): number {
    return Number(process.env.SHEETS_MAX_RETRIES ?? 8);
  },
  get sheetsBaseDelayMs(): number {
    return Number(process.env.SHEETS_BASE_DELAY_MS ?? 1000);
  },
  get wecomCorpId(): string | undefined {
    return process.env.WECOM_CORP_ID || undefined;
  },
  get wecomAgentId(): number | undefined {
    const v = process.env.WECOM_AGENT_ID;
    return v ? Number(v) : undefined;
  },
  get wecomSecret(): string | undefined {
    return process.env.WECOM_SECRET || undefined;
  },
  get wecomToken(): string | undefined {
    return process.env.WECOM_TOKEN || undefined;
  },
  get wecomAesKey(): string | undefined {
    return process.env.WECOM_AES_KEY || undefined;
  },
};

export function isChatAllowed(chatId: string | number): boolean {
  const allow = config.allowedChatIds;
  if (allow.length === 0) return true; // open mode when not configured
  return allow.includes(String(chatId));
}
