/** Sentinel select value that reveals the free-text IANA input. */
export const CUSTOM_TIMEZONE = '__custom';

const RUSSIA: [string, string][] = [
  ['Europe/Moscow', 'Москва'],
  ['Europe/Kaliningrad', 'Калининград'],
  ['Europe/Samara', 'Самара'],
  ['Asia/Yekaterinburg', 'Екатеринбург'],
  ['Asia/Omsk', 'Омск'],
  ['Asia/Novosibirsk', 'Новосибирск'],
  ['Asia/Krasnoyarsk', 'Красноярск'],
  ['Asia/Irkutsk', 'Иркутск'],
  ['Asia/Yakutsk', 'Якутск'],
  ['Asia/Vladivostok', 'Владивосток'],
];

const OTHER: [string, string][] = [
  ['Europe/Minsk', 'Минск'],
  ['Europe/Kiev', 'Киев'],
  ['Europe/Istanbul', 'Стамбул'],
  ['Europe/Berlin', 'Берлин'],
  ['Asia/Tbilisi', 'Тбилиси'],
  ['Asia/Yerevan', 'Ереван'],
  ['Asia/Baku', 'Баку'],
  ['Asia/Dubai', 'Дубай'],
  ['Asia/Almaty', 'Алматы'],
];

const toOptions = (list: [string, string][]) => list.map(([value, city]) => ({ value, label: `${city} (${value})` }));

export const TIMEZONE_GROUPS = [
  { label: 'Россия', options: toOptions(RUSSIA) },
  { label: 'Другие страны', options: toOptions(OTHER) },
];

export const KNOWN_TIMEZONES: ReadonlySet<string> = new Set([...RUSSIA, ...OTHER].map(([value]) => value));

export function isValidTimeZone(value: string): boolean {
  if (!value.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** "14:05" in the given zone, or null when the zone is unknown. */
export function timeInZone(timeZone: string, now: Date = new Date()): string | null {
  try {
    return new Intl.DateTimeFormat('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit' }).format(now);
  } catch {
    return null;
  }
}
