import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Currency, Media, PageSection, PublicMenuResponse, SiteBootstrap, SiteStatus, UUID } from '@merenda/shared';
import { normalizeTheme } from '@merenda/shared';
import { isPreview, usePreviewStore } from '@/app/preview';
import { applySiteTheme } from './theme';
import { useMenu, useStatus } from './hooks/useSiteQueries';

export interface MenuQueryState {
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface SiteData {
  site: SiteBootstrap;
  status: SiteStatus;
  menu: PublicMenuResponse | undefined;
  menuState: MenuQueryState;
  currency: Currency;
  media: (id: UUID | null | undefined) => Media | null;
  isPreview: boolean;
}

const SiteContext = createContext<SiteData | null>(null);

function sortSections(sections: PageSection[]): PageSection[] {
  return sections.filter((s) => s.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function SiteProvider({ bootstrap, children }: { bootstrap: SiteBootstrap; children: ReactNode }) {
  const preview = usePreviewStore();
  const statusQuery = useStatus(bootstrap.status);
  const menuQuery = useMenu();

  const site = useMemo<SiteBootstrap>(() => {
    const theme = normalizeTheme(preview.theme ?? bootstrap.theme);
    return {
      ...bootstrap,
      theme,
      business: preview.business ?? bootstrap.business,
      sections: preview.sections ? sortSections(preview.sections) : sortSections(bootstrap.sections),
      media: { ...bootstrap.media, ...preview.media },
    };
  }, [bootstrap, preview.theme, preview.business, preview.sections, preview.media]);

  useEffect(() => {
    applySiteTheme(site.theme);
  }, [site.theme]);

  const value = useMemo<SiteData>(
    () => ({
      site,
      status: statusQuery.data ?? bootstrap.status,
      menu: menuQuery.data,
      menuState: { isPending: menuQuery.isPending, isError: menuQuery.isError, refetch: () => void menuQuery.refetch() },
      currency: site.business.currency,
      media: (id) => (id ? (site.media[id] ?? null) : null),
      isPreview,
    }),
    [site, statusQuery.data, bootstrap.status, menuQuery],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSiteData(): SiteData {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSiteData must be used inside <SiteProvider>');
  return ctx;
}
