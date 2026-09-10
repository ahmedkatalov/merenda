import type { ThemeSettings } from '@merenda/shared';
import { FormField, Select, Slider } from '@/components/ui';
import { SHADOW_OPTIONS } from '../labels';
import { useThemeDraft } from '../store';

export function EffectsTab({ draft }: { draft: ThemeSettings }) {
  const patch = useThemeDraft((s) => s.patch);
  const e = draft.effects;
  return (
    <div className="space-y-5">
      <FormField label="Тень карточек">{(id) => <Select id={id} value={e.shadow} onChange={(ev) => patch('effects', { shadow: ev.target.value as ThemeSettings['effects']['shadow'] })} options={SHADOW_OPTIONS} />}</FormField>
      <Slider label="Интенсивность тени" min={0} max={100} step={5} unit="%" value={e.shadowIntensity} onChange={(v) => patch('effects', { shadowIntensity: v })} disabled={e.shadow === 'none'} />
      <Slider label="Размытие шапки и оверлеев" min={0} max={24} step={1} unit=" px" value={e.blur} onChange={(v) => patch('effects', { blur: v })} />
      <Slider label="Непрозрачность карточек" min={60} max={100} step={5} unit="%" value={e.surfaceOpacity} onChange={(v) => patch('effects', { surfaceOpacity: v })} />
      <p className="text-[12.5px] text-zinc-500">Полупрозрачные карточки красиво смотрятся поверх фонового изображения главного экрана.</p>
    </div>
  );
}
