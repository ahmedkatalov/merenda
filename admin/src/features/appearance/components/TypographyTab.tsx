import { TriangleAlert } from 'lucide-react';
import { FONT_OPTIONS, fontStack, type ThemeSettings } from '@merenda/shared';
import { Badge, FormField, Select, Slider } from '@/components/ui';
import { FONT_CATEGORY_LABELS } from '../labels';
import { useThemeDraft } from '../store';

const fontGroups = (['sans', 'serif', 'display'] as const).map((cat) => ({
  label: FONT_CATEGORY_LABELS[cat],
  options: FONT_OPTIONS.filter((f) => f.category === cat).map((f) => ({ value: f.family, label: f.cyrillic ? f.family : `${f.family} — без кириллицы` })),
}));

const weightOptions = (from: number, to: number) => {
  const out: { value: string; label: string }[] = [];
  for (let w = from; w <= to; w += 100) out.push({ value: String(w), label: `${w}${w === 400 ? ' · обычный' : w === 700 ? ' · жирный' : ''}` });
  return out;
};

function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (family: string) => void }) {
  const opt = FONT_OPTIONS.find((f) => f.family === value);
  const noCyrillic = opt ? !opt.cyrillic : false;
  return (
    <FormField label={label}>
      {(id) => (
        <div className="space-y-2">
          <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} groups={fontGroups} />
          {noCyrillic && (
            <Badge tone="warning" icon={<TriangleAlert />}>
              Без кириллицы — русский текст будет показан запасным шрифтом
            </Badge>
          )}
        </div>
      )}
    </FormField>
  );
}

export function TypographyTab({ draft }: { draft: ThemeSettings }) {
  const patch = useThemeDraft((s) => s.patch);
  const t = draft.typography;
  return (
    <div className="space-y-5">
      <div
        className="rounded-xl border border-zinc-200 px-4 py-4"
        style={{ background: draft.colors.background, color: draft.colors.text, fontFamily: fontStack(t.bodyFont), fontSize: t.baseSize, lineHeight: t.lineHeight, fontWeight: t.bodyWeight }}
      >
        <div
          style={{ fontFamily: fontStack(t.headingFont), fontWeight: t.headingWeight, letterSpacing: `${t.headingLetterSpacing}em`, textTransform: t.headingTransform, color: draft.colors.heading, fontSize: t.baseSize * 1.6, lineHeight: 1.2 }}
        >
          Завтраки весь день
        </div>
        <p className="mt-2 opacity-90">Свежая выпечка, ароматный кофе и домашняя кухня. Так будет выглядеть текст на сайте.</p>
      </div>

      <FontSelect label="Шрифт заголовков" value={t.headingFont} onChange={(f) => patch('typography', { headingFont: f })} />
      <FontSelect label="Шрифт текста" value={t.bodyFont} onChange={(f) => patch('typography', { bodyFont: f })} />

      <Slider label="Базовый размер текста" min={14} max={18} step={1} unit=" px" value={t.baseSize} onChange={(v) => patch('typography', { baseSize: v })} />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Насыщенность заголовков">{(id) => <Select id={id} value={String(t.headingWeight)} onChange={(e) => patch('typography', { headingWeight: Number(e.target.value) })} options={weightOptions(400, 800)} />}</FormField>
        <FormField label="Насыщенность текста">{(id) => <Select id={id} value={String(t.bodyWeight)} onChange={(e) => patch('typography', { bodyWeight: Number(e.target.value) })} options={weightOptions(300, 600)} />}</FormField>
      </div>

      <Slider label="Межстрочный интервал" min={1.3} max={1.9} step={0.05} value={t.lineHeight} onChange={(v) => patch('typography', { lineHeight: Number(v.toFixed(2)) })} format={(v) => v.toFixed(2)} />
      <Slider label="Межбуквенный интервал заголовков" min={-0.05} max={0.1} step={0.01} value={t.headingLetterSpacing} onChange={(v) => patch('typography', { headingLetterSpacing: Number(v.toFixed(2)) })} format={(v) => `${v.toFixed(2)} em`} />

      <FormField label="Регистр заголовков">
        {(id) => (
          <Select
            id={id}
            value={t.headingTransform}
            onChange={(e) => patch('typography', { headingTransform: e.target.value as ThemeSettings['typography']['headingTransform'] })}
            options={[
              { value: 'none', label: 'Как написано' },
              { value: 'uppercase', label: 'ПРОПИСНЫЕ' },
            ]}
          />
        )}
      </FormField>
    </div>
  );
}
