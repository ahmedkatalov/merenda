import { Mail, MapPin, Phone } from 'lucide-react';
import { getSectionSettings, groupScheduleDays, type PageSection } from '@merenda/shared';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/cn';
import { mediaUrl } from '@/lib/api';
import { t } from '@/lib/i18n';
import { venueSchedule } from '@/lib/schedule';
import { useSiteData } from '@/features/site/SiteContext';
import { SocialLinks } from './Social';

export default function Footer({ section }: { section: PageSection }) {
  const s = getSectionSettings<'footer'>(section);
  const { site, media } = useSiteData();
  const { business, contacts } = site;
  const logo = s.showLogo ? media(business.logoId) : null;
  const venue = venueSchedule(site.schedules);
  const hours = s.showHours && venue ? groupScheduleDays(venue.hours) : [];
  const social = s.showSocial ? contacts.social.filter((l) => l.url) : [];
  const hasContacts = s.showContacts && (contacts.phone || contacts.email || contacts.address);
  const colCount = 1 + (hasContacts ? 1 : 0) + (hours.length ? 1 : 0) + (social.length ? 1 : 0);
  const year = new Date().getFullYear();

  return (
    <footer id="footer" data-section-id={section.id} className="mt-auto border-t border-border bg-surface-alt/60">
      <Container className="pt-12 pb-8 md:pt-16">
        <div className={cn('grid gap-10', colCount >= 2 && 'sm:grid-cols-2', colCount >= 3 && 'lg:grid-cols-4')}>
          <div className={cn('flex flex-col gap-4', colCount >= 3 && 'lg:col-span-1')}>
            <div className="flex items-center gap-3">
              {logo ? <img src={mediaUrl(logo.thumbUrl || logo.url)} alt={logo.alt || business.name} className="h-10 w-auto object-contain" loading="lazy" decoding="async" /> : null}
              <span className="font-heading text-[1.25rem] tracking-[0.08em] text-heading uppercase">{business.name}</span>
            </div>
            {business.tagline ? <p className="text-[0.75rem] font-semibold tracking-[0.2em] text-accent uppercase">{business.tagline}</p> : null}
            {s.text ? <p className="max-w-xs text-[0.9375rem] leading-relaxed text-muted">{s.text}</p> : null}
          </div>
          {hasContacts ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-[1rem]">{t.nav.contacts}</h3>
              <ul className="flex flex-col gap-2.5 text-[0.9375rem]">
                {contacts.phone ? (
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-accent" />
                    <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className="hover:text-primary">{contacts.phone}</a>
                  </li>
                ) : null}
                {contacts.email ? (
                  <li className="flex items-center gap-2.5">
                    <Mail className="size-4 shrink-0 text-accent" />
                    <a href={`mailto:${contacts.email}`} className="break-all hover:text-primary">{contacts.email}</a>
                  </li>
                ) : null}
                {contacts.address ? (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-1 size-4 shrink-0 text-accent" />
                    <span>{contacts.address}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {hours.length ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-[1rem]">{t.hours.title}</h3>
              <ul className="flex flex-col gap-1.5 text-[0.9375rem]">
                {hours.map((g, i) => (
                  <li key={`${g.label}-${i}`} className="flex items-baseline">
                    <span>{g.label}</span>
                    <span className="dot-leader" aria-hidden />
                    <span className={cn('tabular-nums', g.isClosed ? 'text-muted' : 'font-medium text-heading')}>{g.isClosed ? t.hours.closedDay : g.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {social.length ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-[1rem]">{t.nav.social}</h3>
              <SocialLinks links={social} style="icons" />
            </div>
          ) : null}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-[0.8125rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{s.copyright || t.footer.copyright(year, business.name)}</p>
        </div>
      </Container>
    </footer>
  );
}
