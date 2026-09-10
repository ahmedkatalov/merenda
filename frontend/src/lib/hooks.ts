import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeMedia(query: string, cb: () => void): () => void {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribeMedia(query, cb),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsTabletUp = (): boolean => useMediaQuery('(min-width: 768px)');
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');
export const useCanHover = (): boolean => useMediaQuery('(hover: hover) and (pointer: fine)');

/** True once the window has been scrolled past `threshold` px. */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(() => (typeof window !== 'undefined' ? window.scrollY > threshold : false));
  useEffect(() => {
    let raf = 0;
    const onScroll = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > threshold));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);
  return scrolled;
}

/** Copies text to the clipboard; returns whether it worked. */
export function useCopy(resetMs = 1800): [copied: boolean, copy: (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetMs);
      } catch {
        setCopied(false);
      }
    },
    [resetMs],
  );
  return [copied, copy];
}

let lockCount = 0;
let savedPadding = '';

/** Locks body scroll while `locked` is true (ref-counted, scrollbar-gutter aware). */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    if (lockCount === 0) {
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      savedPadding = body.style.paddingRight;
      if (gutter > 0) body.style.paddingRight = `${gutter}px`;
      body.style.overflow = 'hidden';
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.style.overflow = '';
        body.style.paddingRight = savedPadding;
      }
    };
  }, [locked]);
}

/** Calls `handler` on Escape while `active`. */
export function useEscape(active: boolean, handler: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, handler]);
}
