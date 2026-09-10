import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';

export function UserMenu() {
  const user = useCurrentUser();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initials = (user?.name || user?.email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white pl-1 pr-2 transition-colors hover:bg-zinc-50 focus-ring"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-[11px] font-semibold text-white">{initials}</span>
        <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-zinc-800 md:inline">{user?.name || user?.email}</span>
        <ChevronDown className={cn('size-3.5 text-zinc-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-pop animate-scale-in">
          <div className="px-2.5 py-2">
            <div className="truncate text-sm font-medium text-zinc-900">{user?.name || 'Администратор'}</div>
            <div className="truncate text-[12.5px] text-zinc-500">{user?.email}</div>
          </div>
          <div className="my-1 h-px bg-zinc-100" />
          <Link to="/security" role="menuitem" onClick={() => setOpen(false)} className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-zinc-700 hover:bg-zinc-100">
            <UserRound className="size-4 text-zinc-400" /> Профиль
          </Link>
          <button type="button" role="menuitem" onClick={() => void logout()} className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] text-zinc-700 hover:bg-zinc-100">
            <LogOut className="size-4 text-zinc-400" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}
