import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Clock } from 'lucide-react';
import { getSectionSettings, type PageSection } from '@merenda/shared';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { MediaImage } from '@/components/ui/MediaImage';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';
import { mediaUrl } from '@/lib/api';
import { t } from '@/lib/i18n';
import { scrollToId } from '@/lib/scroll';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

const EASE = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

export function Hero({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'hero'>(section);
  const { site, status, media, isPreview } = useSiteData();
  const visual = media(s.gifId) ?? media(s.imageId);
  const background = media(s.backgroundImageId);
  const layout = s.layout === 'split' && !visual ? 'centered' : s.layout;
  const cover = layout === 'cover';
  const closed = status.venue.mode === 'temporarily_closed';
  const reduce = useReducedMotion();
  const still = isPreview || reduce;
  const anim = (delay: number) => (still ? {} : rise(delay));

  const minH = cover
    ? { compact: 'min-h-[42vh]', normal: 'min-h-[62vh]', tall: 'min-h-[calc(100dvh-var(--header-h))]' }[s.height]
    : { compact: 'py-10 md:py-14', normal: 'py-14 md:py-20', tall: 'py-20 md:py-28' }[s.height];

  const primary =
    s.primaryCtaAction === 'none' || !s.primaryCtaLabel ? null : s.primaryCtaAction === 'url' && s.primaryCtaUrl ? (
      <ButtonLink href={s.primaryCtaUrl} size="lg" target={s.primaryCtaUrl.startsWith('http') ? '_blank' : undefined} rel="noopener">
        {s.primaryCtaLabel}
      </ButtonLink>
    ) : (
      <Button size="lg" onClick={() => scrollToId('menu')} aria-label={t.a11y.scrollToMenu}>
        {s.primaryCtaLabel}
        <ArrowDown className="size-4" />
      </Button>
    );
  const secondary =
    s.secondaryCtaLabel && s.secondaryCtaUrl ? (
      <ButtonLink href={s.secondaryCtaUrl} size="lg" variant={cover ? 'ghost' : 'secondary'} className={cn(cover && 'text-white ring-1 ring-white/40 hover:bg-white/10')} target={s.secondaryCtaUrl.startsWith('http') ? '_blank' : undefined} rel="noopener">
        {s.secondaryCtaLabel}
      </ButtonLink>
    ) : null;

  const statusBlock = s.showStatus ? (
    <motion.div {...anim(0.05)} className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', layout === 'centered' && 'justify-center')}>
      <StatusPill status={status} verbose className={cn(cover && 'border-white/25 bg-white/10 text-white backdrop-blur')} />
      {status.schedules.map((sch) => (
        <span key={sch.scheduleId} className={cn('flex items-center gap-1.5 text-[0.875rem]', cover ? 'text-white/80' : 'text-muted')}>
          <span className={cn('size-1.5 rounded-full', sch.isOpen ? 'bg-success' : 'bg-warning')} aria-hidden />
          {sch.message || `${sch.name}: ${sch.isOpen ? t.status.open : t.status.closed}`}
        </span>
      ))}
    </motion.div>
  ) : null;

  const notice = closed ? (
    <motion.div {...anim(0.1)} role="status" className={cn('flex max-w-xl items-start gap-3 rounded-card border px-4 py-3.5 text-left', cover ? 'border-white/25 bg-black/30 text-white backdrop-blur' : 'border-warning/30 bg-warning-soft text-heading', layout === 'centered' && 'mx-auto')}>
      <Clock className={cn('mt-0.5 size-5 shrink-0', cover ? 'text-white' : 'text-warning')} />
      <div>
        <p className="font-semibold">{t.hero.closedNoticeTitle}</p>
        {status.venue.closedMessage ? <p className={cn('mt-0.5 text-[0.9375rem]', cover ? 'text-white/85' : 'text-body')}>{status.venue.closedMessage}</p> : null}
      </div>
    </motion.div>
  ) : null;

  const text = (
    <div className={cn('flex flex-col gap-5 md:gap-6', layout === 'centered' && 'mx-auto max-w-3xl items-center text-center', cover && 'max-w-3xl')}>
      {site.business.tagline && s.title !== site.business.tagline ? (
        <motion.p {...anim(0)} className={cn('text-[0.75rem] font-semibold tracking-[0.22em] uppercase', cover ? 'text-white/80' : 'text-accent')}>
          {site.business.tagline}
        </motion.p>
      ) : null}
      {s.title ? (
        <motion.h1 {...anim(0.04)} className={cn('text-[2.25rem] leading-[1.08] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.75rem]', cover && 'text-white')}>
          {s.title}
        </motion.h1>
      ) : null}
      {s.subtitle ? (
        <motion.p {...anim(0.08)} className={cn('max-w-xl text-[1.0625rem] leading-relaxed md:text-[1.125rem]', cover ? 'text-white/85' : 'text-muted')}>
          {s.subtitle}
        </motion.p>
      ) : null}
      {notice}
      {statusBlock}
      {primary || secondary ? (
        <motion.div {...anim(0.12)} className={cn('flex flex-wrap gap-3 pt-1', layout === 'centered' && 'justify-center')}>
          {primary}
          {secondary}
        </motion.div>
      ) : null}
    </div>
  );

  if (cover) {
    const bgUrl = background ? mediaUrl(background.kind === 'gif' ? background.url : background.mediumUrl || background.url) : null;
    return (
      <SectionShell section={section} anchorId={anchorId} bare className={cn('relative flex items-center overflow-hidden bg-primary', minH)}>
        {bgUrl ? <img src={bgUrl} alt={background?.alt ?? ''} className="absolute inset-0 size-full object-cover" fetchPriority="high" decoding="async" /> : null}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,${s.overlayOpacity / 100 * 0.6}) 0%, rgba(0,0,0,${s.overlayOpacity / 100}) 100%)` }} aria-hidden />
        <Container className={cn('relative py-16 md:py-24', layout === 'cover' && 'flex')}>{text}</Container>
      </SectionShell>
    );
  }

  return (
    <SectionShell section={section} anchorId={anchorId} bare className={cn('relative overflow-hidden', minH)}>
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent-soft blur-3xl md:size-96" aria-hidden />
      <Container className={cn(layout === 'split' && 'grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14')}>
        {text}
        {layout === 'split' && visual ? (
          <motion.div {...(still ? {} : { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.6, ease: EASE, delay: 0.1 } })} className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="absolute -inset-3 rounded-[calc(var(--radius-card)+12px)] border border-accent/30" aria-hidden />
            <MediaImage media={visual} aspectClass="aspect-[4/5] md:aspect-[5/6]" prefer="medium" sizes="(min-width: 768px) 45vw, 100vw" className="shadow-elevated rounded-card" eager />
          </motion.div>
        ) : null}
      </Container>
    </SectionShell>
  );
}
