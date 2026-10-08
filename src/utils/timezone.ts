export const APP_TIMEZONE = 'Asia/Bangkok';

/** Format an ISO date (YYYY-MM-DD) as DD/MM/YYYY for display/Excel. */
export function formatDateForDisplay(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return isoDate;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Format a Date (UTC instant) in Asia/Bangkok as DD/MM/YYYY HH:mm */
export function formatBangkok(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

/** Today's date in Asia/Bangkok as YYYY-MM-DD (for /today scoping). */
export function todayBangkokISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // en-CA yields YYYY-MM-DD
}

/** Night-shift codes (case-insensitive). B = night shift observed in production. */
export const NIGHT_SHIFT_CODES = ['B', 'N', 'NIGHT'];

/** Shift-aware Day/Night partition.
 *  - 00:00-07:59 is always night (no day work then; day runs 08:00-22:00 max)
 *  - explicit B/N/NIGHT code is always night
 *  - any other explicit code is day (trust it over time: covers day overtime to 22:00)
 *  - without a code: 22:00-23:59 night, 08:00-21:59 day
 *  - null when no usable time and no night code. */
export function classifyShift(shift: string | null | undefined, time: string | null | undefined): 'day' | 'night' | null {
  const s = (shift ?? '').trim().toUpperCase();
  const tm = time ? /^(\d{1,2}):(\d{2})/.exec(time.trim()) : null;
  const h = tm ? Number(tm[1]) : null;
  const validH = h !== null && Number.isInteger(h) && h >= 0 && h <= 23;
  if (validH && h < 8) return 'night';
  if (s && NIGHT_SHIFT_CODES.includes(s)) return 'night';
  if (s) return 'day';
  if (!validH || h === null) return null;
  return h >= 22 ? 'night' : 'day';
}

/** Time-only partition (legacy helper): night = 20:00-07:59. */
export function dayNightOf(time: string | null | undefined): 'day' | 'night' | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  return h >= 20 || h < 8 ? 'night' : 'day';
}
