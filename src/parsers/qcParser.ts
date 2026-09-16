import type { ParsedQCData, ParseResult } from '../types/qc.js';

/**
 * Robust parser for QC inspection Telegram messages.
 *
 * Design goals:
 * - Tolerate emoji prefixes, spacing, capitalization, line-break and minor format differences.
 * - Never throw on malformed input; always return { success, data, errors }.
 * - Independently unit-testable (pure function, no I/O).
 *
 * Example input:
 *   IPQC Random Inspection 15/09/2026
 *   Factory 2 Row hole
 *   Job Number: TD-HM-014
 *   Number: 4
 *   Machine No: 23
 *   ⏰Time: 15:03
 *   📌QC check 100%=1pc.
 *   ✅QC check Ok.
 *   ❌unfinished
 */

// Strip leading emojis / bullets / symbols, keep letters+digits as the start.
function stripLeadingSymbols(line: string): string {
  // Remove any leading run of chars that are not letters or numbers (covers emoji, ⏰📌✅❌, dashes, quotes...).
  return line.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

function stripTrailingPeriod(s: string): string {
  return s.replace(/[.。\s]+$/, '').trim();
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Normalize full-width / variant punctuation from mobile keyboards to ASCII. */
function normalizePunctuation(s: string): string {
  return s
    .replace(/[：︰]/g, ':')
    .replace(/[／]/g, '/')
    .replace(/[–—－]/g, '-')
    .replace(/[．]/g, '.')
    .replace(/[，、]/g, ',')
    .replace(/[；]/g, ';')
    .replace(/[＝]/g, '=')
    .replace(/[％]/g, '%');
}

// Tolerant date-token pattern (allows spaces around separators, 1-2 digit day/month).
const DATE_TOKEN_PATTERN = String.raw`\d{1,2}\s*[/\-\.]\s*\d{1,2}\s*[/\-\.]\s*\d{2,4}|\d{4}\s*[/\-\.]\s*\d{1,2}\s*[/\-\.]\s*\d{1,2}`;
const DATE_TOKEN_RE = new RegExp(DATE_TOKEN_PATTERN, 'g');

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toISODate(y: string, m: string, d: string): string | null {
  let yi = Number(y);
  // Tolerate 2-digit year: 26 -> 2026 (common texting shortcut)
  if (y.length === 2) {
    yi = yi <= 49 ? 2000 + yi : 1900 + yi;
  }
  const mi = Number(m);
  const di = Number(d);
  if (!isValidCalendarDate(yi, mi, di)) return null;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${yi}-${pad(mi)}-${pad(di)}`;
}

/** Find first calendar-valid date. Tolerates spaces around separators, ./- variants, 1-2 digit D/M. */
function findDate(text: string): { iso: string; raw: string } | null {
  const normalized = normalizePunctuation(text);
  const patterns: RegExp[] = [
    /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/,
    /(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})/,
    /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/,
    /(\d{4})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{1,2})/,
    // 2-digit year fallback
    /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2})/,
    /(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{2})/,
    /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{2})/,
  ];
  for (const re of patterns) {
    const m = re.exec(normalized);
    if (!m) continue;
    let iso: string | null = null;
    if (re.source.startsWith('(\\d{4})')) {
      iso = toISODate(m[1], m[2], m[3]);
    } else {
      iso = toISODate(m[3], m[2], m[1]);
    }
    if (iso) return { iso, raw: m[0] };
    // matched pattern but invalid calendar date → keep looking for another match
    const rest = normalized.slice((m.index ?? 0) + m[0].length);
    const retry = findDate(rest);
    if (retry) return retry;
    return null;
  }
  return null;
}

function normalizeTime(raw: string): string | null {
  const cleaned = normalizePunctuation(raw.trim()).replace(/\s+/g, '');
  // Tolerate : . - as separator, optional seconds
  const m = /^(\d{1,2})[:.\-](\d{2})(?::?(\d{2}))?/.exec(cleaned);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Normalize short QC codes to upper-case; longer words to Capitalized. */
function normalizeLabel(raw: string): string {
  const t = stripTrailingPeriod(raw.trim());
  const lower = t.toLowerCase();
  if (['ok', 'ng', 'pass', 'fail', 'hold'].includes(lower)) return lower.toUpperCase();
  if (lower === 'good') return 'OK';
  if (lower === 'bad') return 'NG';
  if (t.length <= 4) return t.toUpperCase();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

const KNOWN_STATUSES = new Set([
  'finished',
  'unfinished',
  'ok',
  'ng',
  'pending',
  'recheck',
  'repair',
  'hold',
  'pass',
  'fail',
]);

export function parseQCMessage(message: string): ParseResult {
  const errors: string[] = [];
  if (!message || !message.trim()) {
    return { success: false, data: null, errors: ['Empty message'] };
  }

  const originalLines = message.split(/\r?\n/);
  const lines = originalLines.map((l) => l.trim()).filter((l) => l.length > 0);
  const cleaned = lines.map((l) => normalizeSpaces(stripLeadingSymbols(normalizePunctuation(l))));
  const fullText = cleaned.join('\n');

  // ---------- Inspection date + type ----------
  const dateFound = findDate(message);
  const inspectionDate = dateFound?.iso ?? null;

  let inspectionType: string | null = null;
  if (lines.length > 0) {
    // Prefer a line that looks like "<type> <date>" (tolerant to spacing typos); else inspection/QC line; else first line.
    let candidate: string | null = null;
    for (const line of cleaned) {
      if (findDate(line)) {
        candidate = line;
        break;
      }
    }
    if (!candidate) {
      candidate = cleaned.find((l) => /(ipqc|oqc|iqc|fqc|pqc|qc).*inspect|inspect.*(ipqc|oqc|iqc|qc)/i.test(l)) ?? null;
    }
    if (!candidate) candidate = cleaned[0] ?? null;
    if (candidate) {
      let t = candidate;
      // Remove date tokens tolerantly (covers "16/09/ 2026", "16 / 09 / 2026", "16-09-2026", etc.)
      t = t.replace(DATE_TOKEN_RE, ' ');
      t = normalizeSpaces(stripLeadingSymbols(t));
      t = stripTrailingPeriod(t);
      inspectionType = t || null;
    }
  }

  // ---------- Factory + process ----------
  let factory: string | null = null;
  let process: string | null = null;
  for (const line of cleaned) {
    const m = /factory\s*[:#\-]?\s*(\d+)\s*(.*)/i.exec(line);
    if (m) {
      factory = `Factory ${m[1]}`;
      const rest = normalizeSpaces(stripTrailingPeriod(m[2] ?? ''));
      process = rest ? rest : null;
      break;
    }
  }

  // ---------- Job number ----------
  let jobNumber: string | null = null;
  for (const line of cleaned) {
    // Primary: "Job Number: X", "Job No: X", "Job #: X", "Job: X"
    let m = /job\s*(?:number|no\.?|#)?\s*[:=\-]\s*([A-Za-z0-9][A-Za-z0-9\-_/\\.]*)/i.exec(line);
    if (m && /job/i.test(line)) {
      jobNumber = stripTrailingPeriod(m[1].trim()).replace(/[),;]+$/, '');
      break;
    }
  }
  if (!jobNumber) {
    for (const line of cleaned) {
      const m = /job\s*(?:number|no\.?)?\s+([A-Za-z0-9][A-Za-z0-9\-_/\\.]*)/i.exec(line);
      if (m) {
        jobNumber = stripTrailingPeriod(m[1].trim());
        break;
      }
    }
  }

  // ---------- Machine number ----------
  let machineNumber: string | null = null;
  for (const line of cleaned) {
    if (!/machine/i.test(line)) continue;
    const m = /machine\s*(?:no\.?|number|#)?\s*[:=\-.]?\s*([A-Za-z0-9]+)/i.exec(line);
    if (m) {
      machineNumber = stripTrailingPeriod(m[1].trim());
      break;
    }
  }

  // ---------- Number (identifier — keep exact text incl. leading zeros, e.g. "00892496") ----------
  let number: string | null = null;
  for (const line of cleaned) {
    const low = line.toLowerCase();
    if (low.includes('machine') || low.includes('job')) continue;
    let m = /^number\s*[:=\-.]?\s*(\d+)/i.exec(line);
    if (!m) m = /\bnumber\s*[:=\-]\s*(\d+)/i.exec(line);
    if (!m) m = /\bqty\b\s*[:=\-]?\s*(\d+)/i.exec(line);
    if (!m) m = /\bquantity\s*[:=\-]?\s*(\d+)/i.exec(line);
    if (m) {
      number = m[1];
      break;
    }
  }

  // ---------- Time ----------
  let inspectionTime: string | null = null;
  for (const line of cleaned) {
    if (!/time/i.test(line)) continue;
    // Tolerate "Time:01:44", "Time: 01:44", "Time: 01 : 44", "Time01.44", full-width colon (pre-normalized)
    const m = /time\s*[:=\-.]?\s*(\d{1,2}\s*[:.\-]\s*\d{2}(?:\s*[:.]\s*\d{2})?)/i.exec(line);
    if (m) {
      inspectionTime = normalizeTime(m[1]);
      if (inspectionTime) break;
    }
  }
  // Fallback: bare time line with no label (e.g. "⏰ 21:39" cleans to "21:39")
  if (!inspectionTime) {
    for (const line of cleaned) {
      if (line.includes('/') || findDate(line)) continue; // never steal a date
      const m = /^(\d{1,2}\s*[:.\-]\s*\d{2}(?:\s*[:.]\s*\d{2})?)$/.exec(line);
      if (m) {
        const t = normalizeTime(m[1]);
        if (t) {
          inspectionTime = t;
          break;
        }
      }
    }
  }

  // ---------- NG-report fields: shift + quantities + Total NG ----------
  // e.g. "Shift work: (B)", "Qc Random Inspection: 30 pcs",
  // "Number of jobs found: 30 pcs.", "Total NG =400 pcs."
  let shift: string | null = null;
  let inspectionQty: number | null = null;
  let foundQty: number | null = null;
  let totalNg: number | null = null;
  for (const line of cleaned) {
    if (!shift) {
      const m = /shift\s*(?:work)?\s*[:=\-]?\s*\(?([A-Za-z0-9]+)\)?/i.exec(line);
      if (m && /\bshift\b/i.test(line)) shift = m[1].trim();
    }
    if (inspectionQty == null) {
      // Skip date lines so the day of "Inspection 15/09/2026" is never read as a quantity
      if (!findDate(line)) {
        const m = /random\s*inspection\s*[:=\-]?\s*(\d+)\s*(?:pcs?|pc\.?)?/i.exec(line);
        if (m) inspectionQty = Number(m[1]);
      }
    }
    if (foundQty == null) {
      let m = /number\s*of\s*\w*\s*found\s*[:=\-]?\s*(\d+)/i.exec(line);
      if (!m) m = /jobs?\s*found\s*[:=\-]?\s*(\d+)/i.exec(line);
      if (m) foundQty = Number(m[1]);
    }
    if (totalNg == null) {
      const m = /total\s*ng\s*[:=\-.]?\s*(\d+)/i.exec(line);
      if (m) totalNg = Number(m[1]);
    }
  }

  // ---------- QC check + QC result ----------
  // Tolerant: "QC check", "QC-Check", "QC:check", "QCcheck", any spacing/case
  const QC_CHECK_RE = /qc\s*[-:]?\s*check/i;
  let qcCheck: string | null = null;
  let qcResult: string | null = null;

  for (const line of cleaned) {
    if (!QC_CHECK_RE.test(line)) continue;
    // Result-style: "QC check Ok." / "QC check: NG" / "QC check PASS"
    const rm = /qc\s*[-:]?\s*check\s*[:=\-]?\s*(ok|ng|pass|fail|good|bad)\.?$/i.exec(line);
    if (rm) {
      if (!qcResult) qcResult = normalizeLabel(rm[1]);
      continue;
    }
    // Detail-style: "QC check 100%=1pc." — remainder is the check value.
    const dm = /qc\s*[-:]?\s*check\s*[:=\-]?\s*(.+)/i.exec(line);
    if (dm && !qcCheck) {
      const val = normalizeSpaces(dm[1].trim());
      // Guard: if remainder itself is just ok/ng (handled above with period variants), treat as result.
      if (/^(ok|ng|pass|fail|good|bad)\.?$/i.test(val)) {
        if (!qcResult) qcResult = normalizeLabel(val);
      } else if (val) {
        qcCheck = val;
      }
    }
  }

  // Fallback result patterns: "QC Result: OK", "Result: NG", standalone "OK"/"NG" line.
  if (!qcResult) {
    for (const line of cleaned) {
      let m = /qc\s*[-:]?\s*result\s*[:=\-]?\s*(ok|ng|pass|fail|good|bad)\.?$/i.exec(line);
      if (m) {
        qcResult = normalizeLabel(m[1]);
        break;
      }
      m = /^result\s*[:=\-]?\s*(ok|ng|pass|fail|good|bad)\.?$/i.exec(line);
      if (m) {
        qcResult = normalizeLabel(m[1]);
        break;
      }
    }
  }
  if (!qcResult) {
    for (const line of cleaned) {
      if (QC_CHECK_RE.test(line) && !/^(ok|ng)/i.test(line)) continue;
      // standalone OK/NG with optional emoji already stripped
      const m = /^(ok|ng|pass|fail)\.?$/i.exec(line);
      if (m) {
        qcResult = normalizeLabel(m[1]);
        break;
      }
    }
  }

  // NG-format inference: problem reports without an explicit "QC check NG/OK" line.
  // e.g. "reports have revealed problems", "Problems encountered: ...", "Total NG =400 pcs"
  if (!qcResult) {
    if (/total\s*ng|revealed problems|problems?\s+(encountered|found)|defects?\s+(found|detected)/i.test(fullText)) {
      qcResult = 'NG';
    }
  }

  // NG-format check summary when there is no "QC check ..." line:
  // e.g. "Random Inspection 30pcs; Found 30pcs" from "Qc Random Inspection: 30 pcs" + "Number of jobs found: 30 pcs"
  if (!qcCheck && (inspectionQty != null || foundQty != null)) {
    const parts: string[] = [];
    if (inspectionQty != null) parts.push(`Random Inspection ${inspectionQty}pcs`);
    if (foundQty != null) parts.push(`Found ${foundQty}pcs`);
    if (parts.length > 0) qcCheck = parts.join('; ');
  }

  // ---------- Defect / remark (NG detail, free-form) ----------
  // Accepts: "Defect: scratch 5pcs", "Remark: ...", "Problem: ...", "Issue: ...",
  // "Reason: ...", "NG: scratch", "NG scratch 5pcs", "QC check NG scratch".
  // Tolerant to missing colon ("Defect scratch 5pcs").
  let defectRemark: string | null = null;
  for (const line of cleaned) {
    if (QC_CHECK_RE.test(line)) {
      const qm = /qc\s*[-:]?\s*check\s*[:=\-]?\s*ng\s*[:,\-.]*\s*(.+)/i.exec(line);
      if (qm) {
        const val = stripTrailingPeriod(normalizeSpaces(qm[1].trim()));
        if (val && !/^(ok|ng|pass|fail|good|bad)$/i.test(val) && !defectRemark) defectRemark = val;
      }
      continue;
    }
    let m = /^(?:(?:defects?|remarks?|problems?|issues?|reasons?)(?:\s+(?:encountered|found|details?|description))?|ng\s*(?:reason|problem|remark|defect)?)\s*[:=\-.,]*\s*(.+)/i.exec(line);
    if (m) {
      const val = stripTrailingPeriod(normalizeSpaces(m[1].trim()));
      if (val && !defectRemark) {
        defectRemark = val;
        if (!qcResult && /^ng\b/i.test(line)) qcResult = 'NG';
        continue;
      }
    }
    m = /^ng\s+([^\s].*)/i.exec(line);
    if (m) {
      const val = stripTrailingPeriod(normalizeSpaces(m[1].replace(/^[:=\-.,]+\s*/, '').trim()));
      if (val && !defectRemark) defectRemark = val;
      if (!qcResult) qcResult = 'NG';
      continue;
    }
  }

  // ---------- Status ----------
  let status: string | null = null;
  let originalStatus: string | null = null;
  // Walk lines bottom-up: status is conventionally the last line (e.g. ❌unfinished).
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const line = cleaned[i];
    if (QC_CHECK_RE.test(line)) continue; // belongs to result, not status
    if (/qc\s*[-:]?\s*result/i.test(line)) continue;
    let m = /^status\s*[:=\-]?\s*(.+)/i.exec(line);
    if (m) {
      const raw = normalizeSpaces(m[1]);
      const core = stripTrailingPeriod(raw).split(/\s+/)[0] ?? '';
      if (core) {
        originalStatus = core;
        status = normalizeLabel(core);
        break;
      }
    }
    const single = stripTrailingPeriod(line).split(/\s+/);
    // Single-word status line (most common)
    if (single.length === 1 && KNOWN_STATUSES.has(single[0].toLowerCase())) {
      originalStatus = stripTrailingPeriod(line);
      status = normalizeLabel(line);
      break;
    }
    // Tolerate spacing/hyphen typos: "un finished", "un-finished", "un_finished"
    const compact = stripTrailingPeriod(line).toLowerCase().replace(/[\s\-_]+/g, '');
    if (KNOWN_STATUSES.has(compact)) {
      originalStatus = stripTrailingPeriod(line);
      status = normalizeLabel(compact);
      break;
    }
  }

  // ---------- QC-report recognition gate ----------
  const hasQcSignal =
    /qc/i.test(fullText) ||
    /ipqc|oqc|iqc|fqc/i.test(fullText) ||
    /unfinished|finished|\bng\b|\bok\b|recheck|repair|pending|hold/i.test(fullText) ||
    /problem|total\s*ng|revealed problems|please confirm|\bshift\b/i.test(fullText);

  const missing: string[] = [];
  if (!inspectionDate) missing.push('Date is missing or invalid');
  if (!factory) missing.push('Factory is missing');
  if (!jobNumber) missing.push('Job Number is missing');
  if (machineNumber == null && number == null) missing.push('Machine No is missing');
  if (!hasQcSignal) missing.push('QC information is missing');

  if (missing.length > 0 || !inspectionDate || !factory || !jobNumber) {
    const errs = [...missing];
    if (!inspectionType) errs.push('Inspection Type is missing');
    return { success: false, data: null, errors: errs.length ? errs : ['Message is not a QC report'] };
  }

  const data: ParsedQCData = {
    inspectionDate,
    inspectionType: inspectionType ?? 'QC Inspection',
    factory,
    process,
    jobNumber,
    number,
    machineNumber,
    inspectionTime,
    qcCheck,
    qcResult,
    defectRemark,
    shift,
    inspectionQty,
    foundQty,
    totalNg,
    status,
    originalStatus,
  };
  return { success: true, data, errors: [] };
}
