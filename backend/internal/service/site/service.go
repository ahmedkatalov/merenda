// Package site assembles the public read models: bootstrap, menu, status,
// robots.txt and sitemap.xml.
package site

import (
	"context"
	"fmt"
	"html"
	"strings"
	"time"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/hours"
	"merenda/backend/internal/service/settings"
)

// Service builds public responses from the repositories.
type Service struct {
	repos     *repo.Repos
	settings  *settings.Service
	publicURL string
	now       func() time.Time
}

// New creates the service. publicURL is PUBLIC_SITE_URL without a trailing slash.
func New(repos *repo.Repos, settings *settings.Service, publicURL string) *Service {
	return &Service{repos: repos, settings: settings, publicURL: strings.TrimRight(publicURL, "/"), now: time.Now}
}

// Status computes the current SiteStatus.
func (s *Service) Status(ctx context.Context) (domain.SiteStatus, error) {
	sm, err := s.settings.Load(ctx)
	if err != nil {
		return domain.SiteStatus{}, err
	}
	status, _, err := s.statusFor(ctx, sm)
	return status, err
}

// StatusFor computes the SiteStatus for already loaded settings.
func (s *Service) StatusFor(ctx context.Context, sm domain.SettingsMap) (domain.SiteStatus, error) {
	status, _, err := s.statusFor(ctx, sm)
	return status, err
}

func (s *Service) statusFor(ctx context.Context, sm domain.SettingsMap) (domain.SiteStatus, []domain.Schedule, error) {
	schedules, err := s.repos.Schedules.List(ctx)
	if err != nil {
		return domain.SiteStatus{}, nil, err
	}
	status := hours.Compute(hours.Input{Schedules: schedules, Status: sm.Status, Timezone: sm.Business.Timezone, Now: s.now()})
	return status, schedules, nil
}

// Bootstrap builds `SiteBootstrap`: settings, enabled sections, schedules,
// status and every media object they reference.
func (s *Service) Bootstrap(ctx context.Context) (domain.SiteBootstrap, error) {
	sm, err := s.settings.Load(ctx)
	if err != nil {
		return domain.SiteBootstrap{}, err
	}
	sections, err := s.repos.Sections.ListEnabled(ctx)
	if err != nil {
		return domain.SiteBootstrap{}, err
	}
	status, schedules, err := s.statusFor(ctx, sm)
	if err != nil {
		return domain.SiteBootstrap{}, err
	}

	refs := map[string]struct{}{}
	addRef(refs, sm.Business.LogoID)
	addRef(refs, sm.Business.FaviconID)
	addRef(refs, sm.Seo.OgImageID)
	for _, sec := range sections {
		collectUUIDs(sec.Settings, refs)
	}
	ids := make([]string, 0, len(refs))
	for id := range refs {
		ids = append(ids, id)
	}
	media, err := s.repos.Media.ByIDs(ctx, ids)
	if err != nil {
		return domain.SiteBootstrap{}, err
	}

	public := make([]domain.PublicSchedule, 0, len(schedules))
	for _, sch := range schedules {
		public = append(public, domain.PublicSchedule{ID: sch.ID, Key: sch.Key, Name: sch.Name, Kind: sch.Kind, Hours: sch.Hours})
	}
	return domain.SiteBootstrap{
		Business:  sm.Business,
		Contacts:  sm.Contacts,
		Orders:    sm.Orders.Public(),
		Seo:       sm.Seo,
		Theme:     sm.Theme,
		Sections:  sections,
		Schedules: public,
		Status:    status,
		Media:     media,
	}, nil
}

// Menu builds `PublicMenuResponse`: active menus → active categories → visible products.
func (s *Service) Menu(ctx context.Context) (domain.PublicMenuResponse, error) {
	menus, err := s.repos.Menus.ListActive(ctx)
	if err != nil {
		return domain.PublicMenuResponse{}, err
	}
	out := domain.PublicMenuResponse{Menus: make([]domain.PublicMenu, 0, len(menus))}
	if len(menus) == 0 {
		return out, nil
	}
	menuIDs := make([]string, 0, len(menus))
	for _, m := range menus {
		menuIDs = append(menuIDs, m.ID)
	}
	categories, err := s.repos.Categories.ListActiveForMenus(ctx, menuIDs)
	if err != nil {
		return domain.PublicMenuResponse{}, err
	}
	catIDs := make([]string, 0, len(categories))
	for _, c := range categories {
		catIDs = append(catIDs, c.ID)
	}
	var products []domain.Product
	if len(catIDs) > 0 {
		if products, err = s.repos.Products.ListVisibleForCategories(ctx, catIDs); err != nil {
			return domain.PublicMenuResponse{}, err
		}
	}
	byCategory := map[string][]domain.Product{}
	for _, p := range products {
		byCategory[p.CategoryID] = append(byCategory[p.CategoryID], p)
	}
	byMenu := map[string][]domain.PublicCategory{}
	for _, c := range categories {
		items := byCategory[c.ID]
		if items == nil {
			items = []domain.Product{}
		}
		byMenu[c.MenuID] = append(byMenu[c.MenuID], domain.PublicCategory{Category: c, Products: items})
	}
	for _, m := range menus {
		cats := byMenu[m.ID]
		if cats == nil {
			cats = []domain.PublicCategory{}
		}
		out.Menus = append(out.Menus, domain.PublicMenu{Menu: m, Categories: cats})
	}
	return out, nil
}

// Robots renders robots.txt from seo.robotsIndex.
func (s *Service) Robots(ctx context.Context) (string, error) {
	sm, err := s.settings.Load(ctx)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	b.WriteString("User-agent: *\n")
	if sm.Seo.RobotsIndex {
		b.WriteString("Allow: /\nDisallow: /api/\n")
	} else {
		b.WriteString("Disallow: /\n")
	}
	b.WriteString("\nSitemap: " + s.publicURL + "/sitemap.xml\n")
	return b.String(), nil
}

// Sitemap renders a single-URL sitemap with lastmod = latest product/settings change.
func (s *Service) Sitemap(ctx context.Context) (string, error) {
	lastmod := s.now().UTC().Format("2006-01-02")
	latest := ""
	for _, fn := range []func(context.Context) (*string, error){s.repos.Products.LatestUpdate, s.repos.Settings.LatestUpdate} {
		ts, err := fn(ctx)
		if err != nil {
			return "", err
		}
		if ts != nil && *ts > latest {
			latest = *ts
		}
	}
	if latest != "" {
		lastmod = latest
	}
	loc := html.EscapeString(s.publicURL + "/")
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`, loc, lastmod), nil
}
