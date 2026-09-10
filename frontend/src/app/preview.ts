import { create } from 'zustand';
import type { BusinessSettings, Media, PageSection, PreviewMessage, ThemeSettings, UUID } from '@merenda/shared';

export const isPreview: boolean =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';

interface PreviewState {
  theme: ThemeSettings | null;
  sections: PageSection[] | null;
  media: Record<UUID, Media>;
  business: BusinessSettings | null;
  /** Section id + nonce so repeated scroll requests re-trigger. */
  scrollTo: { sectionId: UUID; nonce: number } | null;
  apply: (msg: PreviewMessage) => void;
}

export const usePreviewStore = create<PreviewState>()((set) => ({
  theme: null,
  sections: null,
  media: {},
  business: null,
  scrollTo: null,
  apply: (msg) => {
    switch (msg.type) {
      case 'merenda:preview:theme':
        set({ theme: msg.theme });
        break;
      case 'merenda:preview:sections':
        set((s) => ({ sections: msg.sections, media: msg.media ? { ...s.media, ...msg.media } : s.media }));
        break;
      case 'merenda:preview:business':
        set({ business: msg.business });
        break;
      case 'merenda:preview:scroll':
        set({ scrollTo: { sectionId: msg.sectionId, nonce: Date.now() } });
        break;
      case 'merenda:preview:ready':
        break;
    }
  },
}));

function isPreviewMessage(data: unknown): data is PreviewMessage {
  if (typeof data !== 'object' || data === null) return false;
  const type = (data as { type?: unknown }).type;
  return typeof type === 'string' && type.startsWith('merenda:preview:');
}

/** Registers the postMessage bridge. Returns a cleanup function. */
export function startPreviewBridge(): () => void {
  if (!isPreview) return () => undefined;
  const onMessage = (event: MessageEvent<unknown>): void => {
    if (!isPreviewMessage(event.data)) return;
    usePreviewStore.getState().apply(event.data);
  };
  window.addEventListener('message', onMessage);
  try {
    window.parent?.postMessage({ type: 'merenda:preview:ready' } satisfies PreviewMessage, '*');
  } catch {
    /* no parent */
  }
  return () => window.removeEventListener('message', onMessage);
}
