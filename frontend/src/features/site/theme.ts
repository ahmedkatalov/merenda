import { applyThemeToElement, buildFontsUrl, normalizeTheme, type ThemeSettings } from '@merenda/shared';

const FONT_LINK_ID = 'site-fonts';

function ensurePreconnect(href: string, crossOrigin = false): void {
  if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  if (crossOrigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function ensureFonts(theme: ThemeSettings): void {
  const href = buildFontsUrl(theme);
  const existing = document.getElementById(FONT_LINK_ID);
  if (existing instanceof HTMLLinkElement) {
    if (existing.href !== href) existing.href = href;
    return;
  }
  ensurePreconnect('https://fonts.googleapis.com');
  ensurePreconnect('https://fonts.gstatic.com', true);
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Applies the theme to <html>: CSS variables, data attributes, fonts. */
export function applySiteTheme(input: ThemeSettings): ThemeSettings {
  const theme = normalizeTheme(input);
  applyThemeToElement(theme, document.documentElement);
  ensureFonts(theme);
  return theme;
}
