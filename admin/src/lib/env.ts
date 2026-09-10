const stripSlash = (s: string) => s.replace(/\/+$/, '');

/** API origin. Empty = same origin (dev proxy / production reverse proxy). */
export const API_URL = stripSlash(import.meta.env.VITE_API_URL ?? '');

/** Public client site, embedded in the live preview iframe. */
export const SITE_URL = stripSlash(import.meta.env.VITE_SITE_URL || 'http://localhost:5173');

export const SITE_ORIGIN = (() => {
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return '*';
  }
})();

export const PREVIEW_URL = `${SITE_URL}/?preview=1`;
