import type { Product } from '@merenda/shared';
import { Badge } from '@/components/ui';

export function ProductBadges({ product, size = 'sm' }: { product: Pick<Product, 'isPopular' | 'isNew' | 'isRecommended'>; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {product.isPopular && (
        <Badge tone="warning" size={size}>
          Хит
        </Badge>
      )}
      {product.isNew && (
        <Badge tone="info" size={size}>
          Новинка
        </Badge>
      )}
      {product.isRecommended && (
        <Badge tone="accent" size={size}>
          Рекомендуем
        </Badge>
      )}
    </span>
  );
}
