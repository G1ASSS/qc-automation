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
  /** Free-form NG defect / remark, e.g. "scratch 5pcs" (null when not given) */
  defectRemark: string | null;
  /** Work shift, e.g. "B" from "Shift work: (B)" (null when not given) */
  shift: string | null;
  /** Inspected quantity, e.g. 30 from "Qc Random Inspection: 30 pcs" */
  inspectionQty: number | null;
  /** Found/defect quantity, e.g. 30 from "Number of jobs found: 30 pcs" */
  foundQty: number | null;
  /** Total NG quantity, e.g. 400 from "Total NG =400 pcs" */
  totalNg: number | null;
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
