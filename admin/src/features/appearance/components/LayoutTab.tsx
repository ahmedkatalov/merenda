import type { ThemeSettings } from '@merenda/shared';
import { FormField, SegmentedControl, Slider } from '@/components/ui';
import { BUTTON_STYLE_OPTIONS, DENSITY_OPTIONS } from '../labels';
import { useThemeDraft } from '../store';

export function LayoutTab({ draft }: { draft: ThemeSettings }) {
  const patch = useThemeDraft((s) => s.patch);
  const l = draft.layout;
  return (
    <div className="space-y-5">
      <FormField label="Плотность" help="Расстояния между блоками и внутри карточек.">
        <SegmentedControl<ThemeSettings['layout']['density']> fullWidth value={l.density} onChange={(v) => patch('layout', { density: v })} options={DENSITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </FormField>
      <Slider label="Максимальная ширина контента" min={960} max={1400} step={20} unit=" px" value={l.maxWidth} onChange={(v) => patch('layout', { maxWidth: v })} />
      <FormField label="Стиль кнопок">
        <SegmentedControl<ThemeSettings['layout']['buttonStyle']> fullWidth value={l.buttonStyle} onChange={(v) => patch('layout', { buttonStyle: v })} options={BUTTON_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </FormField>
      <div className="flex gap-2 rounded-xl border border-zinc-200 p-4" style={{ background: draft.colors.background }}>
        {(['solid', 'soft', 'outline'] as const).map((style) => {
          const active = l.buttonStyle === style;
          const base: React.CSSProperties = { borderRadius: draft.shape.radiusButton, opacity: active ? 1 : 0.45 };
          const styles: Record<typeof style, React.CSSProperties> = {
            solid: { background: draft.colors.primary, color: draft.colors.onPrimary },
            soft: { background: `${draft.colors.primary}1f`, color: draft.colors.primary },
            outline: { border: `1.5px solid ${draft.colors.primary}`, color: draft.colors.primary },
          };
          return (
            <button key={style} type="button" onClick={() => patch('layout', { buttonStyle: style })} className="flex h-9 flex-1 items-center justify-center text-[12px] font-medium" style={{ ...base, ...styles[style] }}>
              В корзину
            </button>
          );
        })}
      </div>
    </div>
  );
}
