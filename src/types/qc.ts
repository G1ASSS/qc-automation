/** Shared QC types (parser output + API shapes). */

export interface ParsedQCData {
  /** ISO date YYYY-MM-DD */
  inspectionDate: string;
  inspectionType: string;
  factory: string;
  process: string | null;
  jobNumber: string;
  number: number | null;
  machineNumber: string | null;
  /** HH:MM (24h) or null */
  inspectionTime: string | null;
  qcCheck: string | null;
  /** Normalized: OK / NG / ... (uppercase for short codes, capitalized otherwise) */
  qcResult: string | null;
  /** Normalized status label */
  status: string | null;
  /** Raw status text as found (no emoji), preserved for audit */
  originalStatus: string | null;
}

export interface ParseSuccess {
  success: true;
  data: ParsedQCData;
  errors: string[];
}

export interface ParseFailure {
  success: false;
  data: null;
  errors: string[];
}

export type ParseResult = ParseSuccess | ParseFailure;

export interface TelegramMeta {
  telegramMessageId: number;
  telegramChatId: number;
  telegramUserId?: number;
  telegramUsername?: string;
  receivedAt: Date;
  originalMessage: string;
}
