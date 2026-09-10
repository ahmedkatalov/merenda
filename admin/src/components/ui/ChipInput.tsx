import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  id?: string;
}

export function ChipInput({ value, onChange, placeholder = 'Введите и нажмите Enter', suggestions, className, id }: ChipInputProps) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const v = raw.trim().replace(/,+$/, '');
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
      setText('');
    } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };
  const remaining = suggestions?.filter((s) => !value.includes(s)) ?? [];
  return (
    <div className={className}>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-2 py-1.5 transition-colors focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/20 hover:border-zinc-300">
        {value.map((chip) => (
          <span key={chip} className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-100 pl-2 pr-1 text-[13px] text-zinc-800">
            {chip}
            <button type="button" aria-label={`Удалить ${chip}`} onClick={() => onChange(value.filter((c) => c !== chip))} className="inline-flex size-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (text.trim()) {
              add(text);
              setText('');
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="h-7 min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className={cn('h-7 rounded-md border border-dashed border-zinc-300 px-2 text-[12.5px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-800')}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
