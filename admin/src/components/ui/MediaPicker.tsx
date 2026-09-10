import { useEffect, useRef, useState } from 'react';
import { ImageOff, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Media, MediaKind } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { errorMessage } from '@/lib/api';
import { IMAGE_ACCEPT } from '@/lib/i18n';
import { useMediaList, useInvalidateMedia } from '@/features/media/hooks';
import { mediaApi } from '@/features/media/api';
import { useMediaCache } from '@/features/media/cache';
import { validateImageFile } from '@/features/media/upload';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Input } from './Input';
import { SegmentedControl } from './SegmentedControl';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Badge } from './Badge';

export interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  accept?: 'image' | 'gif' | 'any';
  title?: string;
}

type KindFilter = '' | MediaKind;

export function MediaPicker({ open, onClose, onSelect, accept = 'any', title = 'Выбрать изображение' }: MediaPickerProps) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState<KindFilter>(accept === 'any' ? '' : accept);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidateMedia();
  const remember = useMediaCache((s) => s.remember);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (open) setKind(accept === 'any' ? '' : accept);
  }, [open, accept]);

  const query = useMediaList({ kind, q: debounced });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let last: Media | null = null;
    for (const file of Array.from(files)) {
      const err = validateImageFile(file);
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      try {
        last = await mediaApi.upload(file, undefined);
        remember(last);
      } catch (e) {
        toast.error(`${file.name}: ${errorMessage(e)}`);
      }
    }
    setUploading(false);
    await invalidate();
    if (last && files.length === 1) {
      onSelect(last);
      onClose();
    } else if (last) {
      toast.success('Загружено');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} size="xl" flush>
      <div className="flex flex-col gap-3 px-5 pb-3 sm:flex-row sm:items-center sm:px-6">
        <Input prefix={<Search />} type="search" placeholder="Поиск по названию…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        {accept === 'any' && (
          <SegmentedControl<KindFilter>
            value={kind}
            onChange={setKind}
            size="sm"
            options={[
              { value: '', label: 'Все' },
              { value: 'image', label: 'Фото' },
              { value: 'gif', label: 'GIF' },
            ]}
          />
        )}
        <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={(e) => void onFiles(e.target.files)} />
        <Button variant="primary" icon={<Upload />} loading={uploading} onClick={() => fileRef.current?.click()}>
          Загрузить
        </Button>
      </div>
      <div className="min-h-[320px] border-t border-zinc-100 px-5 py-4 sm:px-6">
        {query.isPending ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState compact icon={<ImageOff />} title="Пока пусто" description="Загрузите первое изображение — оно появится здесь." action={<Button variant="primary" icon={<Upload />} onClick={() => fileRef.current?.click()}>Загрузить</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelect(m);
                    onClose();
                  }}
                  title={m.originalName}
                  className={cn('group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 transition-all hover:border-zinc-400 focus-ring')}
                >
                  <img src={mediaUrl(m.thumbUrl)} alt={m.alt || m.originalName} loading="lazy" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
                  {m.kind === 'gif' && (
                    <Badge tone="dark" size="sm" className="absolute left-1.5 top-1.5">
                      GIF
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            {query.hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                  Показать ещё
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
