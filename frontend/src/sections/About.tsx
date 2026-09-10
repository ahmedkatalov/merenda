import { getSectionSettings, type PageSection } from '@merenda/shared';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { MediaImage } from '@/components/ui/MediaImage';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/cn';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

export default function About({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'about'>(section);
  const { media } = useSiteData();
  const visual = media(s.gifId) ?? media(s.imageId);
  const features = s.features.filter((f) => f.title || f.text);

  return (
    <SectionShell section={section} anchorId={anchorId} belowFold className="bg-surface-alt/40">
      <Container className={cn('grid items-center gap-10 md:gap-14', visual && 'md:grid-cols-2')}>
        <Reveal className={cn('flex flex-col gap-6', visual && s.imagePosition === 'left' && 'md:order-2')}>
          {s.title ? <h2 className="text-[1.75rem] md:text-[2.25rem]">{s.title}</h2> : null}
          {s.text ? <p className="whitespace-pre-line text-[1.0625rem] leading-relaxed text-body">{s.text}</p> : null}
          {features.length ? (
            <ul className="mt-2 grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f.id} className="flex gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon name={f.icon} className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    {f.title ? <h3 className="text-[1.0625rem]">{f.title}</h3> : null}
                    {f.text ? <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-muted">{f.text}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
        {visual ? (
          <Reveal delay={0.08} className={cn('relative', s.imagePosition === 'left' && 'md:order-1')}>
            <div className="absolute -inset-3 rounded-[calc(var(--radius-card)+12px)] border border-accent/25" aria-hidden />
            <MediaImage media={visual} aspectClass="aspect-[4/3] md:aspect-[5/4]" prefer="medium" sizes="(min-width: 768px) 50vw, 100vw" className="rounded-card shadow-card" />
          </Reveal>
        ) : null}
      </Container>
    </SectionShell>
  );
}
