import type { MenuSectionSettings, Product, PublicCategory } from '@merenda/shared';
import { MediaImage } from '@/components/ui/MediaImage';
import { cn } from '@/lib/cn';
import { ProductCard } from './ProductCard';
import { ProductCompactRow } from './ProductCompactRow';
import { ProductRow } from './ProductRow';
import { categoryAnchor } from './visibility';

interface Props {
  category: PublicCategory;
  products: Product[];
  menuId: string;
  settings: MenuSectionSettings;
  fallbackIcon: string;
  columns: { mobile: number; tablet: number; desktop: number };
}

export function CategoryBlock({ category, products, menuId, settings, fallbackIcon, columns }: Props) {
  const compact = settings.cardStyle === 'compact';
  const sizes = `(min-width: 1024px) ${Math.round(100 / columns.desktop)}vw, (min-width: 768px) ${Math.round(100 / columns.tablet)}vw, ${Math.round(100 / columns.mobile)}vw`;

  return (
    <section id={categoryAnchor(category.id)} aria-labelledby={`${categoryAnchor(category.id)}-title`} className="mb-10 md:mb-14" style={{ scrollMarginTop: 'calc(var(--sticky-top) + var(--catnav-h) + 12px)' }}>
      <header className="mb-4 flex items-center gap-3 md:mb-5">
        {category.image ? (
          <MediaImage media={category.image} aspectClass="aspect-square" className="size-10 shrink-0 rounded-full" sizes="40px" rounded={false} />
        ) : (
          <span className="h-px w-6 shrink-0 bg-accent" aria-hidden />
        )}
        <div className="min-w-0">
          <h3 id={`${categoryAnchor(category.id)}-title`} className="text-[1.375rem] leading-tight md:text-[1.625rem]">
            {category.name}
          </h3>
          {category.description ? <p className="mt-0.5 text-[0.875rem] text-muted">{category.description}</p> : null}
        </div>
      </header>
      <div
        className={cn('product-grid', compact && 'gap-x-10 gap-y-1 md:gap-y-1')}
        style={{
          ['--cols-mobile' as string]: columns.mobile,
          ['--cols-tablet' as string]: columns.tablet,
          ['--cols-desktop' as string]: columns.desktop,
        }}
      >
        {products.map((product) => {
          const props = { product, menuId, settings, fallbackIcon, sizes };
          if (settings.cardStyle === 'list') return <ProductRow key={product.id} {...props} />;
          if (compact) return <ProductCompactRow key={product.id} {...props} />;
          return <ProductCard key={product.id} {...props} />;
        })}
      </div>
    </section>
  );
}
