// Package sections implements the site builder's page sections.
package sections

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
)

// Service validates and persists page sections.
type Service struct {
	repos *repo.Repos
}

// New creates the service.
func New(repos *repo.Repos) *Service { return &Service{repos: repos} }

// defaultTitles mirrors the labels in packages/shared/src/sections.ts.
var defaultTitles = map[string]string{
	"header": "Шапка", "hero": "Главный экран", "menu": "Меню", "recommended": "Рекомендуем",
	"promotions": "Акции", "about": "О заведении", "gallery": "Галерея", "hours": "Режим работы",
	"contacts": "Контакты", "social": "Соцсети", "footer": "Подвал",
}

// List returns all sections, including disabled ones.
func (s *Service) List(ctx context.Context) ([]domain.PageSection, error) {
	return s.repos.Sections.List(ctx)
}

// Create adds a section, enforcing unique types.
func (s *Service) Create(ctx context.Context, in domain.SectionInput) (domain.PageSection, error) {
	if !domain.ValidSectionType(in.Type) {
		return domain.PageSection{}, domain.NewValidation("type", "Неизвестный тип секции")
	}
	if domain.SectionUnique(in.Type) {
		exists, err := s.repos.Sections.TypeExists(ctx, in.Type)
		if err != nil {
			return domain.PageSection{}, err
		}
		if exists {
			return domain.PageSection{}, domain.Conflict("Секция этого типа уже добавлена")
		}
	}
	sec := domain.PageSection{Type: in.Type, Title: defaultTitles[in.Type], IsEnabled: true, IsLocked: domain.SectionLocked(in.Type), Settings: json.RawMessage("{}")}
	f := domain.Fields{}
	applyPatch(f, &sec, domain.SectionPatch{Title: in.Title, IsEnabled: in.IsEnabled, Settings: in.Settings})
	if err := f.Err(); err != nil {
		return domain.PageSection{}, err
	}
	order, err := s.repos.Sections.NextSortOrder(ctx)
	if err != nil {
		return domain.PageSection{}, err
	}
	sec.SortOrder = order
	created, err := s.repos.Sections.Create(ctx, sec)
	if err != nil {
		return domain.PageSection{}, err
	}
	// Keep the footer last after inserting before it.
	if err := s.normalizeOrder(ctx, nil); err != nil {
		return domain.PageSection{}, err
	}
	return s.repos.Sections.ByID(ctx, created.ID)
}

// Patch updates title, enabled flag and settings.
func (s *Service) Patch(ctx context.Context, id string, in domain.SectionPatch) (domain.PageSection, error) {
	if !domain.IsUUID(id) {
		return domain.PageSection{}, domain.ErrNotFound
	}
	sec, err := s.repos.Sections.ByID(ctx, id)
	if err != nil {
		return domain.PageSection{}, err
	}
	f := domain.Fields{}
	applyPatch(f, &sec, in)
	if err := f.Err(); err != nil {
		return domain.PageSection{}, err
	}
	return s.repos.Sections.Update(ctx, sec)
}

func applyPatch(f domain.Fields, sec *domain.PageSection, in domain.SectionPatch) {
	if in.Title.Valid {
		sec.Title = strings.TrimSpace(in.Title.Value)
		if sec.Title == "" {
			sec.Title = defaultTitles[sec.Type]
		}
		if len([]rune(sec.Title)) > 120 {
			f.Add("title", "Слишком длинное название")
		}
	}
	if in.IsEnabled.Valid {
		sec.IsEnabled = in.IsEnabled.Value
	}
	if in.Settings.Valid {
		settings := in.Settings.Value
		if settings == nil {
			settings = map[string]any{}
		}
		encoded, err := json.Marshal(settings)
		if err != nil {
			f.Add("settings", "Некорректные настройки")
			return
		}
		if len(encoded) > 256*1024 {
			f.Add("settings", "Настройки секции слишком большие")
			return
		}
		sec.Settings = encoded
	}
}

// Delete removes a non-locked section.
func (s *Service) Delete(ctx context.Context, id string) error {
	if !domain.IsUUID(id) {
		return domain.ErrNotFound
	}
	sec, err := s.repos.Sections.ByID(ctx, id)
	if err != nil {
		return err
	}
	if sec.IsLocked || domain.SectionLocked(sec.Type) {
		return domain.Conflict("Эту секцию нельзя удалить")
	}
	return s.repos.Sections.Delete(ctx, id)
}

// Reorder applies the given order; header stays first and footer last regardless of the list.
func (s *Service) Reorder(ctx context.Context, ids []string) error {
	for _, id := range ids {
		if !domain.IsUUID(id) {
			return domain.NewValidation("ids", "Некорректный идентификатор")
		}
	}
	return s.normalizeOrder(ctx, ids)
}

// normalizeOrder rewrites sort_order for every section: header, requested ids, the rest, footer.
func (s *Service) normalizeOrder(ctx context.Context, requested []string) error {
	all, err := s.repos.Sections.List(ctx)
	if err != nil {
		return err
	}
	byID := make(map[string]domain.PageSection, len(all))
	for _, sec := range all {
		byID[sec.ID] = sec
	}
	var header, footer []string
	middle := make([]string, 0, len(all))
	placed := map[string]bool{}
	place := func(sec domain.PageSection) {
		if placed[sec.ID] {
			return
		}
		placed[sec.ID] = true
		switch sec.Type {
		case "header":
			header = append(header, sec.ID)
		case "footer":
			footer = append(footer, sec.ID)
		default:
			middle = append(middle, sec.ID)
		}
	}
	for _, id := range requested {
		if sec, ok := byID[id]; ok {
			place(sec)
		}
	}
	for _, sec := range all {
		place(sec)
	}
	ordered := append(append(header, middle...), footer...)
	return s.repos.Tx(ctx, func(ctx context.Context, tx pgx.Tx) error {
		if err := s.repos.Sections.WithTx(tx).Reorder(ctx, ordered); err != nil {
			return fmt.Errorf("reorder sections: %w", err)
		}
		return nil
	})
}
