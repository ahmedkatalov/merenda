import type { KeyboardEvent } from 'react';
import type { MenuSectionSettings, Product } from '@merenda/shared';
import { MediaImage } from '@/components/ui/MediaImage';
import { Price } from '@/components/ui/Price';
import { cn } from '@/lib/cn';
import { ASPECT_CLASS } from '@/lib/media';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { AddButton } from './AddButton';
import { ProductBadges, ProductTags } from './ProductBadges';
import { useProductSheet } from './productSheetStore';

export interface ProductCardProps {
  product: Product;
  menuId: string;
  settings: Pick<MenuSectionSettings, 'showImages' | 'showDescriptions' | 'showTags' | 'imageAspect'>;
  fallbackIcon: string;
  className?: string;
  sizes?: string;
}

export function useOpenProduct(product: Product, menuId: string) {
  const open = useProductSheet((s) => s.open);
  const onOpen = (): void => open(product, menuId);
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };
  return { onOpen, onKey };
}

/** "cards" style: image on top, name, description, tags, price row with add button. */
export function ProductCard({ product, menuId, settings, fallbackIcon, className, sizes }: ProductCardProps) {
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
        'card-surface group relative flex h-full flex-col overflow-hidden text-left outline-none transition-[transform,box-shadow] duration-300 ease-premium',
        'hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-accent',
        unavailable && 'opacity-70',
        className,
      )}
    >
      {settings.showImages ? (
        <div className="relative">
          <MediaImage
            media={media}
            aspectClass={ASPECT_CLASS[settings.imageAspect]}
            fallbackIcon={fallbackIcon}
            rounded={false}
            sizes={sizes}
            imgClassName={cn('transition-transform duration-500 ease-premium group-hover:scale-[1.03]', unavailable && 'grayscale')}
          />
          <ProductBadges product={product} withAvailability className="absolute left-3 top-3" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {!settings.showImages ? <ProductBadges product={product} withAvailability /> : null}
        <h3 className="text-[1.0625rem] leading-snug md:text-[1.125rem]">{product.name}</h3>
        {settings.showDescriptions && product.description ? (
          <p className="line-clamp-2 text-[0.875rem] leading-relaxed text-muted">{product.description}</p>
        ) : null}
        {settings.showTags ? <ProductTags tags={product.tags} /> : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <Price priceMinor={product.priceMinor} oldPriceMinor={product.oldPriceMinor} currency={currency} />
          {unavailable ? (
            <span className="text-[0.8125rem] font-medium text-muted">{t.menu.unavailable}</span>
          ) : (
            <AddButton product={product} menuId={menuId} size="md" />
          )}
        </div>
      </div>
    </article>
  );
}
