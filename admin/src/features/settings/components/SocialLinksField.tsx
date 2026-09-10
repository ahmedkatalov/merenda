import { Plus, Trash2 } from 'lucide-react';
import type { SocialLink, SocialType } from '@merenda/shared';
import { SOCIAL_TYPE_LABELS } from '@/lib/i18n';
import { cn, uid } from '@/lib/utils';
import { Button, IconButton, Input, Select, SortableList } from '@/components/ui';

export const MAX_SOCIAL_LINKS = 10;

const TYPE_OPTIONS = (Object.keys(SOCIAL_TYPE_LABELS) as SocialType[]).map((t) => ({ value: t, label: SOCIAL_TYPE_LABELS[t] }));

export interface SocialLinkRowErrors {
  label?: string;
  url?: string;
}

export interface SocialLinksFieldProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  /** Per-row errors, aligned by index with `value`. */
  errors?: (SocialLinkRowErrors | undefined)[];
  /** Array-level error (e.g. too many links). */
  error?: string;
  disabled?: boolean;
}

export function SocialLinksField({ value, onChange, errors, error, disabled }: SocialLinksFieldProps) {
  const full = value.length >= MAX_SOCIAL_LINKS;

  const update = (index: number, patch: Partial<SocialLink>) => onChange(value.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => {
    if (full) return;
    onChange([...value, { id: uid(), type: 'instagram', label: '', url: '' }]);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-6 text-center text-sm text-zinc-500">Ссылок пока нет.</p>
      ) : (
        <SortableList
          items={value}
          getId={(l) => l.id}
          onReorder={(items) => onChange(items)}
          disabled={disabled}
          className="gap-2"
          renderItem={(link, { handle, isDragging, index }) => {
            const rowErr = errors?.[index];
            const message = rowErr?.url ?? rowErr?.label;
            return (
              <div className={cn('rounded-xl border border-zinc-200 bg-white p-2 shadow-soft transition-shadow', isDragging && 'shadow-pop ring-1 ring-zinc-300')}>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <div className="mt-0.5">{handle}</div>
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1.4fr)]">
                    <Select aria-label="Тип" value={link.type} onChange={(e) => update(index, { type: e.target.value as SocialType })} options={TYPE_OPTIONS} disabled={disabled} />
                    <Input
                      aria-label="Название"
                      value={link.label}
                      onChange={(e) => update(index, { label: e.target.value })}
                      placeholder={SOCIAL_TYPE_LABELS[link.type]}
                      maxLength={40}
                      invalid={!!rowErr?.label}
                      disabled={disabled}
                    />
                    <Input
                      aria-label="Ссылка"
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      value={link.url}
                      onChange={(e) => update(index, { url: e.target.value })}
                      placeholder="https://…"
                      invalid={!!rowErr?.url}
                      disabled={disabled}
                    />
                  </div>
                  <IconButton label="Удалить" className="text-zinc-400 hover:text-red-600 md:mt-0.5" onClick={() => remove(index)} disabled={disabled}>
                    <Trash2 />
                  </IconButton>
                </div>
                {message && (
                  <p className="mt-1.5 pl-11 text-[13px] text-red-600" role="alert">
                    {message}
                  </p>
                )}
              </div>
            );
          }}
        />
      )}
      {error && (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" icon={<Plus />} onClick={add} disabled={disabled || full}>
          Добавить ссылку
        </Button>
        <span className="text-[12.5px] tabular-nums text-zinc-400">
          {value.length} / {MAX_SOCIAL_LINKS}
        </span>
      </div>
    </div>
  );
}
