import type { SiteStatus } from '@merenda/shared';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface Props {
  status: SiteStatus;
  size?: 'sm' | 'md';
  /** Show the full human message instead of the short label. */
  verbose?: boolean;
  className?: string;
}

export function statusLabel(status: SiteStatus, verbose = false): string {
  const v = status.venue;
  if (v.mode === 'temporarily_closed') return t.status.temporarilyClosed;
  if (verbose && v.message) return v.message;
  if (v.isOpen) return v.closesAt ? `${t.status.open} · ${t.status.until} ${v.closesAt}` : t.status.open;
  return t.status.closed;
}

export function StatusPill({ status, size = 'md', verbose, className }: Props) {
  const v = status.venue;
  const tone = v.mode === 'temporarily_closed' ? 'warning' : v.isOpen ? 'success' : 'muted';
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-full border font-medium leading-none whitespace-nowrap',
        size === 'sm' ? 'h-8 px-2.5 text-[0.75rem]' : 'h-9 px-3 text-[0.8125rem]',
        tone === 'success' && 'border-success/25 bg-success-soft text-success',
        tone === 'warning' && 'border-warning/30 bg-warning-soft text-warning',
        tone === 'muted' && 'border-border bg-surface-alt text-muted',
        className,
      )}
      title={v.message || undefined}
    >
      <span className="relative flex size-2 shrink-0">
        {tone === 'success' ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40" /> : null}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            tone === 'success' && 'bg-success',
            tone === 'warning' && 'bg-warning',
            tone === 'muted' && 'bg-muted',
          )}
        />
      </span>
      <span className="truncate">{statusLabel(status, verbose)}</span>
    </span>
  );
}
