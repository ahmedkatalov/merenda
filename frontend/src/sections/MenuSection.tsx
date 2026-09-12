import { RefreshCw, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSectionSettings, type PageSection } from '@merenda/shared';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/lib/i18n';
import { scrollToElement } from '@/lib/scroll';
import { CategoryBlock } from '@/features/menu/CategoryBlock';
import { CategoryNav } from '@/features/menu/CategoryNav';
import { MenuTabs } from '@/features/menu/MenuTabs';
import { useScrollSpy } from '@/features/menu/hooks/useScrollSpy';
import { categoryAnchor, gridColumns, visibleMenus } from '@/features/menu/visibility';
import { useOrdering } from '@/features/order/ordering';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

function MenuSkeleton() {
  return (
    <div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="product-grid" style={{ ['--cols-tablet' as string]: 2, ['--cols-desktop' as string]: 3 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface overflow-hidden">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuSection({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = useMemo(() => getSectionSettings<'menu'>(section), [section]);
  const { menu, menuState, status } = useSiteData();
  const { venue: ordering } = useOrdering();
  const menus = useMemo(() => visibleMenus(menu?.menus ?? [], s), [menu, s]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const active = menus.find((m) => m.menu.id === activeMenuId) ?? menus[0];

  useEffect(() => {
    if (active && active.menu.id !== activeMenuId) setActiveMenuId(active.menu.id);
  }, [active, activeMenuId]);

  const anchors = useMemo(() => (active ? active.categories.map((c) => categoryAnchor(c.category.id)) : []), [active]);
  const spyActive = useScrollSpy(anchors, s.showCategoryNav);
  const columns = gridColumns(s);

  const onSelectCategory = (anchor: string): void => scrollToElement(document.getElementById(anchor), 1);

  let body: React.ReactNode;
  if (menuState.isPending) body = <MenuSkeleton />;
  else if (menuState.isError)
    body = (
      <div className="card-surface flex flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-muted">{t.menu.loadError}</p>
        <Button variant="secondary" onClick={menuState.refetch}>
          <RefreshCw className="size-4" />
          {t.common.retry}
        </Button>
      </div>
    );
  else if (!active)
    body = (
      <div className="card-surface flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface-alt text-accent">
          <UtensilsCrossed className="size-6" strokeWidth={1.5} />
        </span>
        <p className="font-heading text-[1.25rem] text-heading">{t.menu.empty}</p>
        <p className="text-muted">{t.menu.emptyHint}</p>
      </div>
    );
  else
    body = (
      <>
        {s.showMenuTabs && menus.length > 1 ? (
          <MenuTabs menus={menus.map((m) => m.menu)} activeId={active.menu.id} onChange={(id) => { setActiveMenuId(id); window.setTimeout(() => scrollToElement(document.getElementById(anchorId)), 0); }} status={status} />
        ) : null}
        {s.showCategoryNav ? (
          <CategoryNav
            items={active.categories.map((c) => ({ id: c.category.id, anchor: categoryAnchor(c.category.id), name: c.category.name }))}
            activeAnchor={spyActive}
            onSelect={onSelectCategory}
          />
        ) : null}
        {active.categories.map((c) => (
          <CategoryBlock key={c.category.id} category={c.category} products={c.products} menuId={active.menu.id} settings={s} fallbackIcon={active.menu.icon || 'utensils'} columns={columns} />
        ))}
      </>
    );

  return (
    <SectionShell section={section} anchorId={anchorId}>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading title={s.title} subtitle={s.subtitle} className="mb-6 md:mb-8" />
          {!ordering.enabled ? <span className="mb-6 rounded-full bg-surface-alt px-3 py-1.5 text-[0.8125rem] font-medium text-muted md:mb-8">{t.menu.viewOnly}</span> : null}
        </div>
        {body}
      </Container>
    </SectionShell>
  );
}
