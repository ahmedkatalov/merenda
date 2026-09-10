import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImageOff, Search, SearchX, Upload } from 'lucide-react';
import type { Media, MediaKind } from '@merenda/shared';
import { cn, pluralize } from '@/lib/utils';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '@/lib/i18n';
import { Button, EmptyState, ErrorState, Input, PageHeader, SegmentedControl, Skeleton, Spinner } from '@/components/ui';
import { useMediaList } from '../hooks';
import { useUploadQueue } from '../components/useUploadQueue';
import { UploadQueue } from '../components/UploadQueue';
import { MediaTile } from '../components/MediaTile';
import { MediaDetailDrawer } from '../components/MediaDetailDrawer';

type KindFilter = '' | MediaKind;

const FILE_FORMS: [string, string, string] = ['файл', 'файла', 'файлов'];
const GRID = 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6';
const MAX_MB = Math.round(IMAGE_MAX_BYTES / (1024 * 1024));

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

export default function MediaPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState<KindFilter>('');
  const [selected, setSelected] = useState<Media | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const queue = useUploadQueue();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const query = useMediaList({ kind, q: debounced });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total;
  const filtered = debounced !== '' || kind !== '';
  const searching = q.trim() !== debounced || (query.isFetching && !query.isPending && !query.isFetchingNextPage);
  // Prefer the fresh copy from the list (alt edits are refetched) but keep the drawer alive if it drops out of the current filter.
  const current = selected ? (items.find((m) => m.id === selected.id) ?? selected) : null;

  const openPicker = () => fileRef.current?.click();
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    queue.enqueue(e.target.files);
    e.target.value = '';
  };
  const resetSearch = () => {
    setQ('');
    setDebounced('');
    setKind('');
  };

  /* Drag-and-drop over the whole grid area. A depth counter avoids flicker from nested children. */
  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    queue.enqueue(e.dataTransfer.files);
  };

  return (
    <>
      <PageHeader
        title="Медиа"
        description="Изображения и GIF для блюд, категорий и блоков сайта."
        actions={
          <Button variant="primary" icon={<Upload />} onClick={openPicker}>
            Загрузить
          </Button>
        }
      />
      <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={onPick} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          prefix={<Search />}
          suffix={searching ? <Spinner /> : undefined}
          placeholder="Поиск по названию…"
          aria-label="Поиск по названию"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {total !== undefined && <span className="text-[13px] tabular-nums text-zinc-500">{pluralize(total, FILE_FORMS)}</span>}
          <SegmentedControl<KindFilter>
            aria-label="Тип файла"
            value={kind}
            onChange={setKind}
            options={[
              { value: '', label: 'Все' },
              { value: 'image', label: 'Фото' },
              { value: 'gif', label: 'GIF' },
            ]}
          />
        </div>
      </div>

      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn('relative min-h-[240px] rounded-2xl transition-shadow', dragOver && 'ring-2 ring-zinc-900 ring-offset-2 ring-offset-zinc-50')}
      >
        <div className="space-y-4">
          <UploadQueue items={queue.items} onDismiss={queue.dismiss} onClearFinished={queue.clearFinished} />

          {query.isPending ? (
            <div className={GRID} aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : items.length === 0 ? (
            filtered ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white">
                <EmptyState
                  icon={<SearchX />}
                  title="Ничего не найдено"
                  description="Попробуйте изменить запрос или снять фильтр по типу."
                  action={
                    <Button variant="secondary" onClick={resetSearch}>
                      Сбросить поиск
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="rounded-[var(--radius-card)] border-2 border-dashed border-zinc-200 bg-white transition-colors hover:border-zinc-300">
                <EmptyState
                  icon={<ImageOff />}
                  title="Пока пусто"
                  description="Загрузите первые изображения — перетащите файлы сюда или нажмите «Загрузить»."
                  action={
                    <Button variant="primary" icon={<Upload />} onClick={openPicker}>
                      Загрузить
                    </Button>
                  }
                />
              </div>
            )
          ) : (
            <>
              <div className={GRID}>
                {items.map((m) => (
                  <MediaTile key={m.id} media={m} selected={current?.id === m.id} onClick={() => setSelected(m)} />
                ))}
              </div>
              {query.hasNextPage && (
                <div className="flex flex-col items-center gap-2 pt-1">
                  <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                    Показать ещё
                  </Button>
                  {total !== undefined && (
                    <span className="text-[12.5px] tabular-nums text-zinc-400">
                      Показано {items.length} из {total}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {dragOver && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex animate-fade-in items-center justify-center rounded-2xl border-2 border-dashed border-zinc-900 bg-white/85 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <Upload className="size-5" />
              </div>
              <p className="text-[15px] font-semibold text-zinc-900">Отпустите файлы, чтобы загрузить</p>
              <p className="text-[13px] text-zinc-500">JPEG, PNG, WebP или GIF до {MAX_MB} МБ</p>
            </div>
          </div>
        )}
      </div>

      <MediaDetailDrawer open={current !== null} media={current} onClose={() => setSelected(null)} />
    </>
  );
}
