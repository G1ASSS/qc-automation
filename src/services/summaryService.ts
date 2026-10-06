import { prisma } from '../database/prisma.js';
import { formatDateForDisplay } from '../utils/timezone.js';

export type LineKey = 'cutting' | 'border' | 'hole' | 'cleaning' | 'packing' | 'special';

export const LINE_META: { key: LineKey; title: string }[] = [
  { key: 'cutting', title: 'Cutting Line' },
  { key: 'border', title: 'Border Line' },
  { key: 'hole', title: 'Hole Line' },
  { key: 'cleaning', title: 'Cleaning Line' },
  { key: 'packing', title: 'Packing line' },
  { key: 'special', title: 'Special Work' },
];

/** Map a process string to a production line. Hole/border/cutting explicit, rest fallback. */
export function lineFor(process: string | null | undefined): LineKey {
  const p = (process ?? '').toLowerCase();
  if (/border/.test(p)) return 'border';
  if (/cut/.test(p)) return 'cutting';
  if (/clean/.test(p)) return 'cleaning';
  if (/pack/.test(p)) return 'packing';
  if (/special/.test(p)) return 'special';
  if (/hole/.test(p)) return 'hole';
  return 'special';
}

export interface SummaryJob { jobNumber: string; machines: string[]; count: number }
export interface SummaryProblem {
  jobNumber: string; machineNumber: string | null; number: string | null;
  shift: string | null; defectRemark: string | null; qcCheck: string | null;
  foundQty: number | null; totalNg: number | null; inspectionQty: number | null;
  qcResult: string | null; inspectionTime: string | null;
  username: string | null;
}
export interface SummaryUser {
  username: string; total: number; ok: number; ng: number; unfinished: number;
  jobs: SummaryJob[];
}
export interface DailySummary {
  date: string; displayDate: string; total: number;
  window?: { from: string; to: string };
  lines: Record<LineKey, SummaryJob[]>;
  lineCounts: Record<LineKey, number>;
  problems: SummaryProblem[];
  byUser: SummaryUser[];
  byShift: { shift: string; count: number }[];
  ng: number; unfinished: number; ok: number;
  text: string;
}

type SummaryRows = Awaited<ReturnType<typeof prisma.qcInspection.findMany>>;

function userShiftWhere(username?: string, shift?: string): Record<string, unknown> {
  const who2 = (username ?? "").trim().replace(/^@/, "");
  const sh2 = (shift ?? "").trim();
  return { ...(who2 ? { telegramUsername: { equals: who2, mode: "insensitive" as const } } : {}), ...(sh2 ? { shift: { equals: sh2, mode: "insensitive" as const } } : {}) };
}

export async function buildDailySummary(isoDate: string, username?: string, shift?: string): Promise<DailySummary> {
  const start = new Date(`${isoDate}T00:00:00.000Z`);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  const rows = await prisma.qcInspection.findMany({
    where: { inspectionDate: { gte: start, lt: end }, ...userShiftWhere(username, shift) },
    orderBy: [{ createdAt: 'asc' }],
    take: 5000,
  });
  const displayDate = formatDateForDisplay(isoDate);
  return assembleSummary(rows, `\u2705 SUMMARIES IPQC ${displayDate}`, 'Today have a problem', isoDate, displayDate);
}

/** Night window: 20:00 on `isoDate` through 08:00 next morning (by inspection time).
 *  Convention: reports sent after midnight must carry the NEW date to join that night. */
export async function buildNightSummary(isoDate: string, username?: string, shift?: string): Promise<DailySummary> {
  const d0 = new Date(`${isoDate}T00:00:00.000Z`);
  const d1 = new Date(d0); d1.setUTCDate(d1.getUTCDate() + 1);
  const d2 = new Date(d1); d2.setUTCDate(d2.getUTCDate() + 1);
  const rows = await prisma.qcInspection.findMany({
    where: { inspectionDate: { gte: d0, lt: d2 }, ...userShiftWhere(username, shift) },
    orderBy: [{ createdAt: 'asc' }],
    take: 10000,
  });
  const s0 = isoDate;
  const s1 = d1.toISOString().slice(0, 10);
  const pad = (v: string | null): string | null => {
    if (!v) return null;
    const m = /^(\d{1,2}):(\d{2})/.exec(v.trim());
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
  };
  const night = rows.filter((r) => {
    const day = r.inspectionDate.toISOString().slice(0, 10);
    const tm = pad(r.inspectionTime);
    if (!tm) return false; // no time -> cannot place in a night window
    if (day === s0) return tm >= '20:00';
    if (day === s1) return tm < '08:00';
    return false;
  });
  night.sort((a, b) =>
    a.inspectionDate.getTime() - b.inspectionDate.getTime() ||
    (pad(a.inspectionTime) ?? '').localeCompare(pad(b.inspectionTime) ?? '') ||
    a.createdAt.getTime() - b.createdAt.getTime());
  const disp = `${formatDateForDisplay(s0)} 20:00 - ${formatDateForDisplay(s1)} 08:00`;
  const out = assembleSummary(night, `\uD83C\uDF19 NIGHT SHIFT ${disp}`, 'Tonight have a problem', s0, disp);
  out.window = { from: `${s0}T20:00`, to: `${s1}T08:00` };
  return out;
}

