import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { useCartCount } from './hooks/useCart';
import { useCartStore } from './store';
import { useCartUi } from './uiStore';

/** Header cart button with a count badge that bumps on add. */
export function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const openCart = useCartUi((s) => s.openCart);
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`${t.cart.open}. ${t.a11y.cartCount(count)}`}
      className={cn(
        'relative flex size-11 items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-alt active:bg-border',
        className,
      )}
    >
      <ShoppingBag className="size-[1.375rem]" strokeWidth={1.75} />
      <AnimatePresence>
        {count > 0 ? (
          <motion.span
            key={lastAddedAt}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [1.25, 1], opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold leading-none text-on-primary shadow-card"
          >
            {count}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  );
}
