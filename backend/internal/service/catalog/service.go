// Package catalog implements admin CRUD for menus, categories and products.
package catalog

import (
	"context"
	"errors"
	"strings"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/slug"
)

// Service validates and persists the menu structure.
type Service struct {
	repos *repo.Repos
}

// New creates the service.
func New(repos *repo.Repos) *Service { return &Service{repos: repos} }

const (
	maxNameLen        = 160
	maxDescriptionLen = 2000
	maxTags           = 20
	maxTagLen         = 40
	maxAttributes     = 30
)

// validateReorder checks a ReorderRequest payload.
func validateReorder(ids []string) error {
	if len(ids) == 0 {
		return domain.NewValidation("ids", "Список идентификаторов пуст")
	}
	seen := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		if !domain.IsUUID(id) {
			return domain.NewValidation("ids", "Некорректный идентификатор")
		}
		if _, dup := seen[id]; dup {
			return domain.NewValidation("ids", "Идентификаторы повторяются")
		}
		seen[id] = struct{}{}
	}
	return nil
}

// cleanName trims and validates a required display name.
func cleanName(f domain.Fields, name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		f.Add("name", "Укажите название")
	} else if len([]rune(name)) > maxNameLen {
		f.Add("name", "Слишком длинное название")
	}
	return name
}

func cleanDescription(f domain.Fields, desc string) string {
	desc = strings.TrimSpace(desc)
	if len([]rune(desc)) > maxDescriptionLen {
		f.Add("description", "Слишком длинное описание")
	}
	return desc
}

// resolveSlug returns the explicit slug (normalized) or one derived from name.
func resolveSlug(f domain.Fields, explicit domain.Optional[string], name, current string) string {
	if explicit.Valid {
		s := slug.Make(explicit.Value, "")
		if s == "" {
			f.Add("slug", "Некорректный slug: используйте латинские буквы, цифры и дефис")
		}
		return s
	}
	if current != "" {
		return current
	}
	return slug.Make(name, "item")
}

// mediaRef validates an optional media reference and reports missing files on the field.
func (s *Service) mediaRef(ctx context.Context, f domain.Fields, field string, id *string) (*string, error) {
	if id == nil {
		return nil, nil
	}
	if !domain.IsUUID(*id) {
		f.Add(field, "Файл не найден")
		return nil, nil
	}
	_, err := s.repos.Media.ByID(ctx, *id)
	if errors.Is(err, domain.ErrNotFound) {
		f.Add(field, "Файл не найден")
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return id, nil
}

// requireUUID turns a malformed path id into a 404 without hitting the database.
func requireUUID(id string) error {
	if !domain.IsUUID(id) {
		return domain.ErrNotFound
	}
	return nil
}
