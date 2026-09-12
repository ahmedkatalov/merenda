import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { formatMoney } from '@merenda/shared';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { useCartCount, useCartTotal } from './hooks/useCart';
import { useCartStore } from './store';
import { useCartUi } from './uiStore';

/** Floating bottom-center cart pill (mobile only, hidden when empty). */
export function CartPill() {
  const count = useCartCount();
  const total = useCartTotal();
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const openCart = useCartUi((s) => s.openCart);
  const { currency } = useSiteData();
  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          className="fixed inset-x-0 z-40 flex justify-center px-4 md:hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        >
          <motion.button
            key={lastAddedAt}
            type="button"
            onClick={openCart}
            animate={{ scale: [1.03, 1] }}
            transition={{ duration: 0.25 }}
            className="btn btn-primary h-13 w-full max-w-md justify-between gap-3 px-4 shadow-elevated"
            style={{ height: '3.25rem' }}
            aria-label={`${t.cart.open}. ${t.a11y.cartCount(count)}`}
          >
            <span className="flex items-center gap-2.5">
              <span className="relative flex size-8 items-center justify-center rounded-full bg-white/15">
                <ShoppingBag className="size-4" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-bold text-on-accent">
                  {count}
                </span>
              </span>
              <span className="text-[0.9375rem] font-semibold">{t.cart.title}</span>
            </span>
            <span className="text-[0.9375rem] font-semibold tabular-nums">{formatMoney(total, currency)}</span>
          </motion.button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
