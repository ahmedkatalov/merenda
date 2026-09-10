import { useEffect, useRef, useState } from 'react';
import { formatMoney, minorToMajor, parseMoneyToMinor } from '@merenda/shared';
import { cn } from '@/lib/utils';

/** Click the price → inline input, Enter saves, Escape cancels. */
export function PriceEditor({ priceMinor, oldPriceMinor, onSave, saving }: { priceMinor: number; oldPriceMinor: number | null; onSave: (minor: number) => void; saving?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      const major = minorToMajor(priceMinor);
      setText(Number.isInteger(major) ? String(major) : major.toFixed(2));
      requestAnimationFrame(() => ref.current?.select());
    }
  }, [editing, priceMinor]);

  const commit = () => {
    const minor = parseMoneyToMinor(text);
    setEditing(false);
    if (minor >= 0 && minor !== priceMinor) onSave(minor);
  };

  if (editing) {
    return (
      <div className="relative inline-flex w-28" onClick={(e) => e.stopPropagation()}>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          aria-label="Цена"
          className="h-9 w-full rounded-lg border border-brand-500 bg-white px-2.5 pr-7 text-sm tabular-nums outline-none ring-[3px] ring-brand-500/20"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-zinc-400">₽</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Изменить цену"
      className={cn('group inline-flex h-9 min-w-[5rem] flex-col items-start justify-center rounded-lg px-2 text-left transition-colors hover:bg-zinc-100 focus-ring', saving && 'opacity-60')}
    >
      <span className="text-sm font-semibold tabular-nums text-zinc-900 group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-4">{formatMoney(priceMinor)}</span>
      {oldPriceMinor !== null && oldPriceMinor > 0 && <span className="text-[11.5px] tabular-nums text-zinc-400 line-through">{formatMoney(oldPriceMinor)}</span>}
    </button>
  );
}
