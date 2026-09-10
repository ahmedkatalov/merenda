import { formatMoney, type Currency } from '@merenda/shared';
import { cn } from '@/lib/cn';

interface Props {
  priceMinor: number;
  oldPriceMinor?: number | null;
  currency: Currency;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = { sm: 'text-[0.9375rem]', md: 'text-[1.0625rem]', lg: 'text-[1.375rem]' };

export function Price({ priceMinor, oldPriceMinor, currency, size = 'md', className }: Props) {
  const hasOld = typeof oldPriceMinor === 'number' && oldPriceMinor > priceMinor;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-0 whitespace-nowrap', className)}>
      <span className={cn('font-semibold tabular-nums text-heading', SIZE[size])}>{formatMoney(priceMinor, currency)}</span>
      {hasOld ? (
        <span className="text-[0.8125rem] tabular-nums text-muted line-through decoration-danger/60">{formatMoney(oldPriceMinor, currency)}</span>
      ) : null}
    </span>
  );
}
