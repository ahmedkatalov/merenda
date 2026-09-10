import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { Product } from '@merenda/shared';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { useToastStore } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { mediaUrl } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useCartQuantity } from '@/features/cart/hooks/useCart';
import { useCartStore } from '@/features/cart/store';
import { useOrdering } from '@/features/order/ordering';

interface Props {
  product: Product;
  menuId: string;
  size?: 'sm' | 'md';
  /** Show a text label ("Добавить") instead of icon-only. */
  labelled?: boolean;
  /** Show a stepper when the product is already in the cart. */
  stepper?: boolean;
  className?: string;
}

export function cartImage(product: Product): string | null {
  const m = product.image ?? product.gif;
  return m ? mediaUrl(m.thumbUrl || m.url) : null;
}

/** Add-to-cart control with a check morph on success and cart-aware stepper. */
export function AddButton({ product, menuId, size = 'md', labelled, stepper = true, className }: Props) {
  const { forMenu } = useOrdering();
  const ordering = forMenu(menuId);
  const quantity = useCartQuantity(product.id);
  const add = useCartStore((s) => s.add);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const push = useToastStore((s) => s.push);
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  if (!ordering.enabled || product.availability !== 'available') return null;

  const stop = (e: MouseEvent): void => e.stopPropagation();

  const onAdd = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    if (!ordering.canOrder) {
      push(ordering.reason === 'venue_closed' ? `${t.cart.venueClosed}. ${ordering.message}` : ordering.message, 'warning');
      return;
    }
    add({ productId: product.id, name: product.name, priceMinor: product.priceMinor, imageUrl: cartImage(product) });
    setJustAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 800);
  };

  if (stepper && quantity > 0 && !justAdded) {
    return (
      <div onClick={stop} className={cn('inline-flex', className)}>
        <Stepper value={quantity} min={1} removable size={size === 'sm' ? 'sm' : 'md'} onChange={(n) => setQuantity(product.id, n)} />
      </div>
    );
  }

  const blocked = !ordering.canOrder;
  const title = blocked ? (ordering.reason === 'venue_closed' ? t.cart.venueClosed : ordering.message) : t.menu.add;

  return (
    <Button
      variant="primary"
      size={size}
      iconOnly={!labelled}
      onClick={onAdd}
      aria-label={title}
      title={title}
      aria-disabled={blocked || undefined}
      className={cn(blocked && 'opacity-55 saturate-50', 'relative overflow-hidden', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {justAdded ? (
          <motion.span
            key="check"
            className="inline-flex items-center gap-2"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Check className="size-5" strokeWidth={2.5} />
            {labelled ? t.menu.added : null}
          </motion.span>
        ) : (
          <motion.span
            key="plus"
            className="inline-flex items-center gap-2"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Plus className="size-5" strokeWidth={2.25} />
            {labelled ? t.menu.add : null}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
