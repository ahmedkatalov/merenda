import type { MenuSectionSettings, Product, PublicCategory, PublicMenu } from '@merenda/shared';

export interface VisibleCategory {
  category: PublicCategory;
  products: Product[];
}

export interface VisibleMenu {
  menu: PublicMenu;
  categories: VisibleCategory[];
}

export function isOrderable(p: Product): boolean {
  return p.availability === 'available';
}

/** Applies `showUnavailable` and drops empty categories / menus. */
export function visibleMenus(menus: PublicMenu[], settings: Pick<MenuSectionSettings, 'showUnavailable'>): VisibleMenu[] {
  const out: VisibleMenu[] = [];
  for (const menu of menus) {
    if (!menu.isActive) continue;
    const categories: VisibleCategory[] = [];
    for (const category of menu.categories) {
      if (!category.isActive) continue;
      const products = category.products.filter((p) => p.availability !== 'hidden' && (settings.showUnavailable || isOrderable(p)));
      if (products.length) categories.push({ category, products });
    }
    if (categories.length) out.push({ menu, categories });
  }
  return out;
}

export function categoryAnchor(categoryId: string): string {
  return `cat-${categoryId}`;
}

/** Column counts per card style: list/compact rows are capped at two columns. */
export function gridColumns(settings: MenuSectionSettings): { mobile: number; tablet: number; desktop: number } {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n) || min));
  if (settings.cardStyle === 'cards') {
    return { mobile: clamp(settings.columnsMobile, 1, 2), tablet: clamp(settings.columnsTablet, 1, 3), desktop: clamp(settings.columnsDesktop, 2, 4) };
  }
  return { mobile: 1, tablet: clamp(settings.columnsTablet, 1, 2), desktop: clamp(settings.columnsDesktop, 1, 2) };
}
