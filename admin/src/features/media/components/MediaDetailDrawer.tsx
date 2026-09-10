import { useEffect, useState, type CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, Copy, ExternalLink, Trash2 } from 'lucide-react';
import type { Media } from '@merenda/shared';
import { applyServerErrors } from '@/lib/forms';
import { MEDIA_KIND_LABELS } from '@/lib/i18n';
import { mediaUrl } from '@/lib/media';
import { copyToClipboard, formatBytes, formatDate, formatTime } from '@/lib/utils';
import { Button, ConfirmDialog, Drawer, FormField, IconButton, Input, Textarea } from '@/components/ui';
import { useDeleteMedia, useUpdateMediaAlt } from '../hooks';

/** Absolute URL for sharing: when the API is same-origin, `mediaUrl` is root-relative and needs our origin. */
export function absoluteMediaUrl(path: string): string {
  const url = mediaUrl(path);
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Checkerboard so transparent PNG/WebP edges are visible. */
const CHECKER: CSSProperties = {
  backgroundColor: '#f4f4f5',
  backgroundImage: 'linear-gradient(45deg, #e4e4e7 25%, transparent 25%, transparent 75%, #e4e4e7 75%), linear-gradient(45deg, #e4e4e7 25%, transparent 25%, transparent 75%, #e4e4e7 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px',
};

export interface MediaDetailDrawerProps {
  open: boolean;
  media: Media | null;
  onClose: () => void;
}

export function MediaDetailDrawer({ open, media, onClose }: MediaDetailDrawerProps) {
  // Keep the last media so the panel stays populated during the close animation.
  const [shown, setShown] = useState<Media | null>(media);
  if (media && media !== shown) setShown(media);

  const remove = useDeleteMedia();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const description = shown ? `${MEDIA_KIND_LABELS[shown.kind]} · ${shown.width}×${shown.height} · ${formatBytes(shown.size)} · ${formatDate(shown.createdAt)}` : undefined;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width="md"
        title={shown?.originalName}
        description={description}
        locked={remove.isPending}
        footer={
          <>
            <Button variant="ghost" icon={<Trash2 />} className="text-red-600 hover:bg-red-50 hover:text-red-700 md:mr-auto" disabled={remove.isPending} onClick={() => setConfirmDelete(true)}>
              Удалить
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={remove.isPending}>
              Закрыть
            </Button>
          </>
        }
      >
        {shown && <DetailBody key={shown.id} media={shown} />}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        tone="danger"
        title="Удалить изображение?"
        description="Изображение исчезнет из блюд и блоков, где используется. Это действие нельзя отменить."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (!shown) return;
          remove.mutate(shown.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              onClose();
            },
          });
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function DetailBody({ media }: { media: Media }) {
  const url = absoluteMediaUrl(media.url);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast.success('Ссылка скопирована');
    } else {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex max-h-[360px] items-center justify-center overflow-hidden rounded-xl border border-zinc-200" style={CHECKER}>
        <img src={mediaUrl(media.mediumUrl)} alt={media.alt || media.originalName} className="max-h-[360px] max-w-full object-contain" />
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-5 gap-y-2 text-[13px]">
        <dt className="text-zinc-500">Формат</dt>
        <dd className="min-w-0 truncate font-medium text-zinc-900">{media.mime}</dd>
        <dt className="text-zinc-500">Размеры</dt>
        <dd className="font-medium tabular-nums text-zinc-900">
          {media.width}×{media.height} px
        </dd>
        <dt className="text-zinc-500">Вес</dt>
        <dd className="font-medium tabular-nums text-zinc-900">{formatBytes(media.size)}</dd>
        <dt className="text-zinc-500">Загружено</dt>
        <dd className="font-medium text-zinc-900">
          {formatDate(media.createdAt)}, {formatTime(media.createdAt)}
        </dd>
      </dl>

      <FormField label="Ссылка">
        {(id) => (
          <div className="flex gap-2">
            <Input id={id} readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 font-mono text-[12.5px]" />
            <IconButton label="Копировать" variant="secondary" onClick={() => void copy()} className={copied ? 'text-emerald-600' : undefined}>
              {copied ? <Check /> : <Copy />}
            </IconButton>
            <IconButton label="Открыть в новой вкладке" variant="secondary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
              <ExternalLink />
            </IconButton>
          </div>
        )}
      </FormField>

      <AltForm media={media} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const altSchema = z.object({
  alt: z.string().trim().max(300, 'Не больше 300 символов'),
});
type AltValues = z.infer<typeof altSchema>;

function AltForm({ media }: { media: Media }) {
  const update = useUpdateMediaAlt();
  const { register, handleSubmit, reset, setError, formState } = useForm<AltValues>({ resolver: zodResolver(altSchema), defaultValues: { alt: media.alt } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync({ id: media.id, alt: values.alt });
      reset({ alt: saved.alt });
    } catch (e) {
      // The mutation hook already shows a toast; only map field errors onto the form.
      applyServerErrors(e, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <FormField label="Alt-текст" help="Описание для поисковиков и людей с нарушением зрения." error={formState.errors.alt?.message}>
        {(id) => <Textarea id={id} rows={2} placeholder="Например: паста карбонара на белой тарелке" invalid={!!formState.errors.alt} {...register('alt')} />}
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={!formState.isDirty} loading={update.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
