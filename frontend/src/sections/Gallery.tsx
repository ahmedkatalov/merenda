import { lazy, Suspense, useState } from 'react';
import { getSectionSettings, type Media, type PageSection } from '@merenda/shared';
import { Container } from '@/components/ui/Container';
import { MediaImage } from '@/components/ui/MediaImage';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { imageSource } from '@/lib/media';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

const Lightbox = lazy(() => import('./GalleryLightbox'));

function MasonryImage({ media, sizes }: { media: Media; sizes: string }) {
  const src = imageSource(media, 'thumb');
  if (!src) return null;
  return (
    <img
      src={src.src}
      srcSet={src.isGif ? undefined : src.srcSet}
      sizes={src.isGif ? undefined : sizes}
      alt={src.alt}
      width={src.width || undefined}
      height={src.height || undefined}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="block w-full transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
      style={src.width && src.height ? { aspectRatio: `${src.width} / ${src.height}` } : undefined}
    />
  );
}

export default function Gallery({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'gallery'>(section);
  const { media } = useSiteData();
  const items = s.mediaIds.map((id) => media(id)).filter((m): m is Media => m !== null);
  const [index, setIndex] = useState<number | null>(null);
  if (!items.length) return null;
  const masonry = s.layout === 'masonry';
  const cols = Math.max(2, Math.min(4, s.columns || 3));
  const sizes = `(min-width: 768px) ${Math.round(100 / cols)}vw, 50vw`;

  return (
    <SectionShell section={section} anchorId={anchorId} belowFold>
      <Container>
        <Reveal>
          <SectionHeading title={s.title} subtitle={s.subtitle} />
        </Reveal>
        <div className={masonry ? 'gallery-masonry' : 'gallery-grid'} style={{ ['--gallery-cols' as string]: cols }}>
          {items.map((m, i) => (
            <Reveal key={`${m.id}-${i}`} delay={Math.min(i, 8) * 0.03}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${t.gallery.open} ${i + 1}`}
                className="group block w-full overflow-hidden rounded-image bg-surface-alt outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {masonry ? (
                  <MasonryImage media={m} sizes={sizes} />
                ) : (
                  <MediaImage media={m} aspectClass="aspect-square" sizes={sizes} rounded={false} imgClassName="transition-transform duration-500 ease-premium group-hover:scale-[1.04]" />
                )}
              </button>
            </Reveal>
          ))}
        </div>
      </Container>
      {index !== null ? (
        <Suspense fallback={null}>
          <Lightbox items={items} index={index} onChange={setIndex} onClose={() => setIndex(null)} />
        </Suspense>
      ) : null}
    </SectionShell>
  );
}
