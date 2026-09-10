import { create } from 'zustand';
import { getPreset, normalizeTheme, type ThemeSettings } from '@merenda/shared';
import { deepEqual } from '@/lib/utils';

type ObjectSection = 'colors' | 'typography' | 'shape' | 'effects' | 'layout';

interface ThemeDraftState {
  /** Last value known to be persisted. */
  saved: ThemeSettings | null;
  /** What the user is editing (drives the live preview). */
  draft: ThemeSettings | null;
  /** Initialise from the server; keeps an existing unsaved draft. */
  init: (theme: ThemeSettings) => void;
  markSaved: (theme: ThemeSettings) => void;
  setDraft: (next: ThemeSettings) => void;
  /** Patch one object section; any manual edit detaches the theme from its preset. */
  patch: <K extends ObjectSection>(section: K, partial: Partial<ThemeSettings[K]>) => void;
  setMode: (mode: ThemeSettings['mode']) => void;
  applyPreset: (id: string) => void;
  reset: () => void;
}

const clone = (t: ThemeSettings): ThemeSettings => JSON.parse(JSON.stringify(t)) as ThemeSettings;

export const useThemeDraft = create<ThemeDraftState>((set, get) => ({
  saved: null,
  draft: null,
  init: (theme) => {
    const normalized = normalizeTheme(theme);
    const { saved, draft } = get();
    const dirty = saved && draft && !deepEqual(saved, draft);
    set({ saved: normalized, draft: dirty ? draft : clone(normalized) });
  },
  markSaved: (theme) => {
    const normalized = normalizeTheme(theme);
    set({ saved: normalized, draft: clone(normalized) });
  },
  setDraft: (next) => set({ draft: next }),
  patch: (section, partial) => {
    const { draft } = get();
    if (!draft) return;
    set({ draft: { ...draft, preset: null, [section]: { ...draft[section], ...partial } } });
  },
  setMode: (mode) => {
    const { draft } = get();
    if (!draft) return;
    set({ draft: { ...draft, preset: null, mode } });
  },
  applyPreset: (id) => {
    const preset = getPreset(id);
    if (!preset) return;
    set({ draft: clone(normalizeTheme({ ...preset.theme, preset: id })) });
  },
  reset: () => {
    const { saved } = get();
    if (saved) set({ draft: clone(saved) });
  },
}));

export const useIsThemeDirty = () => useThemeDraft((s) => (s.saved && s.draft ? !deepEqual(s.saved, s.draft) : false));
