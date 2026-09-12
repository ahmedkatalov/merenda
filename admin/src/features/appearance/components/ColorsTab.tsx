import { Moon, Sun } from 'lucide-react';
import type { ThemeSettings } from '@merenda/shared';
import { ColorField, SegmentedControl } from '@/components/ui';
import { COLOR_GROUPS, COLOR_LABELS } from '../labels';
import { useThemeDraft } from '../store';

export function ColorsTab({ draft }: { draft: ThemeSettings }) {
  const patch = useThemeDraft((s) => s.patch);
  const setMode = useThemeDraft((s) => s.setMode);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-zinc-700">Схема</div>
          <p className="text-[12px] text-zinc-500">Влияет на тени и системные элементы.</p>
        </div>
        <SegmentedControl<ThemeSettings['mode']>
          aria-label="Цветовая схема"
          size="sm"
          value={draft.mode}
          onChange={setMode}
          options={[
            { value: 'light', label: 'Светлая', icon: <Sun /> },
            { value: 'dark', label: 'Тёмная', icon: <Moon /> },
          ]}
        />
      </div>
      {COLOR_GROUPS.map((g) => (
        <section key={g.title}>
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-zinc-500">{g.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {g.keys.map((key) => (
              <ColorField key={key} label={COLOR_LABELS[key]} value={draft.colors[key]} onChange={(hex) => patch('colors', { [key]: hex })} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
