import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useBodyScrollLock, useEscape, useIsTabletUp } from '@/lib/hooks';
import { t } from '@/lib/i18n';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** auto: bottom sheet on mobile / centered modal on tablet+. drawer: bottom sheet / right drawer. */
  mode?: 'auto' | 'drawer';
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  ariaLabel?: string;
  hideHeader?: boolean;
  /** Extra classes for the scrollable body. */
  bodyClassName?: string;
}

const SPRING = { type: 'spring', stiffness: 420, damping: 42, mass: 0.9 } as const;

export function Sheet({ open, onClose, mode = 'auto', title, children, footer, size = 'md', ariaLabel, hideHeader, bodyClassName }: SheetProps) {
  const tabletUp = useIsTabletUp();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();

  useBodyScrollLock(open);
  useEscape(open, onClose);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 30);
    return () => {
      window.clearTimeout(id);
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const variant: 'bottom' | 'modal' | 'drawer' = !tabletUp ? 'bottom' : mode === 'drawer' ? 'drawer' : 'modal';

  const onDragEnd = (_: unknown, info: PanInfo): void => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const motionProps =
    variant === 'bottom'
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: SPRING }
      : variant === 'drawer'
        ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: SPRING }
        : {
            initial: { opacity: 0, scale: 0.96, y: 12 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.97, y: 8 },
            transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
          };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            'fixed inset-0 z-50 flex',
            variant === 'bottom' && 'items-end justify-center',
            variant === 'modal' && 'items-center justify-center p-4',
            variant === 'drawer' && 'items-stretch justify-end',
          )}
        >
          <motion.button
            type="button"
            aria-label={t.common.close}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : ariaLabel}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-full flex-col bg-surface-solid text-body shadow-elevated outline-none',
              variant === 'bottom' && 'w-full max-h-[calc(100dvh-1.5rem)] rounded-t-[max(var(--radius-card),16px)] safe-bottom',
              variant === 'modal' && cn('w-full rounded-card max-h-[90dvh]', size === 'lg' ? 'max-w-2xl' : 'max-w-lg'),
              variant === 'drawer' && cn('h-dvh w-full', size === 'lg' ? 'max-w-xl' : 'max-w-md'),
            )}
            drag={variant === 'bottom' ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={variant === 'bottom' ? onDragEnd : undefined}
            {...motionProps}
          >
            {variant === 'bottom' ? (
              <div
                className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <span className="h-1.5 w-10 rounded-full bg-border" />
              </div>
            ) : null}
            {!hideHeader ? (
              <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-2 md:px-6 md:pt-5">
                <div className="min-w-0 text-[1.25rem] font-heading text-heading">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-alt hover:text-heading"
                  aria-label={t.common.close}
                >
                  <X className="size-5" />
                </button>
              </div>
            ) : null}
            <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6', bodyClassName)}>{children}</div>
            {footer ? <div className="shrink-0 border-t border-border bg-surface-solid px-5 py-4 md:px-6">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
