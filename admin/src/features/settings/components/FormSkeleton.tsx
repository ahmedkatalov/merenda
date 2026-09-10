import { Skeleton } from '@/components/ui';

function CardSkeleton({ fields }: { fields: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-zinc-200 bg-white p-5 shadow-soft">
      <Skeleton className="h-4 w-36" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder shown while a settings key is loading. */
export function FormSkeleton({ cards = [3, 2, 1] }: { cards?: number[] }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Загрузка">
      {cards.map((fields, i) => (
        <CardSkeleton key={i} fields={fields} />
      ))}
    </div>
  );
}
