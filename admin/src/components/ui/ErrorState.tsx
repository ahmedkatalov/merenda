import { CircleAlert, RefreshCw } from 'lucide-react';
import { errorMessage } from '@/lib/api';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export function ErrorState({ error, onRetry, className, title = 'Не удалось загрузить данные' }: { error: unknown; onRetry?: () => void; className?: string; title?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-red-200 bg-red-50/40 px-6 py-12 text-center', className)} role="alert">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-red-100 text-red-600">
        <CircleAlert className="size-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-600">{errorMessage(error)}</p>
      {onRetry && (
        <Button className="mt-4" variant="secondary" icon={<RefreshCw />} onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
