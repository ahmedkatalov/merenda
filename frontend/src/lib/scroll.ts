function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readPx(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Sticky header (+ sticky category nav when present) height in px. */
export function stickyOffset(withCategoryNav = false): number {
  return readPx('--sticky-top') + (withCategoryNav ? readPx('--catnav-h') : 0);
}

export function scrollToElement(el: HTMLElement | null, extraOffset = 0): void {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset(extraOffset > 0) - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export function scrollToId(id: string): void {
  scrollToElement(document.getElementById(id));
}

export function scrollToSectionType(type: string): void {
  scrollToId(type);
}
