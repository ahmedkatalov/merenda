import { useEffect, useState } from 'react';
import { stickyOffset } from '@/lib/scroll';

/**
 * Tracks which of the given element ids is currently "active": the last one
 * whose top edge has scrolled past the sticky header + category nav.
 */
export function useScrollSpy(ids: string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  // Key the effect on the list contents, not the array identity, so a new
  // array reference from the parent's render does not re-subscribe listeners.
  const idsKey = ids.join('|');

  useEffect(() => {
    const list = idsKey ? idsKey.split('|') : [];
    if (!enabled || list.length === 0) return;
    let raf = 0;
    const compute = (): void => {
      const offset = stickyOffset(true) + 24;
      let current: string | null = null;
      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) current = id;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) current = list[list.length - 1] ?? current;
      setActive(current ?? list[0] ?? null);
    };
    const onScroll = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [idsKey, enabled]);

  return active;
}
