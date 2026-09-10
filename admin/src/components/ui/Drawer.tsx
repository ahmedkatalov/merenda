import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';
import { Portal, useEscape, useFocusTrap, useMountTransition, useScrollLock } from './overlay';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  locked?: boolean;
  headerExtra?: ReactNode;
  flush?: boolean;
}

const widths = { sm: 'md:max-w-[420px]', md: 'md:max-w-[520px]', lg: 'md:max-w-[680px]' };

/** Right-side panel on desktop, full-screen sheet on mobile. */
export function Drawer({ open, onClose, title, description, children, footer, width = 'md', locked, headerExtra, flush }: DrawerProps) {
  const { mounted, visible } = useMountTransition(open, 240);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => {
    if (!locked) onClose();
  };
  useScrollLock(mounted);
  useEscape(open, close);
  useFocusTrap(open, panelRef);

  if (!mounted) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[60]" role="presentation">
        <div className={cn('absolute inset-0 bg-zinc-900/35 transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')} onClick={close} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={cn(
            'absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-pop outline-none md:my-2 md:mr-2 md:h-[calc(100%-1rem)] md:rounded-2xl md:border md:border-zinc-200',
            widths[width],
            'transition-transform duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
            visible ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <div className="min-w-0 flex-1">
              {title && <h2 className="truncate text-base font-semibold text-zinc-900">{title}</h2>}
              {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
              {headerExtra}
            </div>
            <IconButton label="Закрыть" onClick={close} size="sm" className="-mr-2 text-zinc-500" disabled={locked}>
              <X />
            </IconButton>
          </div>
          <div className={cn('min-h-0 flex-1 overflow-y-auto scrollbar-thin', !flush && 'px-5 py-5')}>{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] [&>button]:flex-1 md:[&>button]:flex-none">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
