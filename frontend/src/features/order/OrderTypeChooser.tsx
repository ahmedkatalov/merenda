import { Armchair, ShoppingBag } from 'lucide-react';
import type { OrderType } from '@merenda/shared';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface Props {
  allowed: OrderType[];
  value: OrderType | null;
  onChoose: (type: OrderType) => void;
}

const OPTIONS: Record<OrderType, { label: string; hint: string; icon: typeof Armchair }> = {
  dine_in: { label: t.checkout.dineIn, hint: t.checkout.dineInHint, icon: Armchair },
  takeaway: { label: t.checkout.takeaway, hint: t.checkout.takeawayHint, icon: ShoppingBag },
};

export function OrderTypeChooser({ allowed, value, onChoose }: Props) {
  return (
    <div className="flex flex-col gap-5 py-2">
      <div>
        <h3 className="text-[1.375rem]">{t.checkout.typeTitle}</h3>
        <p className="mt-1 text-muted">{t.checkout.typeHint}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {allowed.map((type) => {
          const opt = OPTIONS[type];
          const selected = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChoose(type)}
              aria-pressed={selected}
              className={cn(
                'flex min-h-36 flex-col items-start justify-between gap-3 rounded-card border-2 p-4 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5',
                selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface-solid hover:border-secondary',
              )}
            >
              <span className={cn('flex size-11 items-center justify-center rounded-full', selected ? 'bg-primary text-on-primary' : 'bg-surface-alt text-primary')}>
                <opt.icon className="size-5" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block font-heading text-[1.125rem] text-heading">{opt.label}</span>
                <span className="mt-0.5 block text-[0.8125rem] text-muted">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
