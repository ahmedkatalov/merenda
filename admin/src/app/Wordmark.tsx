import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Wordmark({ compact, className, size = 'md' }: { compact?: boolean; className?: string; size?: 'md' | 'lg' }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 focus-ring rounded-md', className)} aria-label="Merenda Admin">
      <span className={cn('inline-flex items-center justify-center rounded-[9px] bg-zinc-900 font-serif italic text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]', size === 'lg' ? 'size-10 text-[19px]' : 'size-8 text-[15px]')}>
        M
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn('font-semibold tracking-tight text-zinc-900', size === 'lg' ? 'text-[17px]' : 'text-[15px]')}>Merenda</span>
          <span className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-400">Admin</span>
        </span>
      )}
    </Link>
  );
}
