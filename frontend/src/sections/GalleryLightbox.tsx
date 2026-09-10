import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Media } from '@merenda/shared';
import { useBodyScrollLock, useEscape } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { imageSource } from '@/lib/media';

interface Props {
  items: Media[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}

/** Minimal dependency-free lightbox with keyboard and swipe navigation. */
export default function GalleryLightbox({ items, index, onChange, onClose }: Props) {
  const touchX = useRef<number | null>(null);
  const count = items.length;
  const prev = (): void => onChange((index - 1 + count) % count);
  const next = (): void => onChange((index + 1) % count);

  useBodyScrollLock(true);
  useEscape(true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const media = items[index];
  const src = imageSource(media, 'medium');
  const btn = 'flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20';

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t.gallery.counter(index + 1, count)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start === null || end === undefined) return;
        if (end - start > 50) prev();
        else if (start - end > 50) next();
      }}
    >
      <div className="absolute left-4 top-4 text-[0.875rem] text-white/70">{t.gallery.counter(index + 1, count)}</div>
      <button type="button" onClick={onClose} aria-label={t.common.close} className={`${btn} absolute right-4 top-4`}>
        <X className="size-5" />
      </button>
      {count > 1 ? (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label={t.gallery.prev} className={`${btn} absolute left-3 top-1/2 hidden -translate-y-1/2 md:flex`}>
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} aria-label={t.gallery.next} className={`${btn} absolute right-3 top-1/2 hidden -translate-y-1/2 md:flex`}>
            <ChevronRight className="size-6" />
          </button>
        </>
      ) : null}
      <AnimatePresence mode="wait" initial={false}>
        {src ? (
          <motion.img
            key={media?.id ?? index}
            src={src.src}
            srcSet={src.isGif ? undefined : src.srcSet}
            sizes="100vw"
            alt={src.alt}
            className="max-h-[88dvh] max-w-full rounded-image object-contain shadow-elevated"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}