function assembleSummary(rows: SummaryRows, titleLine: string, problemHeader: string, date: string, displayDate: string): DailySummary {

  const grouped: Record<LineKey, Map<string, string[]>> = {
    cutting: new Map(), border: new Map(), hole: new Map(),
    cleaning: new Map(), packing: new Map(), special: new Map(),
  };
  for (const r of rows) {
    const line = lineFor(r.process);
    const m = grouped[line];
    const list = m.get(r.jobNumber) ?? [];
    list.push(r.machineNumber ?? '—');
    m.set(r.jobNumber, list);
  }
  const lines = {} as Record<LineKey, SummaryJob[]>;
  const lineCounts = {} as Record<LineKey, number>;
  for (const { key } of LINE_META) {
    const jobs: SummaryJob[] = [...grouped[key].entries()]
      .map(([jobNumber, machines]) => ({ jobNumber, machines, count: machines.length }))
      .sort((a, b) => a.jobNumber.localeCompare(b.jobNumber));
    lines[key] = jobs;
    lineCounts[key] = jobs.reduce((n, j) => n + j.count, 0);
  }

  const problems: SummaryProblem[] = rows
    .filter((r) => (r.qcResult ?? '').toUpperCase() === 'NG' || (r.defectRemark ?? '').trim() !== '')
    .map((r) => ({
      jobNumber: r.jobNumber, machineNumber: r.machineNumber, number: r.number,
      shift: r.shift, defectRemark: r.defectRemark, qcCheck: r.qcCheck,
      foundQty: r.foundQty, totalNg: r.totalNg, inspectionQty: r.inspectionQty,
      qcResult: r.qcResult, inspectionTime: r.inspectionTime,
      username: r.telegramUsername,
    }));

  const byUserMap = new Map<string, typeof rows>();
  for (const r of rows) {
    const u = (r.telegramUsername ?? '').trim() || 'unknown';
    const list = byUserMap.get(u) ?? [];
    list.push(r);
    byUserMap.set(u, list);
  }
  const byUser: SummaryUser[] = [...byUserMap.entries()]
    .map(([username, rs]) => {
      const jm = new Map<string, string[]>();
      for (const r of rs) {
        const l = jm.get(r.jobNumber) ?? [];
        l.push(r.machineNumber ?? '\u2014');
        jm.set(r.jobNumber, l);
      }
      return {
        username,
        total: rs.length,
        ok: rs.filter((r) => (r.qcResult ?? '').toUpperCase() === 'OK').length,
        ng: rs.filter((r) => (r.qcResult ?? '').toUpperCase() === 'NG').length,
        unfinished: rs.filter((r) => (r.status ?? '').toLowerCase() === 'unfinished').length,
        jobs: [...jm.entries()]
          .map(([jobNumber, machines]) => ({ jobNumber, machines, count: machines.length }))
          .sort((a, b) => a.jobNumber.localeCompare(b.jobNumber)),
      };
    })
    .sort((a, b) => b.total - a.total || a.username.localeCompare(b.username));

  const byShiftMap = new Map<string, number>();
  for (const r of rows) {
    const k = (r.shift ?? "").trim() || "no-shift";
    byShiftMap.set(k, (byShiftMap.get(k) ?? 0) + 1);
  }
  const byShift = [...byShiftMap.entries()]
    .map(([shiftName, count]) => ({ shift: shiftName, count }))
    .sort((a, b) => b.count - a.count || a.shift.localeCompare(b.shift));

  const ng = rows.filter((r) => (r.qcResult ?? '').toUpperCase() === 'NG').length;
  const unfinished = rows.filter((r) => (r.status ?? '').toLowerCase() === 'unfinished').length;
  const ok = rows.filter((r) => (r.qcResult ?? '').toUpperCase() === 'OK').length;

  const L: string[] = [];
  L.push(titleLine);
  for (const { key, title } of LINE_META) {
    L.push(title);
    const jobs = lines[key];
    if (jobs.length === 0) { L.push('—'); }
    else for (const j of jobs) L.push(`✅${j.jobNumber}(${j.machines.join(',')})`);
  }
  L.push('');
  if (problems.length === 0) { L.push(problemHeader.replace('have a problem', 'not have a problem.')); }
  else { L.push(problemHeader); for (const p of problems) {
    if (p.shift) L.push(`Shift work (${p.shift})`);
    L.push(`Job Number: ${p.jobNumber}`);
    L.push(`Machine number: ${p.machineNumber ?? '—'}`);
    L.push(`Number: ${p.number ?? '—'}`);
    if (p.defectRemark) L.push(`Found Problem: ${p.defectRemark}`);
    if (p.inspectionQty != null || p.qcCheck) L.push(`QC random : ${p.inspectionQty != null ? `${p.inspectionQty}pcs.` : (p.qcCheck ?? '')}`);
    if (p.foundQty != null) L.push(`NG Found items: ${p.foundQty}pcs.`);
    else if (p.defectRemark) L.push(`NG Found items: ${p.defectRemark}`);
    L.push(`Total NG: ${p.totalNg != null ? String(p.totalNg) : '—'}`);
    L.push(`It's okay confirmed`);
    L.push('');
    }
  }
  L.push('');
  L.push(`Total - ${rows.length}`);
  L.push(`H - ${lineCounts.hole}`);
  L.push(`CT - ${lineCounts.cutting}`);
  L.push(`Border - ${lineCounts.border}`);
  L.push(`NG - ${ng}`);
  if (unfinished > 0) L.push(`Unfinished - ${unfinished}`);
  L.push(`Name - ` + byUser.map((u) => '@' + u.username).join(', '));

  return { date, displayDate, total: rows.length, lines, lineCounts, problems, byUser, byShift, ng, unfinished, ok, text: L.join('\n') };
}
