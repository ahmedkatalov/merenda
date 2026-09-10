import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { SectionField } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { AccordionSection, Button, FormField, IconButton, Input, MediaField, NumberInput, Select, Slider, SortableList, Switch, Textarea } from '@/components/ui';
import { useMediaCache } from '@/features/media/cache';
import { MediaListField } from './MediaListField';
import { groupFields, isVisible, newListItem, type SettingsRecord } from './fieldUtils';

interface FieldProps {
  field: SectionField;
  values: SettingsRecord;
  onChange: (key: string, value: unknown) => void;
}

function Field({ field, values, onChange }: FieldProps) {
  const v = values[field.key];
  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <FormField label={field.label} help={field.help}>
          {(id) => <Input id={id} type={field.type === 'url' ? 'url' : 'text'} value={typeof v === 'string' ? v : ''} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(e) => onChange(field.key, e.target.value)} inputMode={field.type === 'url' ? 'url' : undefined} />}
        </FormField>
      );
    case 'textarea':
      return (
        <FormField label={field.label} help={field.help}>
          {(id) => <Textarea id={id} rows={3} value={typeof v === 'string' ? v : ''} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(e) => onChange(field.key, e.target.value)} />}
        </FormField>
      );
    case 'toggle':
      return <Switch checked={Boolean(v)} onCheckedChange={(c) => onChange(field.key, c)} label={field.label} description={field.help} className="py-1.5" />;
    case 'number':
      return (
        <FormField label={field.label} help={field.help}>
          {(id) => <NumberInput id={id} value={typeof v === 'number' ? v : null} min={field.min} max={field.max} step={field.step} unit={field.unit} allowEmpty={false} onChange={(n) => onChange(field.key, n ?? field.min)} />}
        </FormField>
      );
    case 'range':
      return (
        <div className="flex flex-col gap-1">
          <Slider label={field.label} min={field.min} max={field.max} step={field.step ?? 1} unit={field.unit} value={typeof v === 'number' ? v : field.min} onChange={(n) => onChange(field.key, n)} />
          {field.help && <p className="text-[13px] text-zinc-500">{field.help}</p>}
        </div>
      );
    case 'select':
      return (
        <FormField label={field.label} help={field.help}>
          {(id) => <Select id={id} value={typeof v === 'string' ? v : ''} options={field.options} onChange={(e) => onChange(field.key, e.target.value)} />}
        </FormField>
      );
    case 'media':
      return (
        <MediaField
          label={field.label}
          help={field.help}
          accept={field.accept}
          value={typeof v === 'string' ? v : null}
          size="sm"
          aspect="video"
          onChange={(m) => {
            if (m) useMediaCache.getState().remember(m);
            onChange(field.key, m ? m.id : null);
          }}
        />
      );
    case 'media-list':
      return <MediaListField label={field.label} help={field.help} value={Array.isArray(v) ? (v as string[]) : []} onChange={(ids) => onChange(field.key, ids)} />;
    case 'list':
      return <ListField field={field} value={Array.isArray(v) ? (v as SettingsRecord[]) : []} onChange={(items) => onChange(field.key, items)} />;
  }
}

function itemTitle(item: SettingsRecord, fields: SectionField[], fallback: string): string {
  const textField = fields.find((f) => f.type === 'text' && typeof item[f.key] === 'string' && (item[f.key] as string).trim());
  return textField ? (item[textField.key] as string) : fallback;
}

function ListField({ field, value, onChange }: { field: Extract<SectionField, { type: 'list' }>; value: SettingsRecord[]; onChange: (items: SettingsRecord[]) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const items = value.map((it, i) => (typeof it.id === 'string' && it.id ? it : { ...it, id: `item-${i}` }));
  const update = (id: string, patch: SettingsRecord) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const atMax = field.max !== undefined && items.length >= field.max;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-zinc-700">{field.label}</span>
        <span className="text-[12px] text-zinc-400">
          {items.length}
          {field.max ? ` / ${field.max}` : ''}
        </span>
      </div>
      {items.length === 0 && <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-[13px] text-zinc-500">Пока пусто</p>}
      <SortableList
        items={items}
        getId={(it) => it.id as string}
        onReorder={(next) => onChange(next)}
        className="gap-2"
        renderItem={(item, { handle, isDragging, index }) => {
          const id = item.id as string;
          const open = openId === id;
          return (
            <div className={cn('rounded-xl border border-zinc-200 bg-white', isDragging && 'shadow-pop ring-1 ring-zinc-300')}>
              <div className="flex items-center gap-1 pr-1">
                {handle}
                <button type="button" onClick={() => setOpenId(open ? null : id)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left focus-ring rounded-md">
                  <span className="truncate text-sm font-medium text-zinc-900">{itemTitle(item, field.fields, `${field.itemLabel} ${index + 1}`)}</span>
                  <ChevronDown className={cn('ml-auto size-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')} />
                </button>
                <IconButton label="Удалить" size="sm" className="text-zinc-400 hover:text-red-600" onClick={() => onChange(items.filter((it) => it.id !== id))}>
                  <Trash2 />
                </IconButton>
              </div>
              {open && (
                <div className="space-y-4 border-t border-zinc-100 px-3 py-3">
                  <FieldsRenderer fields={field.fields} values={item} onChange={(k, val) => update(id, { [k]: val })} flat />
                </div>
              )}
            </div>
          );
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus />}
        disabled={atMax}
        onClick={() => {
          const item = newListItem(field.fields);
          onChange([...items, item]);
          setOpenId(item.id as string);
        }}
      >
        Добавить {field.itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

export function FieldsRenderer({ fields, values, onChange, flat }: { fields: SectionField[]; values: SettingsRecord; onChange: (key: string, value: unknown) => void; flat?: boolean }) {
  const visible = fields.filter((f) => isVisible(f, values));
  const groups = groupFields(visible);
  if (flat || groups.length <= 1) {
    return (
      <>
        {visible.map((f) => (
          <Field key={f.key} field={f} values={values} onChange={onChange} />
        ))}
      </>
    );
  }
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <AccordionSection key={g.name} title={g.name} defaultOpen>
          {g.fields.map((f) => (
            <Field key={f.key} field={f} values={values} onChange={onChange} />
          ))}
        </AccordionSection>
      ))}
    </div>
  );
}

/** Generic settings form rendered from `SECTION_DEFINITIONS[type].fields`. */
export function SectionSettingsForm({ fields, value, onChange }: { fields: SectionField[]; value: SettingsRecord; onChange: (next: SettingsRecord) => void }) {
  return (
    <div className="space-y-4">
      <FieldsRenderer fields={fields} values={value} onChange={(k, v) => onChange({ ...value, [k]: v })} />
    </div>
  );
}
