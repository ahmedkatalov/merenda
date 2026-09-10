import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import type { PageSection, SectionType } from '@merenda/shared';
import { useSiteData } from '@/features/site/SiteContext';
import { Header } from './Header';
import { Hero } from './Hero';
import { MenuSection } from './MenuSection';
import { Recommended } from './Recommended';
import { sectionAnchorIds } from './navItems';

type SectionProps = { section: PageSection; anchorId: string };

const LAZY: Partial<Record<SectionType, ComponentType<SectionProps>>> = {
  about: lazy(() => import('./About')),
  promotions: lazy(() => import('./Promotions')),
  gallery: lazy(() => import('./Gallery')),
  hours: lazy(() => import('./Hours')),
  contacts: lazy(() => import('./Contacts')),
  social: lazy(() => import('./Social')),
};

const Footer = lazy(() => import('./Footer'));

function renderSection(section: PageSection, anchorId: string): ReactNode {
  switch (section.type) {
    case 'hero':
      return <Hero key={section.id} section={section} anchorId={anchorId} />;
    case 'menu':
      return <MenuSection key={section.id} section={section} anchorId={anchorId} />;
    case 'recommended':
      return <Recommended key={section.id} section={section} anchorId={anchorId} />;
    default: {
      const Cmp = LAZY[section.type];
      if (!Cmp) return null;
      return (
        <Suspense key={section.id} fallback={<div className="min-h-40" aria-hidden />}>
          <Cmp section={section} anchorId={anchorId} />
        </Suspense>
      );
    }
  }
}

/** Maps the enabled, sorted `sections[]` to components; header/footer are pinned outside <main>. */
export function SectionRenderer() {
  const { site } = useSiteData();
  const anchors = sectionAnchorIds(site.sections);
  const header = site.sections.find((s) => s.type === 'header');
  const footer = site.sections.find((s) => s.type === 'footer');
  const body = site.sections.filter((s) => s.type !== 'header' && s.type !== 'footer');

  return (
    <>
      {header ? <Header section={header} /> : null}
      <main className="flex-1">{body.map((section) => renderSection(section, anchors.get(section.id) ?? section.type))}</main>
      {footer ? (
        <Suspense fallback={<div className="min-h-40" aria-hidden />}>
          <Footer section={footer} />
        </Suspense>
      ) : null}
    </>
  );
}
