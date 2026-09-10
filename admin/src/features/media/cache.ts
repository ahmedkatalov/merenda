import { create } from 'zustand';
import type { Media } from '@merenda/shared';
import { mediaApi } from './api';

interface MediaCacheState {
  byId: Record<string, Media>;
  warmed: boolean;
  remember: (media: Media | Media[] | null | undefined) => void;
  forget: (id: string) => void;
  warm: () => Promise<void>;
}

let warming: Promise<void> | null = null;

/**
 * In-memory registry of Media objects seen in this session (lists, pickers, uploads).
 * Settings and sections store only ids, so this lets us show thumbnails and build the
 * preview `media` map without a by-id endpoint.
 */
export const useMediaCache = create<MediaCacheState>((set, get) => ({
  byId: {},
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
}));

export function useMediaById(id: string | null | undefined): Media | null {
  return useMediaCache((s) => (id ? (s.byId[id] ?? null) : null));
}
