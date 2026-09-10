import { ExternalLink, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SITE_URL } from '@/lib/env';
import { IconButton } from '@/components/ui';
import { pageTitle } from './nav';
import { StatusPill } from './StatusPill';
import { UserMenu } from './UserMenu';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/85 px-3 backdrop-blur-md sm:px-5 lg:px-6">
      <IconButton label="Открыть меню" onClick={onMenu} className="md:hidden">
        <Menu />
      </IconButton>
      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-zinc-900">{pageTitle(pathname)}</h1>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <StatusPill />
        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-ring sm:inline-flex"
        >
          Открыть сайт
          <ExternalLink className="size-3.5 text-zinc-400" />
        </a>
        <UserMenu />
      </div>
    </header>
  );
}
