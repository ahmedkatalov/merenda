import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { cn, formatBytes, pluralize } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui';
import type { UploadItem } from './useUploadQueue';

const FILE_FORMS: [string, string, string] = ['файл', 'файла', 'файлов'];

export interface UploadQueueProps {
  items: UploadItem[];
  onDismiss: (id: string) => void;
  onClearFinished: () => void;
}

/** Panel with one row per file being uploaded. Renders nothing when the queue is empty. */
export function UploadQueue({ items, onDismiss, onClearFinished }: UploadQueueProps) {
  if (items.length === 0) return null;
  const active = items.filter((i) => i.status === 'queued' || i.status === 'uploading').length;
  const errors = items.filter((i) => i.status === 'error').length;
  const title = active > 0 ? `Загружается ${pluralize(active, FILE_FORMS)}…` : errors > 0 ? `Не удалось загрузить ${pluralize(errors, FILE_FORMS)}` : 'Загрузка завершена';

  return (
    <section aria-label="Очередь загрузки" aria-live="polite" className="animate-fade-in overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-soft">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-zinc-100 px-4">
        <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-zinc-700">
          {active > 0 && <Spinner size={14} className="shrink-0 text-zinc-400" />}
          <span className="truncate">{title}</span>
        </div>
        {active === 0 && errors > 0 && (
          <Button size="sm" variant="ghost" onClick={onClearFinished}>
            Очистить
          </Button>
        )}
      </div>
      <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <UploadRow key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
        ))}
      </ul>
    </section>
  );
}

function UploadRow({ item, onDismiss }: { item: UploadItem; onDismiss: () => void }) {
  const pct = Math.round(item.progress * 100);
  const done = item.status === 'done';
  const failed = item.status === 'error';

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        <img src={item.previewUrl} alt="" className="size-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[13px] font-medium text-zinc-900">{item.file.name}</span>
          <span className="shrink-0 text-[12px] tabular-nums text-zinc-400">{formatBytes(item.file.size)}</span>
        </div>
        {failed ? (
          <p className="mt-0.5 truncate text-[12.5px] text-red-600">{item.error}</p>
        ) : (
          <div
            role="progressbar"
            aria-label={`Загрузка ${item.file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={done ? 100 : pct}
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-zinc-100"
          >
            <div className={cn('h-full rounded transition-[width] duration-200 ease-out', done ? 'bg-emerald-500' : 'bg-zinc-900')} style={{ width: `${done ? 100 : pct}%` }} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {item.status === 'queued' && (
          <span className="inline-flex items-center gap-1 text-[12px] text-zinc-400">
            <Clock className="size-3.5" aria-hidden="true" />
            В очереди
          </span>
        )}
        {item.status === 'uploading' && <span className="w-9 text-right text-[12px] tabular-nums text-zinc-500">{pct}%</span>}
        {done && (
          <>
            <CircleCheck className="size-[18px] text-emerald-500" aria-hidden="true" />
            <span className="sr-only">Загружено</span>
          </>
        )}
        {failed && (
          <>
            <CircleAlert className="size-[18px] text-red-500" aria-hidden="true" />
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Убрать
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
