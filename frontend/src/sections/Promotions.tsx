import { ArrowUpRight } from 'lucide-react';
import { getSectionSettings, type PageSection, type PromotionItem } from '@merenda/shared';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { MediaImage } from '@/components/ui/MediaImage';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

function PromoCard({ item, carousel }: { item: PromotionItem; carousel: boolean }) {
  const { media } = useSiteData();
  const visual = media(item.gifId) ?? media(item.imageId);
  const external = item.url.startsWith('http');
  const Tag = item.url ? 'a' : 'div';
  return (
    <Tag
      href={item.url || undefined}
      target={item.url && external ? '_blank' : undefined}
      rel={item.url && external ? 'noopener' : undefined}
      className={cn(
        'card-surface group flex h-full flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-premium',
        item.url && 'hover:-translate-y-0.5 hover:shadow-elevated',
        carousel && 'w-[18rem] shrink-0 snap-start sm:w-[20rem]',
      )}
    >
      {visual ? (
        <div className="relative">
          <MediaImage media={visual} aspectClass="aspect-video" rounded={false} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" imgClassName="transition-transform duration-500 ease-premium group-hover:scale-[1.03]" />
          {item.badge ? <Badge tone="accent" className="absolute left-3 top-3">{item.badge}</Badge> : null}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {!visual && item.badge ? <Badge tone="accent" className="self-start">{item.badge}</Badge> : null}
        {item.title ? <h3 className="text-[1.25rem] leading-snug">{item.title}</h3> : null}
        {item.text ? <p className="text-[0.9375rem] leading-relaxed text-muted">{item.text}</p> : null}
        {item.url ? (
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[0.9375rem] font-semibold text-primary">
            {t.common.more}
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        ) : null}
      </div>
    </Tag>
  );
}

export default function Promotions({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'promotions'>(section);
  const items = s.items.filter((i) => i.title || i.text || i.imageId || i.gifId);
  if (!items.length) return null;
  const carousel = s.layout === 'carousel';

  return (
    <SectionShell section={section} anchorId={anchorId} belowFold className="overflow-hidden">
      <Container>
        <Reveal>
          <SectionHeading title={s.title} subtitle={s.subtitle} />
        </Reveal>
      </Container>
      {carousel ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:px-6 lg:mx-auto lg:max-w-site lg:px-8">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={Math.min(i, 5) * 0.05} className="flex shrink-0">
              <PromoCard item={item} carousel />
            </Reveal>
          ))}
        </div>
      ) : (
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i, 5) * 0.05}>
                <PromoCard item={item} carousel={false} />
              </Reveal>
            ))}
          </div>
        </Container>
      )}
    </SectionShell>
  );
}
