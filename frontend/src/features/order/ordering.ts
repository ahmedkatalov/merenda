import { useCallback, useMemo } from 'react';
import type { PublicMenu, SiteBootstrap, SiteStatus } from '@merenda/shared';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';

export type BlockReason = 'disabled' | 'venue_closed' | 'menu_closed' | null;

export interface OrderingState {
  /** Ordering feature is switched on at all. */
  enabled: boolean;
  /** Adding to cart / checkout is currently possible. */
  canOrder: boolean;
  reason: BlockReason;
  message: string;
}

export function venueOrdering(site: SiteBootstrap, status: SiteStatus): OrderingState {
  if (!site.orders.enabled) return { enabled: false, canOrder: false, reason: 'disabled', message: t.cart.ordersDisabled };
  if (site.orders.blockWhenClosed && !status.venue.isOpen) {
    const message = status.venue.mode === 'temporarily_closed' && status.venue.closedMessage ? status.venue.closedMessage : t.cart.venueClosedHint;
    return { enabled: true, canOrder: false, reason: 'venue_closed', message };
  }
  return { enabled: true, canOrder: true, reason: null, message: '' };
}

export function menuOrdering(site: SiteBootstrap, status: SiteStatus, menu: Pick<PublicMenu, 'scheduleId' | 'name'> | undefined): OrderingState {
  const base = venueOrdering(site, status);
  if (!base.canOrder || !menu?.scheduleId || !site.orders.blockWhenClosed) return base;
  const sched = status.schedules.find((s) => s.scheduleId === menu.scheduleId);
  if (sched && !sched.isOpen) {
    return { enabled: true, canOrder: false, reason: 'menu_closed', message: sched.message || `${menu.name}: ${t.cart.menuClosed}` };
  }
  return base;
}

export function useOrdering(): { venue: OrderingState; forMenu: (menuId: string | null | undefined) => OrderingState } {
  const { site, status, menu } = useSiteData();
  const venue = useMemo(() => venueOrdering(site, status), [site, status]);
  const forMenu = useCallback(
    (menuId: string | null | undefined) => menuOrdering(site, status, menu?.menus.find((m) => m.id === menuId)),
    [site, status, menu],
  );
  return { venue, forMenu };
}
