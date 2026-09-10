import { ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { formatMoney } from '@merenda/shared';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { t } from '@/lib/i18n';
import { scrollToId } from '@/lib/scroll';
import { useSiteData } from '@/features/site/SiteContext';
import type { Checkout } from '@/features/order/hooks/useCheckout';
import { useCartStore } from './store';
import { useCartUi } from './uiStore';

export function CartItems({ checkout }: { checkout: Checkout }) {
  const { currency } = useSiteData();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const closeCart = useCartUi((s) => s.closeCart);
  const { items, total, minOrder, belowMin, venue, isPreview } = checkout;

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-surface-alt text-accent">
          <ShoppingBag className="size-7" strokeWidth={1.5} />
        </span>
        <p className="font-heading text-[1.25rem] text-heading">{t.cart.empty}</p>
        <p className="text-muted">{t.cart.emptyHint}</p>
        <Button variant="secondary" className="mt-2" onClick={() => { closeCart(); window.setTimeout(() => scrollToId('menu'), 250); }}>
          {t.cart.goToMenu}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-3 py-3.5">
            <div className="size-14 shrink-0 overflow-hidden rounded-image bg-surface-alt">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <span className="flex size-full items-center justify-center text-accent"><UtensilsCrossed className="size-5" strokeWidth={1.5} /></span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 font-medium text-heading">{item.name}</p>
                <p className="shrink-0 font-semibold tabular-nums text-heading">{formatMoney(item.priceMinor * item.quantity, currency)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.8125rem] text-muted">{formatMoney(item.priceMinor, currency)} × {item.quantity}</span>
                <Stepper size="sm" value={item.quantity} min={1} removable onChange={(n) => setQuantity(item.productId, n)} />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 rounded-card bg-surface-alt/70 px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">{t.cart.subtotal}</span>
          <span className="text-[1.25rem] font-semibold tabular-nums text-heading">{formatMoney(total, currency)}</span>
        </div>
        {minOrder > 0 ? (
          <p className={belowMin ? 'text-[0.875rem] text-warning' : 'text-[0.8125rem] text-muted'}>
            {belowMin ? `${t.cart.minOrderLeft} ${formatMoney(minOrder - total, currency)}` : `${t.cart.minOrder}: ${formatMoney(minOrder, currency)}`}
          </p>
        ) : null}
      </div>
      {!venue.canOrder ? (
        <p className="rounded-input bg-warning-soft px-4 py-3 text-[0.9375rem] text-heading">
          <span className="font-semibold">{venue.reason === 'venue_closed' ? t.cart.venueClosed : t.cart.ordersDisabled}.</span> {venue.message}
        </p>
      ) : null}
      {isPreview ? <p className="text-[0.8125rem] text-muted">{t.cart.previewNote}</p> : null}
    </div>
  );
}
