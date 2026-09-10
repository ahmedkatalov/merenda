import type { PublicSchedule, ScheduleDay, SiteStatus } from '@merenda/shared';

const WEEKDAY_FROM_SHORT: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Weekday (0 = Monday) of the server time in the business timezone. */
export function todayWeekday(status: SiteStatus | null | undefined): number {
  const date = status?.serverTime ? new Date(status.serverTime) : new Date();
  try {
    const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: status?.timezone || undefined }).format(date);
    const idx = WEEKDAY_FROM_SHORT[short];
    if (idx !== undefined) return idx;
  } catch {
    /* invalid timezone → fall through */
  }
  return (date.getDay() + 6) % 7;
}

export function venueSchedule(schedules: PublicSchedule[]): PublicSchedule | undefined {
  return schedules.find((s) => s.kind === 'venue' || s.key === 'venue') ?? schedules[0];
}

export function customSchedules(schedules: PublicSchedule[]): PublicSchedule[] {
  const venue = venueSchedule(schedules);
  return schedules.filter((s) => s !== venue);
}

/** JSON-LD OpeningHoursSpecification entries for a schedule. */
export function openingHoursSpecification(hours: ScheduleDay[]): Record<string, string>[] {
  return hours
    .filter((d) => !d.isClosed)
    .map((d) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS[d.weekday] ?? SCHEMA_DAYS[0],
      opens: d.opensAt,
      closes: d.closesAt,
    }));
}

/** Short one-line summary like "Пн–Пт 08:00–22:00 · Сб–Вс 09:00–23:00". */
export function shortHoursSummary(groups: { label: string; value: string }[]): string {
  return groups.map((g) => `${g.label} ${g.value}`).join(' · ');
}
