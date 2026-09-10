import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const fullBleed = location.pathname === '/appearance' || location.pathname === '/builder';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-[68px] lg:pl-[248px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className={cn('flex-1', fullBleed ? 'flex min-h-0 flex-col' : 'mx-auto w-full max-w-[1200px] px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-7')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
