import { isValidTimeOfDay, type Schedule, type ScheduleDay } from '@merenda/shared';
import { formatTime, timeToMinutes } from '@/lib/utils';

export const DEFAULT_OPENS_AT = '10:00';
export const DEFAULT_CLOSES_AT = '22:00';

/** 0 = Monday … 6 = Sunday. */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** "HH:MM:SS" → "HH:MM" (some browsers emit seconds from `<input type="time">`). */
export function clipTime(value: string | null | undefined): string {
  return (value ?? '').slice(0, 5);
}

/**
 * Always 7 rows sorted by weekday with a stable key order,
 * so the draft can be compared with `deepEqual` (JSON based).
 */
export function normalizeHours(hours: ScheduleDay[]): ScheduleDay[] {
  return WEEKDAYS.map((weekday) => {
    const day = hours.find((d) => d.weekday === weekday);
    return {
      weekday,
      isClosed: day?.isClosed ?? false,
      opensAt: clipTime(day?.opensAt) || DEFAULT_OPENS_AT,
      closesAt: clipTime(day?.closesAt) || DEFAULT_CLOSES_AT,
    };
  });
}

/** Closed days keep a valid (default) interval so the server never sees garbage. */
export function hoursPayload(days: ScheduleDay[]): ScheduleDay[] {
  return days.map((d) =>
    d.isClosed
      ? {
          ...d,
          opensAt: isValidTimeOfDay(d.opensAt) ? d.opensAt : DEFAULT_OPENS_AT,
          closesAt: isValidTimeOfDay(d.closesAt) ? d.closesAt : DEFAULT_CLOSES_AT,
        }
      : d,
  );
}

/** closesAt <= opensAt means the interval crosses midnight (18:00 → 02:00). Not an error. */
export function isOvernight(opensAt: string, closesAt: string): boolean {
  if (!isValidTimeOfDay(opensAt) || !isValidTimeOfDay(closesAt)) return false;
  return timeToMinutes(closesAt) <= timeToMinutes(opensAt);
}

export function validateDay(day: ScheduleDay): string | null {
  if (day.isClosed) return null;
  if (!isValidTimeOfDay(day.opensAt)) return 'Укажите время открытия';
  if (!isValidTimeOfDay(day.closesAt)) return 'Укажите время закрытия';
  return null;
}

/** Venue schedule first, then custom ones by sortOrder. */
export function sortSchedules(list: Schedule[]): Schedule[] {
  return [...list].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'venue' ? -1 : 1;
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru');
  });
}

/** Today's weekday in the browser timezone, 0 = Monday. */
export function todayWeekday(): number {
  return (new Date().getDay() + 6) % 7;
}

/** "YYYY-MM-DD" in the browser timezone. */
export function todayISODate(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Parses "YYYY-MM-DD" as a local date (no UTC shift). */
export function parseISODate(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Weekday (0 = Monday) of a "YYYY-MM-DD" date, or null when invalid. */
export function weekdayOf(iso: string): number | null {
  const date = parseISODate(iso);
  return date ? (date.getDay() + 6) % 7 : null;
}

const exceptionDateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' });
const monthShortFmt = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

/** "2026-03-08" → "8 марта 2026, вс" */
export function formatExceptionDate(iso: string): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  const parts = exceptionDateFmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${get('month')} ${get('year')}, ${get('weekday')}`;
}

/** "2026-03-08" → { day: "8", month: "мар" } for the calendar tile. */
export function exceptionDateTile(iso: string): { day: string; month: string } {
  const date = parseISODate(iso);
  if (!date) return { day: '—', month: '' };
  return { day: String(date.getDate()), month: monthShortFmt.format(date).replace('.', '') };
}

/** Server time rendered in the venue timezone ("14:32"); falls back to the browser timezone. */
export function formatServerTime(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone }).format(date);
  } catch {
    return formatTime(iso);
  }
}
