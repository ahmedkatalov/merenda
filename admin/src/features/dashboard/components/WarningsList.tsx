import { ChevronRight, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WARNING_LINKS } from '@/lib/i18n';

export function WarningsList({ warnings }: { warnings: { code: string; message: string }[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-1.5">
      <ul className="divide-y divide-amber-200/60">
        {warnings.map((w, i) => {
          const to = WARNING_LINKS[w.code] ?? Object.entries(WARNING_LINKS).find(([k]) => w.code.includes(k))?.[1] ?? '/settings';
          return (
            <li key={`${w.code}-${i}`}>
              <Link to={to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-amber-900 transition-colors hover:bg-amber-100/70 focus-ring">
                <TriangleAlert className="size-4 shrink-0 text-amber-600" />
                <span className="flex-1">{w.message}</span>
                <ChevronRight className="size-4 text-amber-500" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
