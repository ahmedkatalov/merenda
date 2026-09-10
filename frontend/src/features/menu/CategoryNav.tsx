import { LayoutGroup, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

export interface CategoryNavItem {
  id: string;
  anchor: string;
  name: string;
}

interface Props {
  items: CategoryNavItem[];
  activeAnchor: string | null;
  onSelect: (anchor: string) => void;
}

/** Sticky, horizontally scrollable category chips with scroll-spy highlight. */
export function CategoryNav({ items, activeAnchor, onSelect }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const update = (): void => root.style.setProperty('--catnav-h', `${bar.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      root.style.setProperty('--catnav-h', '0px');
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeAnchor) return;
    const chip = scroller.querySelector<HTMLElement>(`[data-anchor="${activeAnchor}"]`);
    if (!chip) return;
    const target = chip.offsetLeft - scroller.clientWidth / 2 + chip.offsetWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeAnchor]);

  if (items.length < 2) return null;

  return (
    <div ref={barRef} className="sticky z-30 -mx-4 mb-6 blur-surface px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" style={{ top: 'var(--sticky-top)' }}>
      <LayoutGroup id="category-nav">
        <nav aria-label={t.menu.categories}>
          <div ref={scrollerRef} className="flex gap-2 overflow-x-auto py-2.5 scrollbar-none [scroll-padding-inline:1rem]">
            {items.map((item) => {
              const isActive = item.anchor === activeAnchor;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-anchor={item.anchor}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSelect(item.anchor)}
                  className={cn(
                    'relative inline-flex h-10 shrink-0 items-center rounded-full px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors',
                    isActive ? 'text-on-primary' : 'bg-surface-alt text-heading hover:bg-border',
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="category-chip"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                    />
                  ) : null}
                  <span className="relative">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </LayoutGroup>
    </div>
  );
}
