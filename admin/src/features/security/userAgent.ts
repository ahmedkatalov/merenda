/**
 * Tiny user-agent parser for the sessions list. Deliberately minimal:
 * we only need a device icon and a short "Browser · OS" label.
 */

export interface ParsedUserAgent {
  browser: string | null;
  os: string | null;
  /** Phone/tablet heuristics: UA contains "Mobile", "iPhone" or "Android". */
  isMobile: boolean;
  /** Human label, e.g. "Chrome · macOS". Falls back to the truncated raw UA. */
  label: string;
}

/** Order matters: Chromium-based browsers also advertise "Chrome" and "Safari". */
const BROWSERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bEdg(?:e|A|iOS)?\//, 'Edge'],
  [/\bYaBrowser\//, 'Yandex'],
  [/\b(?:OPR|Opera)\b/, 'Opera'],
  [/\b(?:Firefox|FxiOS)\//, 'Firefox'],
  [/\b(?:Chrome|CriOS|Chromium)\//, 'Chrome'],
  [/\bSafari\//, 'Safari'],
];

/** iOS before macOS: iPhone UAs contain "like Mac OS X". */
const SYSTEMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
  [/\bWindows\b/, 'Windows'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bLinux\b|\bX11\b/, 'Linux'],
];

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function parseUserAgent(raw: string): ParsedUserAgent {
  const ua = (raw ?? '').trim();
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1] ?? null;
  const os = SYSTEMS.find(([re]) => re.test(ua))?.[1] ?? null;
  const isMobile = /Mobile|iPhone|Android/i.test(ua);
  const parts = [browser, os].filter((p): p is string => p !== null);
  const label = parts.length > 0 ? parts.join(' · ') : ua ? truncate(ua, 48) : 'Неизвестное устройство';
  return { browser, os, isMobile, label };
}
