import { formatMoney } from '@merenda/shared';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { AddButton } from './AddButton';
import { useOpenProduct, type ProductCardProps } from './ProductCard';

/** "compact" style: printed-menu dot-leader row (name … price + add). */
export function ProductCompactRow({ product, menuId, settings, className }: ProductCardProps) {
  const { currency } = useSiteData();
  const { onOpen, onKey } = useOpenProduct(product, menuId);
  const unavailable = product.availability !== 'available';
  const hasOld = typeof product.oldPriceMinor === 'number' && product.oldPriceMinor > product.priceMinor;
  const marks: string[] = [];
  if (product.isPopular) marks.push(t.menu.hit);
  if (product.isNew) marks.push(t.menu.new);
  if (product.isRecommended) marks.push(t.menu.recommended);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      aria-label={`${product.name}. ${t.menu.openProduct}`}
      className={cn(
        'group -mx-2 flex items-start gap-2 rounded-input px-2 py-2.5 text-left outline-none transition-colors hover:bg-surface-alt/60 focus-visible:ring-2 focus-visible:ring-accent',
        unavailable && 'opacity-60',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline">
          <span className="min-w-0 font-heading text-[1rem] leading-snug text-heading md:text-[1.0625rem]">
            {product.name}
            {settings.showTags && marks.length ? (
              <span className="ml-2 align-middle text-[0.6875rem] font-body font-semibold uppercase tracking-wider text-accent">{marks.join(' · ')}</span>
            ) : null}
          </span>
          <span className="dot-leader" aria-hidden />
          <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
            {hasOld ? <span className="text-[0.75rem] text-muted line-through">{formatMoney(product.oldPriceMinor ?? 0, currency)}</span> : null}
            <span className="font-semibold tabular-nums text-heading">{formatMoney(product.priceMinor, currency)}</span>
          </span>
        </div>
        {settings.showDescriptions && product.description ? (
          <p className="line-clamp-2 pr-4 text-[0.8125rem] leading-relaxed text-muted">{product.description}</p>
        ) : null}
        {unavailable ? <span className="text-[0.75rem] font-medium text-muted">{t.menu.unavailable}</span> : null}
      </div>
      {!unavailable ? <AddButton product={product} menuId={menuId} size="sm" className="mt-0.5 shrink-0" /> : null}
    </div>
  );
}
