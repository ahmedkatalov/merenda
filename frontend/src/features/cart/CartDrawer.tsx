import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { formatMoney } from '@merenda/shared';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { t } from '@/lib/i18n';
import { CheckoutForm } from '@/features/order/CheckoutForm';
import { OrderSuccess } from '@/features/order/OrderSuccess';
import { OrderTypeChooser } from '@/features/order/OrderTypeChooser';
import { STEP_ORDER, useCheckout } from '@/features/order/hooks/useCheckout';
import { useSiteData } from '@/features/site/SiteContext';
import { CartItems } from './CartItems';
import { useCartCount } from './hooks/useCart';
import { useCartUi } from './uiStore';

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
};

/** Cart + multi-step checkout inside one drawer (bottom sheet on mobile, side drawer on tablet+). */
export default function CartDrawer() {
  const open = useCartUi((s) => s.open);
  const closeCart = useCartUi((s) => s.closeCart);
  const count = useCartCount();
  const { currency } = useSiteData();
  const checkout = useCheckout(open);
  const lastIndex = useRef(0);
  const index = STEP_ORDER.indexOf(checkout.step);
  const dir = index >= lastIndex.current ? 1 : -1;
  lastIndex.current = index;

  const title: Record<typeof checkout.step, string> = {
    cart: count > 0 ? `${t.cart.title} · ${count}` : t.cart.title,
    type: t.cart.checkout,
    details: t.cart.checkout,
    success: t.success.title,
  };

  let footer: ReactNode = null;
  if (checkout.step === 'cart' && checkout.items.length) {
    footer = (
      <Button size="lg" full onClick={checkout.start} disabled={!checkout.canCheckout}>
        {t.cart.checkout}
        <span className="opacity-80">· {formatMoney(checkout.total, currency)}</span>
        <ArrowRight className="size-4" />
      </Button>
    );
  } else if (checkout.step === 'type') {
    footer = (
      <Button variant="ghost" size="md" onClick={checkout.back}>
        <ArrowLeft className="size-4" />
        {t.common.back}
      </Button>
    );
  } else if (checkout.step === 'details') {
    footer = (
      <div className="flex gap-2">
        <Button variant="ghost" size="lg" iconOnly onClick={checkout.back} aria-label={t.common.back} disabled={checkout.submitting}>
          <ArrowLeft className="size-5" />
        </Button>
        <Button size="lg" full type="submit" form="checkout-form" loading={checkout.submitting} disabled={!checkout.items.length || !checkout.venue.canOrder}>
          {checkout.submitting ? t.checkout.submitting : t.checkout.submit}
        </Button>
      </div>
    );
  } else if (checkout.step === 'success') {
    footer = (
      <Button size="lg" full variant="secondary" onClick={closeCart}>
        {t.success.done}
      </Button>
    );
  }

  return (
    <Sheet open={open} onClose={closeCart} mode="drawer" title={title[checkout.step]} footer={footer} bodyClassName="overflow-x-hidden">
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={checkout.step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {checkout.step === 'cart' ? <CartItems checkout={checkout} /> : null}
          {checkout.step === 'type' ? <OrderTypeChooser allowed={checkout.allowedTypes} value={checkout.orderType} onChoose={checkout.chooseType} /> : null}
          {checkout.step === 'details' ? <CheckoutForm checkout={checkout} /> : null}
          {checkout.step === 'success' && checkout.result ? <OrderSuccess result={checkout.result} /> : null}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}
