import { Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatMoney } from '@merenda/shared';
import { Button } from '@/components/ui/Button';
import { MediaImage } from '@/components/ui/MediaImage';
import { Price } from '@/components/ui/Price';
import { Sheet } from '@/components/ui/Sheet';
import { Stepper } from '@/components/ui/Stepper';
import { useToastStore } from '@/components/ui/Toast';
import { t } from '@/lib/i18n';
import { useCartQuantity } from '@/features/cart/hooks/useCart';
import { useCartStore } from '@/features/cart/store';
import { useOrdering } from '@/features/order/ordering';
import { useSiteData } from '@/features/site/SiteContext';
import { cartImage } from './AddButton';
import { ProductBadges, ProductTags } from './ProductBadges';
import { useProductSheet } from './productSheetStore';

/** Product details: large image, description, attributes, quantity + add. Lazy-loaded. */
export default function ProductSheet() {
  const product = useProductSheet((s) => s.product);
  const menuId = useProductSheet((s) => s.menuId);
  const close = useProductSheet((s) => s.close);
  const { currency, menu } = useSiteData();
  const { forMenu } = useOrdering();
  const add = useCartStore((s) => s.add);
  const push = useToastStore((s) => s.push);
  const inCart = useCartQuantity(product?.id ?? '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [product?.id]);

  const ordering = forMenu(menuId);
  const fallbackIcon = menu?.menus.find((m) => m.id === menuId)?.icon || 'utensils';
  const unavailable = !product || product.availability !== 'available';
  const showAdd = ordering.enabled && !unavailable;

  const onAdd = (): void => {
    if (!product) return;
    if (!ordering.canOrder) {
      push(ordering.reason === 'venue_closed' ? `${t.cart.venueClosed}. ${ordering.message}` : ordering.message, 'warning');
      return;
    }
    add({ productId: product.id, name: product.name, priceMinor: product.priceMinor, imageUrl: cartImage(product) }, qty);
    setAdded(true);
    window.setTimeout(close, 450);
  };

  return (
    <Sheet
      open={product !== null}
      onClose={close}
      mode="auto"
      size="lg"
      hideHeader
      ariaLabel={product?.name}
      bodyClassName="px-0 pb-0 md:px-0"
      footer={
        showAdd ? (
          <div className="flex items-center gap-3">
            <Stepper value={qty} min={1} onChange={setQty} />
            <Button size="lg" full onClick={onAdd} aria-disabled={!ordering.canOrder || undefined} className="min-w-0 flex-1">
              {added ? <Check className="size-5" /> : <Plus className="size-5" />}
              <span className="truncate">
                {added ? t.menu.added : t.menu.add} · {product ? formatMoney(product.priceMinor * qty, currency) : ''}
              </span>
            </Button>
          </div>
        ) : undefined
      }
    >
      {product ? (
        <div className="flex flex-col">
          <div className="relative">
            <MediaImage
              media={product.gif ?? product.image}
              aspectClass="aspect-[4/3]"
              prefer="medium"
              sizes="(min-width: 768px) 640px, 100vw"
              fallbackIcon={fallbackIcon}
              rounded={false}
              eager
              className="md:rounded-t-card"
            />
            <button
              type="button"
              onClick={close}
              aria-label={t.common.close}
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-surface-solid/90 text-heading shadow-card backdrop-blur"
            >
              <span aria-hidden className="text-xl leading-none">×</span>
            </button>
            <ProductBadges product={product} withAvailability size="sm" className="absolute left-4 top-4" />
          </div>
          <div className="flex flex-col gap-4 px-5 py-5 md:px-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[1.5rem] leading-tight md:text-[1.75rem]">{product.name}</h2>
              <Price priceMinor={product.priceMinor} oldPriceMinor={product.oldPriceMinor} currency={currency} size="lg" className="shrink-0" />
            </div>
            {product.description ? <p className="whitespace-pre-line text-muted">{product.description}</p> : null}
            {product.tags.length ? <ProductTags tags={product.tags} /> : null}
            {product.attributes.length ? (
              <dl className="mt-1 flex flex-col gap-2 rounded-input bg-surface-alt/60 px-4 py-3 text-[0.9375rem]">
                {product.attributes.map((a, i) => (
                  <div key={`${a.label}-${i}`} className="flex items-baseline">
                    <dt className="text-muted">{a.label}</dt>
                    <span className="dot-leader" aria-hidden />
                    <dd className="font-medium text-heading">{a.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {unavailable ? <p className="text-[0.9375rem] font-medium text-muted">{t.menu.unavailable}</p> : null}
            {inCart > 0 ? (
              <p className="text-[0.875rem] text-success">
                {t.menu.inCart}: {inCart}
              </p>
            ) : null}
            {ordering.enabled && !ordering.canOrder ? <p className="text-[0.875rem] text-warning">{ordering.message}</p> : null}
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
