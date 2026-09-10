import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

/**
 * Sticky bottom action bar. Negative margins cancel the page padding from AppShell's <main>
 * (px-4 sm:px-6 lg:px-8, pb-[max(1.5rem,safe-area)]) so the bar spans the full content width.
 */
export function SaveBar({ dirty, saving, onReset }: { dirty: boolean; saving: boolean; onReset: () => void }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 -mb-[max(1.5rem,env(safe-area-inset-bottom))] mt-6 border-t border-zinc-200 bg-white/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[13px]" aria-live="polite">
          <span className={cn('size-2 shrink-0 rounded-full', dirty ? 'bg-amber-500' : 'bg-zinc-300')} aria-hidden="true" />
          <span className={cn('truncate', dirty ? 'font-medium text-zinc-800' : 'text-zinc-500')}>{dirty ? 'Есть несохранённые изменения' : 'Изменений нет'}</span>
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
