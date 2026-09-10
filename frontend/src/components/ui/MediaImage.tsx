import type { Media } from '@merenda/shared';
import { cn } from '@/lib/cn';
import { imageSource } from '@/lib/media';
import { Icon } from './Icon';

interface Props {
  media: Media | null | undefined;
  /** Tailwind aspect class, e.g. `aspect-[4/3]`. */
  aspectClass?: string;
  sizes?: string;
  prefer?: 'thumb' | 'medium';
  alt?: string;
  /** Lucide icon name for the placeholder. */
  fallbackIcon?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  rounded?: boolean;
}

/**
 * Fixed-aspect image box with lazy loading, srcSet for images, original URL
 * for GIFs, and an elegant patterned placeholder when there is no media.
 */
export function MediaImage({
  media,
  aspectClass = 'aspect-[4/3]',
  sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  prefer = 'thumb',
  alt,
  fallbackIcon = 'utensils',
  className,
  imgClassName,
  eager,
  rounded = true,
}: Props) {
  const src = imageSource(media, prefer);
  return (
    <div className={cn('relative w-full overflow-hidden', aspectClass, rounded && 'rounded-image', !src && 'placeholder-pattern', className)}>
      {src ? (
        <img
          src={src.src}
          srcSet={src.isGif ? undefined : src.srcSet}
          sizes={src.isGif ? undefined : sizes}
          alt={alt ?? src.alt}
          width={src.width || undefined}
          height={src.height || undefined}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className={cn('absolute inset-0 size-full object-cover', imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-solid/70 text-accent shadow-card">
            <Icon name={fallbackIcon} className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
        </div>
      )}
    </div>
  );
}
