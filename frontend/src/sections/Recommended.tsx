import { useMemo } from 'react';
import { getSectionSettings, type PageSection, type Product } from '@merenda/shared';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { useMenuIndex } from '@/features/menu/hooks/useMenuIndex';
import { ProductCard } from '@/features/menu/ProductCard';
import { SectionShell } from './SectionShell';

const PICK: Record<'recommended' | 'popular' | 'new', (p: Product) => boolean> = {
  recommended: (p) => p.isRecommended,
  popular: (p) => p.isPopular,
  new: (p) => p.isNew,
};

/** Horizontal snap-scroll strip of highlighted products. Hidden when empty. */
export function Recommended({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'recommended'>(section);
  const { allProducts, menuIdByProduct, menus } = useMenuIndex();
  const items = useMemo(
    () => allProducts.filter((p) => p.availability === 'available' && PICK[s.source](p)).slice(0, Math.max(1, s.limit)),
    [allProducts, s.source, s.limit],
  );
  if (!items.length) return null;
  const settings = { showImages: true, showDescriptions: true, showTags: false, imageAspect: '4:3' as const };

  return (
    <SectionShell section={section} anchorId={anchorId} className="overflow-hidden">
      <Container>
        <Reveal>
          <SectionHeading title={s.title} subtitle={s.subtitle} className="mb-5 md:mb-7" />
        </Reveal>
      </Container>
      <div className="-mx-0">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:px-6 lg:mx-auto lg:max-w-site lg:px-8 [scroll-padding-inline:1rem]">
          {items.map((p, i) => {
            const menuId = menuIdByProduct.get(p.id) ?? '';
            const fallbackIcon = menus.find((m) => m.id === menuId)?.icon || 'utensils';
            return (
              <Reveal key={p.id} as="li" delay={Math.min(i, 5) * 0.05} className="w-[16rem] shrink-0 snap-start sm:w-[17.5rem]">
                <ProductCard product={p} menuId={menuId} settings={settings} fallbackIcon={fallbackIcon} sizes="280px" />
              </Reveal>
            );
          })}
        </ul>
      </div>
    </SectionShell>
  );
}
