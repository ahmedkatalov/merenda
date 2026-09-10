import type { ThemeSettings, ThemePreset } from './types';

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

export interface FontOption {
  family: string;
  category: 'sans' | 'serif' | 'display';
  /** Whether the Google Fonts build ships Cyrillic glyphs (important for Russian UI). */
  cyrillic: boolean;
  weights: number[];
}

export const FONT_OPTIONS: FontOption[] = [
  { family: 'Inter', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Manrope', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700, 800] },
  { family: 'Golos Text', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Onest', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Montserrat', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Nunito Sans', category: 'sans', cyrillic: true, weights: [400, 600, 700] },
  { family: 'Raleway', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Jost', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Rubik', category: 'sans', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'DM Sans', category: 'sans', cyrillic: false, weights: [400, 500, 600, 700] },
  { family: 'Playfair Display', category: 'serif', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Cormorant Garamond', category: 'serif', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Lora', category: 'serif', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Merriweather', category: 'serif', cyrillic: true, weights: [400, 700] },
  { family: 'PT Serif', category: 'serif', cyrillic: true, weights: [400, 700] },
  { family: 'Unbounded', category: 'display', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Oswald', category: 'display', cyrillic: true, weights: [400, 500, 600, 700] },
  { family: 'Comfortaa', category: 'display', cyrillic: true, weights: [400, 500, 600, 700] },
];

const GENERIC_FALLBACK: Record<FontOption['category'], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  display: 'ui-sans-serif, system-ui, sans-serif',
};

export function fontStack(family: string): string {
  const opt = FONT_OPTIONS.find((f) => f.family === family);
  const fallback = GENERIC_FALLBACK[opt?.category ?? 'sans'];
  return `"${family}", ${fallback}`;
}

/** Google Fonts CSS URL loading only the families the theme uses. */
export function buildFontsUrl(theme: Pick<ThemeSettings, 'typography'>): string {
  const families = Array.from(new Set([theme.typography.headingFont, theme.typography.bodyFont]));
  const parts = families
    .map((family) => {
      const opt = FONT_OPTIONS.find((f) => f.family === family);
      const weights = (opt?.weights ?? [400, 500, 600, 700]).join(';');
      return `family=${family.replace(/ /g, '+')}:wght@${weights}`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${parts}&display=swap`;
}

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

const base = (overrides: Partial<ThemeSettings> & { colors: ThemeSettings['colors'] }): ThemeSettings => ({
  preset: null,
  mode: 'light',
  typography: {
    headingFont: 'Manrope',
    bodyFont: 'Manrope',
    baseSize: 16,
    headingWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.6,
    headingLetterSpacing: -0.02,
    headingTransform: 'none',
  },
  shape: { radiusButton: 12, radiusCard: 16, radiusImage: 12, radiusInput: 10, borderWidth: 1 },
  effects: { shadow: 'sm', shadowIntensity: 40, blur: 12, surfaceOpacity: 100 },
  layout: { density: 'comfortable', maxWidth: 1200, buttonStyle: 'solid' },
  ...overrides,
});

/** Merenda default — warm cream, deep brown, gold accent; matches the printed menu. */
export const ELEGANT_THEME: ThemeSettings = base({
  preset: 'elegant',
  colors: {
    primary: '#5B4030',
    primaryHover: '#4A3326',
    primaryActive: '#3A281E',
    onPrimary: '#FBF8F2',
    secondary: '#8E7A66',
    accent: '#B98B4E',
    background: '#F5EFE5',
    surface: '#FBF8F2',
    surfaceAlt: '#EEE5D6',
    border: '#E1D5C2',
    text: '#2E2620',
    textMuted: '#7A6C5F',
    heading: '#221A14',
    success: '#3E7C4F',
    warning: '#C08A2C',
    danger: '#B5443C',
    disabled: '#C8BEB1',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Manrope',
    baseSize: 16,
    headingWeight: 600,
    bodyWeight: 400,
    lineHeight: 1.6,
    headingLetterSpacing: -0.01,
    headingTransform: 'none',
  },
  shape: { radiusButton: 12, radiusCard: 18, radiusImage: 14, radiusInput: 10, borderWidth: 1 },
  effects: { shadow: 'sm', shadowIntensity: 35, blur: 14, surfaceOpacity: 100 },
});

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Тёплая кремовая палитра, серифные заголовки, золотой акцент.',
    theme: ELEGANT_THEME,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Белый фон, чёрный текст, минимум декора.',
    theme: base({
      preset: 'minimal',
      colors: {
        primary: '#111111',
        primaryHover: '#2A2A2A',
        primaryActive: '#000000',
        onPrimary: '#FFFFFF',
        secondary: '#6B6B6B',
        accent: '#111111',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F5F5F5',
        border: '#E6E6E6',
        text: '#1A1A1A',
        textMuted: '#737373',
        heading: '#0A0A0A',
        success: '#2E7D4F',
        warning: '#B7791F',
        danger: '#C53030',
        disabled: '#D4D4D4',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
        headingWeight: 600,
        bodyWeight: 400,
        lineHeight: 1.55,
        headingLetterSpacing: -0.02,
        headingTransform: 'none',
      },
      shape: { radiusButton: 6, radiusCard: 8, radiusImage: 6, radiusInput: 6, borderWidth: 1 },
      effects: { shadow: 'none', shadowIntensity: 0, blur: 8, surfaceOpacity: 100 },
      layout: { density: 'compact', maxWidth: 1120, buttonStyle: 'solid' },
    }),
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Нейтральная светлая палитра, синий акцент, крупные радиусы.',
    theme: base({
      preset: 'modern',
      colors: {
        primary: '#0F172A',
        primaryHover: '#1E293B',
        primaryActive: '#020617',
        onPrimary: '#FFFFFF',
        secondary: '#64748B',
        accent: '#2F6FED',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F5F9',
        border: '#E2E8F0',
        text: '#1E293B',
        textMuted: '#64748B',
        heading: '#0F172A',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        disabled: '#CBD5E1',
      },
      typography: {
        headingFont: 'Manrope',
        bodyFont: 'Manrope',
        baseSize: 16,
        headingWeight: 800,
        bodyWeight: 400,
        lineHeight: 1.6,
        headingLetterSpacing: -0.03,
        headingTransform: 'none',
      },
      shape: { radiusButton: 14, radiusCard: 20, radiusImage: 16, radiusInput: 12, borderWidth: 1 },
      effects: { shadow: 'md', shadowIntensity: 30, blur: 16, surfaceOpacity: 100 },
    }),
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Слоновая кость, графит и золото. Прописные заголовки, острые углы.',
    theme: base({
      preset: 'premium',
      colors: {
        primary: '#1B1B1B',
        primaryHover: '#2E2E2E',
        primaryActive: '#000000',
        onPrimary: '#FAF7F0',
        secondary: '#6F6A62',
        accent: '#C9A24B',
        background: '#FAF7F0',
        surface: '#FFFDF8',
        surfaceAlt: '#F2EDE2',
        border: '#E4DCCB',
        text: '#2A2A2A',
        textMuted: '#7A7469',
        heading: '#161616',
        success: '#3C7A52',
        warning: '#B7791F',
        danger: '#A83A32',
        disabled: '#D3CDC1',
      },
      typography: {
        headingFont: 'Cormorant Garamond',
        bodyFont: 'Inter',
        baseSize: 16,
        headingWeight: 600,
        bodyWeight: 400,
        lineHeight: 1.65,
        headingLetterSpacing: 0.04,
        headingTransform: 'uppercase',
      },
      shape: { radiusButton: 2, radiusCard: 4, radiusImage: 2, radiusInput: 2, borderWidth: 1 },
      effects: { shadow: 'none', shadowIntensity: 0, blur: 10, surfaceOpacity: 100 },
      layout: { density: 'spacious', maxWidth: 1240, buttonStyle: 'solid' },
    }),
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Мягкие пастельные тона, терракота и большие скругления.',
    theme: base({
      preset: 'soft',
      colors: {
        primary: '#B56A4F',
        primaryHover: '#A25D44',
        primaryActive: '#8E503A',
        onPrimary: '#FFFFFF',
        secondary: '#9C8B80',
        accent: '#E0A458',
        background: '#FBF6F2',
        surface: '#FFFFFF',
        surfaceAlt: '#F6ECE5',
        border: '#EEDFD5',
        text: '#3D3430',
        textMuted: '#8A7B72',
        heading: '#2E2622',
        success: '#4C9A6A',
        warning: '#D8973C',
        danger: '#C9564D',
        disabled: '#DACFC7',
      },
      typography: {
        headingFont: 'Golos Text',
        bodyFont: 'Golos Text',
        baseSize: 16,
        headingWeight: 700,
        bodyWeight: 400,
        lineHeight: 1.65,
        headingLetterSpacing: -0.01,
        headingTransform: 'none',
      },
      shape: { radiusButton: 999, radiusCard: 24, radiusImage: 20, radiusInput: 14, borderWidth: 1 },
      effects: { shadow: 'sm', shadowIntensity: 25, blur: 14, surfaceOpacity: 100 },
      layout: { density: 'comfortable', maxWidth: 1180, buttonStyle: 'soft' },
    }),
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Тёмный интерфейс с золотым акцентом.',
    theme: base({
      preset: 'dark',
      mode: 'dark',
      colors: {
        primary: '#D4A960',
        primaryHover: '#E0B872',
        primaryActive: '#C1984F',
        onPrimary: '#151311',
        secondary: '#9A9086',
        accent: '#D4A960',
        background: '#131211',
        surface: '#1C1A18',
        surfaceAlt: '#262320',
        border: '#302C28',
        text: '#E8E3DB',
        textMuted: '#A39B90',
        heading: '#F5F1EA',
        success: '#5FB27C',
        warning: '#E0A84C',
        danger: '#E06C62',
        disabled: '#4A443E',
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        baseSize: 16,
        headingWeight: 600,
        bodyWeight: 400,
        lineHeight: 1.6,
        headingLetterSpacing: -0.01,
        headingTransform: 'none',
      },
      shape: { radiusButton: 10, radiusCard: 16, radiusImage: 12, radiusInput: 10, borderWidth: 1 },
      effects: { shadow: 'md', shadowIntensity: 60, blur: 16, surfaceOpacity: 100 },
    }),
  },
];

export const DEFAULT_THEME = ELEGANT_THEME;

export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

const DENSITY_UNIT: Record<ThemeSettings['layout']['density'], number> = {
  compact: 0.85,
  comfortable: 1,
  spacious: 1.2,
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildShadow(theme: ThemeSettings): { card: string; elevated: string } {
  const { shadow, shadowIntensity } = theme.effects;
  if (shadow === 'none') return { card: 'none', elevated: 'none' };
  const base = theme.mode === 'dark' ? '#000000' : theme.colors.heading;
  const a = Math.max(0, Math.min(1, shadowIntensity / 100)) * (theme.mode === 'dark' ? 0.9 : 0.35);
  const sizes: Record<'sm' | 'md' | 'lg', [string, string]> = {
    sm: [`0 1px 2px ${rgba(base, a * 0.6)}, 0 4px 12px ${rgba(base, a * 0.35)}`, `0 8px 24px ${rgba(base, a * 0.7)}`],
    md: [`0 2px 6px ${rgba(base, a * 0.5)}, 0 12px 32px ${rgba(base, a * 0.45)}`, `0 16px 48px ${rgba(base, a * 0.8)}`],
    lg: [`0 4px 12px ${rgba(base, a * 0.5)}, 0 24px 60px ${rgba(base, a * 0.6)}`, `0 24px 80px ${rgba(base, a)}`],
  };
  const [card, elevated] = sizes[shadow];
  return { card, elevated };
}

/**
 * Convert a theme into CSS custom properties. Both the site and the admin
 * live preview apply these to `document.documentElement`.
 */
export function themeToCssVars(theme: ThemeSettings): Record<string, string> {
  const c = theme.colors;
  const t = theme.typography;
  const s = theme.shape;
  const e = theme.effects;
  const l = theme.layout;
  const shadows = buildShadow(theme);
  return {
    '--color-primary': c.primary,
    '--color-primary-hover': c.primaryHover,
    '--color-primary-active': c.primaryActive,
    '--color-on-primary': c.onPrimary,
    '--color-primary-soft': rgba(c.primary, theme.mode === 'dark' ? 0.18 : 0.1),
    '--color-secondary': c.secondary,
    '--color-accent': c.accent,
    '--color-accent-soft': rgba(c.accent, 0.14),
    '--color-bg': c.background,
    '--color-surface': e.surfaceOpacity >= 100 ? c.surface : rgba(c.surface, e.surfaceOpacity / 100),
    '--color-surface-solid': c.surface,
    '--color-surface-alt': c.surfaceAlt,
    '--color-border': c.border,
    '--color-text': c.text,
    '--color-text-muted': c.textMuted,
    '--color-heading': c.heading,
    '--color-success': c.success,
    '--color-success-soft': rgba(c.success, 0.12),
    '--color-warning': c.warning,
    '--color-warning-soft': rgba(c.warning, 0.14),
    '--color-danger': c.danger,
    '--color-danger-soft': rgba(c.danger, 0.12),
    '--color-disabled': c.disabled,
    '--font-heading': fontStack(t.headingFont),
    '--font-body': fontStack(t.bodyFont),
    '--font-size-base': `${t.baseSize}px`,
    '--font-weight-heading': String(t.headingWeight),
    '--font-weight-body': String(t.bodyWeight),
    '--line-height': String(t.lineHeight),
    '--heading-letter-spacing': `${t.headingLetterSpacing}em`,
    '--heading-transform': t.headingTransform,
    '--radius-button': `${s.radiusButton}px`,
    '--radius-card': `${s.radiusCard}px`,
    '--radius-image': `${s.radiusImage}px`,
    '--radius-input': `${s.radiusInput}px`,
    '--border-width': `${s.borderWidth}px`,
    '--shadow-card': shadows.card,
    '--shadow-elevated': shadows.elevated,
    '--blur': `${e.blur}px`,
    '--space-unit': String(DENSITY_UNIT[l.density]),
    '--max-width': `${l.maxWidth}px`,
    '--color-scheme': theme.mode,
  };
}

export function applyThemeToElement(theme: ThemeSettings, el: HTMLElement): void {
  const vars = themeToCssVars(theme);
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  el.dataset.themeMode = theme.mode;
  el.dataset.buttonStyle = theme.layout.buttonStyle;
}

/** Deep-merge a partial theme over defaults; used when reading stored settings. */
export function normalizeTheme(input: unknown): ThemeSettings {
  const d = DEFAULT_THEME;
  const src = (input ?? {}) as Partial<ThemeSettings>;
  return {
    preset: src.preset ?? null,
    mode: src.mode === 'dark' ? 'dark' : 'light',
    colors: { ...d.colors, ...(src.colors ?? {}) },
    typography: { ...d.typography, ...(src.typography ?? {}) },
    shape: { ...d.shape, ...(src.shape ?? {}) },
    effects: { ...d.effects, ...(src.effects ?? {}) },
    layout: { ...d.layout, ...(src.layout ?? {}) },
  };
}
