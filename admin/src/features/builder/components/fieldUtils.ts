import type { SectionField } from '@merenda/shared';
import { uid } from '@/lib/utils';

export type SettingsRecord = Record<string, unknown>;

/** Default value for a freshly added list item / missing key, derived from the field schema. */
export function defaultForField(field: SectionField): unknown {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'url':
      return '';
    case 'toggle':
      return false;
    case 'number':
    case 'range':
      return field.min;
    case 'select':
      return field.options[0]?.value ?? '';
    case 'media':
      return null;
    case 'media-list':
      return [];
    case 'list':
      return [];
  }
}

export function newListItem(fields: SectionField[]): SettingsRecord {
  const item: SettingsRecord = { id: uid() };
  for (const f of fields) item[f.key] = defaultForField(f);
  return item;
}

export function isVisible(field: SectionField, values: SettingsRecord): boolean {
  if (!field.showIf) return true;
  return values[field.showIf.key] === field.showIf.equals;
}

export interface FieldGroup {
  name: string;
  fields: SectionField[];
}

/** Group fields by `group` preserving first-appearance order; ungrouped fields go first as «Основное». */
export function groupFields(fields: SectionField[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const byName = new Map<string, FieldGroup>();
  const push = (name: string, f: SectionField) => {
    let g = byName.get(name);
    if (!g) {
      g = { name, fields: [] };
      byName.set(name, g);
      groups.push(g);
    }
    g.fields.push(f);
  };
  for (const f of fields) push(f.group ?? '', f);
  const ungrouped = byName.get('');
  const named = groups.filter((g) => g.name !== '');
  if (named.length === 0) return ungrouped ? [ungrouped] : [];
  return ungrouped ? [{ name: 'Основное', fields: ungrouped.fields }, ...named] : named;
}

/** Collect every string that looks like a media id (UUID) anywhere inside a settings object. */
export function collectIds(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectIds(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) collectIds(v, out);
  }
  return out;
}
