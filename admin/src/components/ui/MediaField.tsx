import { useEffect, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { Media } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { useMediaCache, useMediaById } from '@/features/media/cache';
import { Button } from './Button';
import { MediaPicker } from './MediaPicker';
import { Badge } from './Badge';

export interface MediaFieldProps {
  /** Media id (what the API stores). */
  value: string | null | undefined;
  /** Known Media object, when the parent has it (e.g. product.image). */
  media?: Media | null;
  onChange: (media: Media | null) => void;
  accept?: 'image' | 'gif' | 'any';
  label?: string;
  help?: string;
  /** Aspect of the preview box. */
  aspect?: 'square' | 'video' | 'wide';
  className?: string;
  size?: 'sm' | 'md';
}

export function MediaField({ value, media, onChange, accept = 'image', label, help, aspect = 'video', className, size = 'md' }: MediaFieldProps) {
  const [open, setOpen] = useState(false);
  const cached = useMediaById(value);
  const warm = useMediaCache((s) => s.warm);
  const warmed = useMediaCache((s) => s.warmed);
  const resolved = media && media.id === value ? media : cached;

  useEffect(() => {
    if (value && !resolved && !warmed) void warm();
  }, [value, resolved, warmed, warm]);

  const aspectCls = aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[3/1]' : 'aspect-[4/3]';
  const previewBox = cn('relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50', aspectCls, size === 'sm' ? 'w-28' : 'w-full');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <div className="text-[13px] font-medium text-zinc-700">{label}</div>}
      {value ? (
        <div className={cn('flex gap-3', size === 'sm' ? 'items-center' : 'flex-col')}>
          <div className={previewBox}>
            {resolved ? (
              <img src={mediaUrl(resolved.thumbUrl)} alt={resolved.alt || resolved.originalName} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[12px] text-zinc-400">Изображение выбрано</div>
            )}
            {resolved?.kind === 'gif' && (
              <Badge tone="dark" size="sm" className="absolute left-2 top-2">
                GIF
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Заменить
            </Button>
            <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={() => onChange(null)} className="text-zinc-500 hover:text-red-600">
              Убрать
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 focus-ring',
            size === 'sm' ? 'h-16 w-full' : cn(aspectCls, 'w-full max-h-40'),
          )}
        >
          <ImagePlus className="size-4" />
          Выбрать {accept === 'gif' ? 'GIF' : 'изображение'}
        </button>
      )}
      {help && <p className="text-[13px] text-zinc-500">{help}</p>}
      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={onChange} accept={accept} />
    </div>
  );
}
