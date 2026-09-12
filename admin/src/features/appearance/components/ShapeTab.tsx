import { useRef } from 'react';
import type { ThemeSettings } from '@merenda/shared';
import { Checkbox, Slider } from '@/components/ui';
import { useThemeDraft } from '../store';

const PILL = 999;
const DEFAULT_BUTTON_RADIUS = 12;

export function ShapeTab({ draft }: { draft: ThemeSettings }) {
  const patch = useThemeDraft((s) => s.patch);
  const s = draft.shape;
  const pill = s.radiusButton >= PILL;
  // Remember the last non-pill radius so unchecking "pill" restores it instead of a fixed default.
  const lastRadius = useRef(pill ? DEFAULT_BUTTON_RADIUS : s.radiusButton);
  if (!pill) lastRadius.current = s.radiusButton;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4" style={{ background: draft.colors.background }}>
        <div className="flex-1 overflow-hidden" style={{ background: draft.colors.surface, borderRadius: s.radiusCard, border: `${s.borderWidth}px solid ${draft.colors.border}` }}>
          <div className="h-14 bg-zinc-200/70" style={{ background: draft.colors.surfaceAlt, borderRadius: `${s.radiusImage}px ${s.radiusImage}px 0 0` }} />
          <div className="space-y-2 p-3">
            <div className="h-2 w-2/3 rounded-full" style={{ background: draft.colors.heading }} />
            <div className="h-8" style={{ borderRadius: s.radiusInput, border: `${Math.max(1, s.borderWidth)}px solid ${draft.colors.border}`, background: draft.colors.surface }} />
            <div className="flex h-8 w-24 items-center justify-center text-[11px] font-medium" style={{ background: draft.colors.primary, color: draft.colors.onPrimary, borderRadius: s.radiusButton }}>
              В корзину
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Slider label="Скругление кнопок" min={0} max={32} step={1} unit=" px" value={pill ? 32 : s.radiusButton} onChange={(v) => patch('shape', { radiusButton: v })} disabled={pill} format={(v) => (pill ? 'Pill' : `${v} px`)} />
        <Checkbox label="Круглые кнопки (pill)" checked={pill} onChange={(e) => patch('shape', { radiusButton: e.target.checked ? PILL : lastRadius.current })} />
      </div>
      <Slider label="Скругление карточек" min={0} max={32} step={1} unit=" px" value={s.radiusCard} onChange={(v) => patch('shape', { radiusCard: v })} />
      <Slider label="Скругление изображений" min={0} max={32} step={1} unit=" px" value={s.radiusImage} onChange={(v) => patch('shape', { radiusImage: v })} />
      <Slider label="Скругление полей ввода" min={0} max={32} step={1} unit=" px" value={s.radiusInput} onChange={(v) => patch('shape', { radiusInput: v })} />
      <Slider label="Толщина границ" min={0} max={3} step={1} unit=" px" value={s.borderWidth} onChange={(v) => patch('shape', { borderWidth: v })} />
    </div>
  );
}
