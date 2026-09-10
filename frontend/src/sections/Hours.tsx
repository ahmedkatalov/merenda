import { getSectionSettings, groupScheduleDays, type PageSection, type PublicSchedule, type ScheduleDay, type SiteStatus } from '@merenda/shared';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatusPill } from '@/components/ui/StatusPill';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { customSchedules, todayWeekday, venueSchedule } from '@/lib/schedule';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

/** Index of the grouped row (as produced by groupScheduleDays) that contains `today`. */
function todayGroupIndex(hours: ScheduleDay[], today: number): number {
  const sorted = [...hours].sort((a, b) => a.weekday - b.weekday);
  let idx = -1;
  let lastValue: string | null = null;
  let lastDay = -2;
  for (const day of sorted) {
    const value = day.isClosed ? 'closed' : `${day.opensAt}-${day.closesAt}`;
    if (!(lastValue === value && lastDay === day.weekday - 1)) idx += 1;
    lastValue = value;
    lastDay = day.weekday;
    if (day.weekday === today) return idx;
  }
  return -1;
}

function ScheduleCard({ schedule, today, status, primary }: { schedule: PublicSchedule; today: number; status: SiteStatus; primary: boolean }) {
  const groups = groupScheduleDays(schedule.hours);
  const activeIdx = todayGroupIndex(schedule.hours, today);
  const sched = status.schedules.find((s) => s.scheduleId === schedule.id);
  return (
    <div className={cn('card-surface flex flex-col gap-4 p-5 md:p-6', primary && 'md:col-span-2 lg:col-span-1')}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[1.25rem]">{schedule.name}</h3>
        {primary ? <StatusPill status={status} size="sm" /> : sched ? (
          <span className={cn('flex items-center gap-1.5 text-[0.8125rem] font-medium', sched.isOpen ? 'text-success' : 'text-muted')}>
            <span className={cn('size-1.5 rounded-full', sched.isOpen ? 'bg-success' : 'bg-warning')} aria-hidden />
            {sched.isOpen ? t.status.open : t.status.closed}
          </span>
        ) : null}
      </div>
      <dl className="flex flex-col gap-1.5">
        {groups.map((g, i) => {
          const isToday = i === activeIdx;
          return (
            <div key={`${g.label}-${i}`} className={cn('-mx-2 flex items-baseline rounded-input px-2 py-1.5', isToday && 'bg-primary-soft')}>
              <dt className={cn('font-medium', isToday ? 'text-heading' : 'text-body')}>
                {g.label}
                {isToday ? <span className="ml-2 text-[0.6875rem] font-semibold tracking-wider text-accent uppercase">{t.hours.today}</span> : null}
              </dt>
              <span className="dot-leader" aria-hidden />
              <dd className={cn('tabular-nums', g.isClosed ? 'text-muted' : 'font-semibold text-heading')}>{g.isClosed ? t.hours.closedDay : g.value}</dd>
            </div>
          );
        })}
      </dl>
      {sched?.message ? <p className="text-[0.875rem] text-muted">{sched.message}</p> : null}
    </div>
  );
}

export default function Hours({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'hours'>(section);
  const { site, status } = useSiteData();
  const venue = venueSchedule(site.schedules);
  const custom = s.showAllSchedules ? customSchedules(site.schedules) : [];
  const today = todayWeekday(status);
  if (!venue) return null;
  const cards = [venue, ...custom];

  return (
    <SectionShell section={section} anchorId={anchorId} belowFold>
      <Container>
        <Reveal>
          <SectionHeading title={s.title} subtitle={status.venue.message || undefined} />
        </Reveal>
        <div className={cn('grid gap-4 md:gap-5', cards.length > 1 && 'md:grid-cols-2', cards.length > 2 && 'lg:grid-cols-3')}>
          {cards.map((sc, i) => (
            <Reveal key={sc.id} delay={i * 0.06}>
              <ScheduleCard schedule={sc} today={today} status={status} primary={i === 0} />
            </Reveal>
          ))}
        </div>
        {s.note ? <p className="mt-5 max-w-2xl text-[0.9375rem] text-muted">{s.note}</p> : null}
      </Container>
    </SectionShell>
  );
}
