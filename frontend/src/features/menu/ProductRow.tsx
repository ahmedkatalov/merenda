import { MediaImage } from '@/components/ui/MediaImage';
import { Price } from '@/components/ui/Price';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { AddButton } from './AddButton';
import { ProductBadges, ProductTags } from './ProductBadges';
import { useOpenProduct, type ProductCardProps } from './ProductCard';

/** "list" style: 96px image left, text, price + add on the right. */
export function ProductRow({ product, menuId, settings, fallbackIcon, className }: ProductCardProps) {
  const { currency } = useSiteData();
  const { onOpen, onKey } = useOpenProduct(product, menuId);
  const unavailable = product.availability !== 'available';
  const media = product.gif ?? product.image;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      aria-label={`${product.name}. ${t.menu.openProduct}`}
      className={cn(
        'card-surface group flex gap-3.5 p-3 text-left outline-none transition-[transform,box-shadow] duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-accent sm:gap-4 sm:p-3.5',
        unavailable && 'opacity-70',
        className,
      )}
    >
      {settings.showImages ? (
        <MediaImage
          media={media}
          aspectClass="aspect-square"
          fallbackIcon={fallbackIcon}
          sizes="96px"
          className="w-24 shrink-0"
          imgClassName={cn(unavailable && 'grayscale')}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <ProductBadges product={product} withAvailability />
        <h3 className="text-[1rem] leading-snug md:text-[1.0625rem]">{product.name}</h3>
        {settings.showDescriptions && product.description ? (
          <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-muted">{product.description}</p>
        ) : null}
        {settings.showTags ? <ProductTags tags={product.tags} /> : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <Price priceMinor={product.priceMinor} oldPriceMinor={product.oldPriceMinor} currency={currency} size="sm" />
          {unavailable ? (
            <span className="text-[0.75rem] font-medium text-muted">{t.menu.unavailable}</span>
          ) : (
            <AddButton product={product} menuId={menuId} size="sm" />
          )}
        </div>
      </div>
    </article>
  );
}
