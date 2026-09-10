import { useMemo } from 'react';
import type { Product, PublicMenu } from '@merenda/shared';
import { useSiteData } from '@/features/site/SiteContext';

export interface MenuIndex {
  ready: boolean;
  menus: PublicMenu[];
  productsById: ReadonlyMap<string, Product>;
  menuIdByProduct: ReadonlyMap<string, string>;
  allProducts: Product[];
}

/** Flattened lookups over the public menu payload. */
export function useMenuIndex(): MenuIndex {
  const { menu } = useSiteData();
  return useMemo(() => {
    const productsById = new Map<string, Product>();
    const menuIdByProduct = new Map<string, string>();
    const allProducts: Product[] = [];
    const menus = menu?.menus ?? [];
    for (const m of menus) {
      for (const c of m.categories) {
        for (const p of c.products) {
          productsById.set(p.id, p);
          menuIdByProduct.set(p.id, m.id);
          allProducts.push(p);
        }
      }
    }
    return { ready: menu !== undefined, menus, productsById, menuIdByProduct, allProducts };
  }, [menu]);
}
