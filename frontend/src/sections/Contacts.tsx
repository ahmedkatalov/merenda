import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { getSectionSettings, type PageSection } from '@merenda/shared';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { t } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[0.75rem] font-semibold tracking-wider text-muted uppercase">{label}</p>
        <div className="mt-0.5 text-[1.0625rem] text-heading">{children}</div>
      </div>
    </div>
  );
}

export default function Contacts({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'contacts'>(section);
  const { site } = useSiteData();
  const c = site.contacts;
  const whatsapp = c.social.find((l) => l.type === 'whatsapp' && l.url);
  const showPhone = s.showPhone && c.phone;
  const showEmail = s.showEmail && c.email;
  const showAddress = s.showAddress && c.address;
  const showWhatsapp = s.showWhatsapp && whatsapp;
  const showMap = s.showMap && c.mapEmbedUrl;
  if (!showPhone && !showEmail && !showAddress && !showWhatsapp && !showMap) return null;

  return (
    <SectionShell section={section} anchorId={anchorId} belowFold className="bg-surface-alt/40">
      <Container>
        <Reveal>
          <SectionHeading title={s.title} />
        </Reveal>
        <div className={showMap ? 'grid gap-6 md:grid-cols-2 md:gap-8' : ''}>
          <Reveal className="card-surface flex flex-col gap-6 p-6 md:p-8">
            {showPhone ? (
              <Row icon={<Phone className="size-5" strokeWidth={1.75} />} label={t.contacts.phone}>
                <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="font-medium hover:text-primary">{c.phone}</a>
              </Row>
            ) : null}
            {showEmail ? (
              <Row icon={<Mail className="size-5" strokeWidth={1.75} />} label={t.contacts.email}>
                <a href={`mailto:${c.email}`} className="font-medium break-all hover:text-primary">{c.email}</a>
              </Row>
            ) : null}
            {showAddress ? (
              <Row icon={<MapPin className="size-5" strokeWidth={1.75} />} label={t.contacts.address}>
                <p className="font-medium">{c.address}</p>
                {c.addressNote ? <p className="text-[0.9375rem] text-muted">{c.addressNote}</p> : null}
                {c.mapUrl ? (
                  <a href={c.mapUrl} target="_blank" rel="noopener" className="mt-1 inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-primary hover:underline">
                    {t.contacts.openMap}
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
              </Row>
            ) : null}
            {showWhatsapp ? (
              <ButtonLink href={whatsapp.url} target="_blank" rel="noopener" size="lg" className="mt-1 self-start">
                <MessageCircle className="size-5" />
                {t.contacts.whatsapp}
              </ButtonLink>
            ) : null}
          </Reveal>
          {showMap ? (
            <Reveal delay={0.08} className="overflow-hidden rounded-card border border-border shadow-card">
              <iframe
                src={c.mapEmbedUrl}
                title={t.contacts.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="block aspect-[4/3] w-full border-0 md:h-full md:min-h-[22rem]"
              />
            </Reveal>
          ) : null}
        </div>
      </Container>
    </SectionShell>
  );
}
