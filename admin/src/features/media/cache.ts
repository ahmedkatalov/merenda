import { useEffect } from 'react';
import { create } from 'zustand';
import type { Media } from '@merenda/shared';
import { mediaApi } from './api';

interface MediaCacheState {
  byId: Record<string, Media>;
  /** ids known to be missing on the server (404) — don't refetch them. */
  missing: Record<string, true>;
  warmed: boolean;
  remember: (media: Media | Media[] | null | undefined) => void;
  forget: (id: string) => void;
  warm: () => Promise<void>;
  ensure: (id: string) => void;
}

let warming: Promise<void> | null = null;
const inflight = new Set<string>();

/**
 * In-memory registry of Media objects seen in this session (lists, pickers, uploads).
 * Settings and sections store only ids; this resolves them to thumbnails and builds
 * the preview `media` map. `warm()` loads the newest page; `ensure()` lazily fetches
 * any referenced id that falls outside that page via GET /media/:id.
 */
export const useMediaCache = create<MediaCacheState>((set, get) => ({
  byId: {},
  missing: {},
  warmed: false,
  remember: (media) => {
    if (!media) return;
    const list = Array.isArray(media) ? media : [media];
    if (list.length === 0) return;
    set((s) => {
      const next = { ...s.byId };
      for (const m of list) next[m.id] = m;
      return { byId: next };
    });
  },
  forget: (id) =>
    set((s) => {
      const next = { ...s.byId };
      delete next[id];
      return { byId: next };
    }),
  warm: async () => {
    if (get().warmed) return;
    if (!warming) {
      warming = mediaApi
        .list({ page: 1, perPage: 200 })
        .then((res) => {
          get().remember(res.items);
          set({ warmed: true });
        })
        .catch(() => undefined)
        .finally(() => {
          warming = null;
        });
    }
    return warming;
  },
  ensure: (id) => {
    if (!id) return;
    const s = get();
    if (s.byId[id] || s.missing[id] || inflight.has(id)) return;
    inflight.add(id);
    mediaApi
      .get(id)
      .then((m) => get().remember(m))
      .catch(() => set((st) => ({ missing: { ...st.missing, [id]: true } })))
      .finally(() => inflight.delete(id));
  },
}));

export function useMediaById(id: string | null | undefined): Media | null {
  const media = useMediaCache((s) => (id ? (s.byId[id] ?? null) : null));
  const ensure = useMediaCache((s) => s.ensure);
  useEffect(() => {
    if (id && !media) ensure(id);
  }, [id, media, ensure]);
  return media;
}
