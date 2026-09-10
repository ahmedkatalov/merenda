import type { PageSection, SectionType } from '@merenda/shared';
import { t } from '@/lib/i18n';

const NAV_LABELS: Partial<Record<SectionType, string>> = {
  menu: t.nav.menu,
  promotions: t.nav.promotions,
  about: t.nav.about,
  gallery: t.nav.gallery,
  hours: t.nav.hours,
  contacts: t.nav.contacts,
};

export interface NavItem {
  id: string;
  anchor: string;
  label: string;
}

/** Anchor id for a section: the type for the first instance, `type-n` afterwards. */
export function sectionAnchorIds(sections: PageSection[]): Map<string, string> {
  const seen = new Map<SectionType, number>();
  const out = new Map<string, string>();
  for (const s of sections) {
    const n = seen.get(s.type) ?? 0;
    seen.set(s.type, n + 1);
    out.set(s.id, n === 0 ? s.type : `${s.type}-${n + 1}`);
  }
  return out;
}

export function buildNavItems(sections: PageSection[]): NavItem[] {
  const anchors = sectionAnchorIds(sections);
  const items: NavItem[] = [];
  const usedTypes = new Set<SectionType>();
  for (const s of sections) {
    const label = NAV_LABELS[s.type];
    if (!label || usedTypes.has(s.type)) continue;
    usedTypes.add(s.type);
    items.push({ id: s.id, anchor: anchors.get(s.id) ?? s.type, label });
  }
  return items;
}
