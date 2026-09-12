import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

let lockCount = 0;

export function useScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;
    lockCount += 1;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Ordered stack of open overlays, so Escape only closes the topmost one. */
const escapeStack: symbol[] = [];

export function useEscape(active: boolean, onEscape: () => void) {
  const handler = useRef(onEscape);
  handler.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const token = Symbol('overlay');
    escapeStack.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Only the last-opened overlay reacts, so a dialog nested in a drawer
      // (e.g. the media picker) does not also close its parent.
      if (escapeStack[escapeStack.length - 1] !== token) return;
      e.stopPropagation();
      handler.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = escapeStack.lastIndexOf(token);
      if (i >= 0) escapeStack.splice(i, 1);
    };
  }, [active]);
}

/** Keep the element mounted for `ms` after `open` turns false so the exit animation can play. */
export function useMountTransition(open: boolean, ms = 180): { mounted: boolean; visible: boolean } {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return { mounted, visible };
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Move focus into the panel on open, trap Tab inside, restore focus on close. */
export function useFocusTrap(active: boolean, ref: RefObject<HTMLElement | null>) {
  const previous = useRef<Element | null>(null);
  useEffect(() => {
    if (!active) return;
    previous.current = document.activeElement;
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => {
      const auto = el.querySelector<HTMLElement>('[data-autofocus]');
      const first = auto ?? el.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? el).focus({ preventScroll: true });
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      el.removeEventListener('keydown', onKey);
      const prev = previous.current;
      if (prev instanceof HTMLElement) prev.focus({ preventScroll: true });
    };
  }, [active, ref]);
}

export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
