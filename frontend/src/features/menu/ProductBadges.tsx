import type { Product } from '@merenda/shared';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface Props {
  product: Product;
  size?: 'xs' | 'sm';
  className?: string;
  /** Include the "unavailable" badge. */
  withAvailability?: boolean;
}

export function ProductBadges({ product, size = 'xs', className, withAvailability }: Props) {
  const unavailable = product.availability !== 'available';
  const items: { key: string; label: string; tone: 'accent' | 'primary' | 'success' | 'muted' }[] = [];
  if (withAvailability && unavailable) items.push({ key: 'na', label: t.menu.unavailable, tone: 'muted' });
  if (product.isPopular) items.push({ key: 'hit', label: t.menu.hit, tone: 'accent' });
  if (product.isNew) items.push({ key: 'new', label: t.menu.new, tone: 'success' });
  if (product.isRecommended) items.push({ key: 'rec', label: t.menu.recommended, tone: 'primary' });
  if (!items.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {items.map((b) => (
        <Badge key={b.key} tone={b.tone} size={size}>
          {b.label}
        </Badge>
      ))}
    </div>
  );
}

export function ProductTags({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.slice(0, 4).map((tag) => (
        <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[0.6875rem] font-medium text-muted">
          {tag}
        </span>
      ))}
    </div>
  );
}
