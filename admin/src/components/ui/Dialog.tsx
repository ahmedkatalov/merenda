import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';
import { Portal, useEscape, useFocusTrap, useMountTransition, useScrollLock } from './overlay';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Disable backdrop/escape closing (while saving). */
  locked?: boolean;
  /** Remove body padding (for custom layouts). */
  flush?: boolean;
  className?: string;
}

const sizes = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[760px]', xl: 'max-w-[960px]' };

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', locked, flush, className }: DialogProps) {
  const { mounted, visible } = useMountTransition(open);
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
      <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
        <div
          className={cn('absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')}
          onClick={close}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          tabIndex={-1}
          className={cn(
            'relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-pop outline-none',
            'rounded-t-2xl sm:rounded-2xl',
            'transition-all duration-200',
            visible ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.98]',
            sizes[size],
            className,
          )}
        >
          {(title || !locked) && (
            <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-6">
              <div className="min-w-0">
                {title && (
                  <h2 id="dialog-title" className="text-base font-semibold text-zinc-900">
                    {title}
                  </h2>
                )}
                {description && <p className="mt-1 text-[13px] text-zinc-500">{description}</p>}
              </div>
              <IconButton label="Закрыть" onClick={close} size="sm" className="-mr-2 -mt-1 text-zinc-500" disabled={locked}>
                <X />
              </IconButton>
            </div>
          )}
          <div className={cn('min-h-0 flex-1 overflow-y-auto scrollbar-thin', !flush && 'px-5 py-4 sm:px-6')}>{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6 [&>button]:w-full sm:[&>button]:w-auto">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
