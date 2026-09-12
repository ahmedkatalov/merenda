import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  className?: string;
}

/**
 * Sticky footer for settings forms. Must be rendered inside a <form>: the primary button submits it.
 * Negative margins cancel the AppShell content padding so the bar spans the full width.
 */
export function SaveBar({ dirty, saving, onReset, className }: SaveBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-4 -mb-[max(1.5rem,env(safe-area-inset-bottom))] mt-6 border-t border-zinc-200 bg-white/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-[13px]" aria-live="polite">
          {dirty && (
            <span className="inline-flex items-center gap-2 text-zinc-700">
              <span className="size-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="truncate">Есть несохранённые изменения</span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={onReset} disabled={!dirty || saving}>
            Отменить
          </Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
