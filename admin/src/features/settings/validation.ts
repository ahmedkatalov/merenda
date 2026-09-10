import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const u = new URL(value);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.length > 0;
  } catch {
    return false;
  }
}

/** Empty string or a valid http(s) URL. */
export const optionalUrl = (message = 'Введите ссылку, начинающуюся с https://') => z.string().trim().refine((v) => v === '' || isHttpUrl(v), message);

/** Empty string or a syntactically valid email. */
export const optionalEmail = z.string().trim().refine((v) => v === '' || EMAIL_RE.test(v), 'Некорректный email');
