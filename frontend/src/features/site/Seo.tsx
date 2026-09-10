import { useEffect } from 'react';
import { mediaUrl } from '@/lib/api';
import { openingHoursSpecification, venueSchedule } from '@/lib/schedule';
import { useSiteData } from './SiteContext';

function upsertMeta(attr: 'name' | 'property', key: string, content: string | null): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string | null, extra?: Record<string, string>): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][data-managed]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    el.dataset.managed = '1';
    document.head.appendChild(el);
  }
  el.href = href;
  if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
}

function letterFavicon(letter: string, bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="43" font-family="Georgia, serif" font-size="34" font-weight="600" text-anchor="middle" fill="${fg}">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function toAbsolute(url: string): string {
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

/** Manages <head>: title, meta, canonical, favicon, theme-color, JSON-LD. */
export function Seo() {
  const { site, media } = useSiteData();
  const { seo, business, contacts, theme, schedules } = site;

  useEffect(() => {
    const title = seo.title || business.name;
    document.title = title;
    upsertMeta('name', 'description', seo.description || business.description || null);
    upsertMeta('name', 'keywords', seo.keywords || null);
    upsertMeta('name', 'robots', seo.robotsIndex ? 'index,follow' : 'noindex,nofollow');
    upsertMeta('name', 'theme-color', theme.colors.background);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', business.name);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', seo.description || business.description || null);
    upsertMeta('property', 'og:locale', 'ru_RU');
    const canonical = seo.canonicalUrl || window.location.origin;
    upsertMeta('property', 'og:url', canonical);
    upsertLink('canonical', canonical);

    const og = media(seo.ogImageId);
    upsertMeta('property', 'og:image', og ? toAbsolute(mediaUrl(og.mediumUrl || og.url)) : null);

    const favicon = media(business.faviconId);
    const letter = (business.name.trim().charAt(0) || '•').toUpperCase();
    upsertLink('icon', favicon ? mediaUrl(favicon.thumbUrl || favicon.url) : letterFavicon(letter, theme.colors.primary, theme.colors.onPrimary));
  }, [seo, business, theme, media]);

  useEffect(() => {
    const id = 'ld-restaurant';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const venue = venueSchedule(schedules);
    const logo = media(business.logoId);
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: business.name,
      description: seo.description || business.description || undefined,
      url: seo.canonicalUrl || window.location.origin,
      telephone: contacts.phone || undefined,
      email: contacts.email || undefined,
      image: logo ? toAbsolute(mediaUrl(logo.url)) : undefined,
      address: contacts.address ? { '@type': 'PostalAddress', streetAddress: contacts.address } : undefined,
      openingHoursSpecification: venue ? openingHoursSpecification(venue.hours) : undefined,
      servesCuisine: undefined,
    };
    script.textContent = JSON.stringify(data);
  }, [business, contacts, schedules, seo, media]);

  return null;
}
