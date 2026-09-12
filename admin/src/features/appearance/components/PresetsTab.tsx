import { Check } from 'lucide-react';
import { THEME_PRESETS, type ThemeSettings } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { useThemeDraft } from '../store';

export function PresetsTab({ draft }: { draft: ThemeSettings }) {
  const applyPreset = useThemeDraft((s) => s.applyPreset);
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-zinc-500">Пресет задаёт цвета, шрифты и форму сразу. После выбора всё можно донастроить на других вкладках.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {THEME_PRESETS.map((p) => {
          const c = p.theme.colors;
          const active = draft.preset === p.id;
          const swatches = [c.primary, c.accent, c.background, c.surface, c.text];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              aria-pressed={active}
              className={cn(
                'group relative flex flex-col gap-3 rounded-xl border bg-white p-3.5 text-left transition-all focus-ring',
                active ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400',
              )}
            >
              <div className="flex h-14 overflow-hidden rounded-lg border border-zinc-200" style={{ background: c.background }}>
                <div className="flex flex-1 flex-col justify-center gap-1.5 px-3">
                  <div className="h-2 w-2/3 rounded-full" style={{ background: c.heading }} />
                  <div className="h-1.5 w-1/2 rounded-full" style={{ background: c.textMuted }} />
                </div>
                <div className="flex items-center pr-3">
                  <div className="h-6 w-14" style={{ background: c.primary, borderRadius: Math.min(p.theme.shape.radiusButton, 12) }} />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-900">{p.name}</span>
                  {active && (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-zinc-500">{p.description}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {swatches.map((s, i) => (
                    <span key={i} className="size-4 rounded-full border border-black/10" style={{ background: s }} />
                  ))}
                </div>
                <span className="truncate text-[11.5px] text-zinc-500">
                  {p.theme.typography.headingFont}
                  {p.theme.typography.bodyFont !== p.theme.typography.headingFont && ` / ${p.theme.typography.bodyFont}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
