import { AnimatePresence, motion } from 'motion/react';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

interface ToastItem {
  id: number;
  text: string;
  tone: 'neutral' | 'warning';
}

interface ToastState {
  toasts: ToastItem[];
  push: (text: string, tone?: ToastItem['tone']) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (text, tone = 'neutral') => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function ToastHost({ raised }: { raised: boolean }) {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 transition-[bottom] duration-200',
        raised ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] md:bottom-6' : 'bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:bottom-6',
      )}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto max-w-md rounded-card border px-4 py-3 text-left text-[0.9375rem] shadow-elevated',
              toast.tone === 'warning' ? 'border-warning/30 bg-warning-soft text-heading backdrop-blur-md' : 'border-border bg-surface-solid text-body',
            )}
          >
            {toast.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
