import { Menu as MenuIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { getSectionSettings, type PageSection } from '@merenda/shared';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Sheet } from '@/components/ui/Sheet';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';
import { mediaUrl } from '@/lib/api';
import { useScrolled } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { scrollToId } from '@/lib/scroll';
import { CartButton } from '@/features/cart/CartButton';
import { useOrdering } from '@/features/order/ordering';
import { useSiteData } from '@/features/site/SiteContext';
import { buildNavItems } from './navItems';

const HEIGHT = { compact: 'h-14', normal: 'h-16 md:h-[4.25rem]', tall: 'h-[4.25rem] md:h-20' } as const;
const LOGO = { compact: 'h-8', normal: 'h-9 md:h-10', tall: 'h-10 md:h-12' } as const;

export function Header({ section }: { section: PageSection }) {
  const s = getSectionSettings<'header'>(section);
  const { site, status, media } = useSiteData();
  const { venue: ordering } = useOrdering();
  const ref = useRef<HTMLElement>(null);
  const scrolled = useScrolled(12);
  const [navOpen, setNavOpen] = useState(false);
  const nav = s.showNav ? buildNavItems(site.sections) : [];
  const logo = media(site.business.logoId);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = (): void => {
      const h = el.offsetHeight;
      root.style.setProperty('--header-h', `${h}px`);
      root.style.setProperty('--sticky-top', s.sticky ? `${h}px` : '0px');
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [s.sticky, s.height]);

  const go = (anchor: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setNavOpen(false);
    window.setTimeout(() => scrollToId(anchor), navOpen ? 120 : 0);
  };

  const bg = s.background === 'solid' || (s.background === 'transparent' && scrolled && s.sticky) ? 'bg-surface-solid border-b border-border/70' : s.background === 'blur' ? 'blur-surface border-b border-border/60' : '';
  const brand = (
    <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex min-w-0 items-center gap-3" aria-label={site.business.name}>
      {s.showLogo && logo ? (
        <img src={mediaUrl(logo.thumbUrl || logo.url)} alt={logo.alt || site.business.name} width={logo.width || undefined} height={logo.height || undefined} className={cn('w-auto shrink-0 object-contain', LOGO[s.height])} decoding="async" />
      ) : null}
      {s.showName || !logo ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-heading text-[1.125rem] tracking-[0.08em] text-heading uppercase md:text-[1.25rem]">{site.business.name}</span>
          {s.showTagline && site.business.tagline ? (
            <span className="mt-1 truncate text-[0.625rem] font-semibold tracking-[0.2em] text-muted uppercase">{site.business.tagline}</span>
          ) : null}
        </span>
      ) : null}
    </a>
  );

  return (
    <header ref={ref} data-section-id={section.id} className={cn('z-40 w-full transition-[background-color,box-shadow] duration-300', s.sticky && 'sticky top-0', bg, scrolled && s.sticky && 'shadow-card')}>
      <Container className={cn('flex items-center justify-between gap-3', HEIGHT[s.height])}>
        {brand}
        {nav.length ? (
          <nav aria-label={t.nav.ariaMain} className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <a key={item.id} href={`#${item.anchor}`} onClick={go(item.anchor)} className="rounded-button px-3 py-2 text-[0.9375rem] font-medium text-body transition-colors hover:bg-surface-alt hover:text-heading">
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {s.showStatus ? <StatusPill status={status} size="sm" className="hidden sm:inline-flex" /> : null}
          {s.ctaLabel && s.ctaUrl ? (
            <ButtonLink href={s.ctaUrl} variant="secondary" size="sm" className="hidden md:inline-flex" target={s.ctaUrl.startsWith('http') ? '_blank' : undefined} rel="noopener">
              {s.ctaLabel}
            </ButtonLink>
          ) : null}
          {s.showCart && ordering.enabled ? <CartButton /> : null}
          {nav.length || s.showStatus ? (
            <button type="button" onClick={() => setNavOpen(true)} aria-label={t.nav.openMenu} className="flex size-11 items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-alt lg:hidden">
              <MenuIcon className="size-6" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
      </Container>
      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title={site.business.name}>
        <div className="flex flex-col gap-4 pb-2">
          {s.showStatus ? <StatusPill status={status} verbose /> : null}
          <nav aria-label={t.nav.ariaMain} className="flex flex-col">
            {nav.map((item) => (
              <a key={item.id} href={`#${item.anchor}`} onClick={go(item.anchor)} className="flex min-h-12 items-center border-b border-border/70 font-heading text-[1.25rem] text-heading last:border-b-0">
                {item.label}
              </a>
            ))}
          </nav>
          {s.ctaLabel && s.ctaUrl ? (
            <ButtonLink href={s.ctaUrl} variant="primary" size="lg" full target={s.ctaUrl.startsWith('http') ? '_blank' : undefined} rel="noopener">
              {s.ctaLabel}
            </ButtonLink>
          ) : null}
        </div>
      </Sheet>
    </header>
  );
}
