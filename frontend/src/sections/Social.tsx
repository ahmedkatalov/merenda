import { Globe, Instagram, Link2, MessageCircle, Music2, Send, Youtube, type LucideIcon } from 'lucide-react';
import { getSectionSettings, type PageSection, type SocialLink, type SocialType } from '@merenda/shared';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/cn';
import { SOCIAL_LABELS } from '@/lib/i18n';
import { useSiteData } from '@/features/site/SiteContext';
import { SectionShell } from './SectionShell';

const ICONS: Record<SocialType, LucideIcon> = {
  instagram: Instagram,
  telegram: Send,
  vk: Globe,
  whatsapp: MessageCircle,
  youtube: Youtube,
  tiktok: Music2,
  website: Globe,
  other: Link2,
};

export function socialLabel(link: SocialLink): string {
  return link.label || SOCIAL_LABELS[link.type] || link.url;
}

export function SocialLinks({ links, style, className }: { links: SocialLink[]; style: 'icons' | 'buttons'; className?: string }) {
  if (!links.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-3', className)}>
      {links.map((link) => {
        const Icon = ICONS[link.type] ?? Link2;
        const label = socialLabel(link);
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener"
              aria-label={label}
              title={label}
              className={cn(
                'inline-flex items-center justify-center gap-2 border border-border bg-surface-solid text-heading transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-card',
                style === 'icons' ? 'size-12 rounded-full' : 'h-12 rounded-button px-5 font-semibold',
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} />
              {style === 'buttons' ? <span>{label}</span> : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function Social({ section, anchorId }: { section: PageSection; anchorId: string }) {
  const s = getSectionSettings<'social'>(section);
  const { site } = useSiteData();
  const links = site.contacts.social.filter((l) => l.url);
  if (!links.length) return null;
  return (
    <SectionShell section={section} anchorId={anchorId} belowFold>
      <Container className="flex flex-col items-center text-center">
        <Reveal>
          <SectionHeading title={s.title} align="center" className="mb-6" />
        </Reveal>
        <Reveal delay={0.05}>
          <SocialLinks links={links} style={s.style} className="justify-center" />
        </Reveal>
      </Container>
    </SectionShell>
  );
}
