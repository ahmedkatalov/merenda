import type { Currency, OrderStatus, OrderType, ScheduleDay, TimeOfDay } from './types';

export const DEFAULT_CURRENCY: Currency = { code: 'RUB', symbol: '₽', decimals: 0 };

/** 35000 → "350 ₽" (decimals from currency settings). */
export function formatMoney(minor: number, currency: Currency = DEFAULT_CURRENCY): string {
  const value = minor / 100;
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(value);
  return `${formatted} ${currency.symbol}`.trim();
}

/** "350" | "349.90" → 35000 | 34990 */
export function parseMoneyToMinor(input: string | number): number {
  const n = typeof input === 'number' ? input : Number(String(input).replace(',', '.').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function minorToMajor(minor: number): number {
  return Math.round(minor) / 100;
}

export const WEEKDAY_NAMES_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const WEEKDAY_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: 'В заведении',
  takeaway: 'На вынос',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

/** Groups consecutive weekdays with identical hours: "Пн–Пт 08:00–22:00". */
export function groupScheduleDays(hours: ScheduleDay[]): { label: string; value: string; isClosed: boolean }[] {
  const sorted = [...hours].sort((a, b) => a.weekday - b.weekday);
  const groups: { from: number; to: number; value: string; isClosed: boolean }[] = [];
  for (const day of sorted) {
    const value = day.isClosed ? 'Выходной' : `${day.opensAt}–${day.closesAt}`;
    const last = groups[groups.length - 1];
    if (last && last.value === value && last.to === day.weekday - 1) {
      last.to = day.weekday;
    } else {
      groups.push({ from: day.weekday, to: day.weekday, value, isClosed: day.isClosed });
    }
  }
  return groups.map((g) => ({
    label: g.from === g.to ? WEEKDAY_SHORT_RU[g.from] : `${WEEKDAY_SHORT_RU[g.from]}–${WEEKDAY_SHORT_RU[g.to]}`,
    value: g.value,
    isClosed: g.isClosed,
  }));
}

export function isValidTimeOfDay(value: string): value is TimeOfDay {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Digits only for wa.me links: "+49 151 234-56" → "4915123456" */
export function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function buildWhatsappUrl(number: string, text: string): string {
  return `https://wa.me/${normalizeWhatsappNumber(number)}?text=${encodeURIComponent(text)}`;
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
