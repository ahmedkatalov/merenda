import { cn } from '@/lib/utils';

/**
 * 0–4 score: length ≥ 8, length ≥ 12, has a digit, has upper + lower case,
 * has a symbol. Five checks, capped at 4 segments.
 */
export function passwordScore(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/\p{Ll}/u.test(value) && /\p{Lu}/u.test(value)) score += 1;
  if (/[^\p{L}\p{N}\s]/u.test(value)) score += 1;
  return Math.min(4, score);
}

const LEVELS = [
  { label: 'Слабый', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Средний', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Хороший', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  { label: 'Надёжный', bar: 'bg-emerald-600', text: 'text-emerald-700' },
] as const;

export function PasswordStrength({ value, className }: { value: string; className?: string }) {
  if (!value) return null;
  const score = passwordScore(value);
  // Anything non-empty shows at least one (red) segment.
  const filled = Math.max(1, score);
  const level = LEVELS[filled - 1];
  return (
    <div className={cn('space-y-1', className)} aria-live="polite">
      <div className="flex gap-1" role="meter" aria-label="Надёжность пароля" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score}>
        {LEVELS.map((_, i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full bg-zinc-200 transition-colors', i < filled && level.bar)} />
        ))}
      </div>
      <p className="text-[12px] text-zinc-500">
        Надёжность: <span className={cn('font-medium', level.text)}>{level.label}</span>
      </p>
    </div>
  );
}
