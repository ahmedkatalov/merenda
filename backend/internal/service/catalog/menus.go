package catalog

import (
	"context"
	"strings"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/service/slug"
)

// ListMenus returns all menus.
func (s *Service) ListMenus(ctx context.Context) ([]domain.Menu, error) {
	return s.repos.Menus.List(ctx)
}

// CreateMenu validates and inserts a menu.
func (s *Service) CreateMenu(ctx context.Context, in domain.MenuInput) (domain.Menu, error) {
	m := domain.Menu{IsActive: true}
	if err := s.applyMenu(ctx, &m, in); err != nil {
		return domain.Menu{}, err
	}
	order, err := s.repos.Menus.NextSortOrder(ctx)
	if err != nil {
		return domain.Menu{}, err
	}
	m.SortOrder = order
	return s.repos.Menus.Create(ctx, m)
}

// UpdateMenu applies a partial update.
func (s *Service) UpdateMenu(ctx context.Context, id string, in domain.MenuInput) (domain.Menu, error) {
	if err := requireUUID(id); err != nil {
		return domain.Menu{}, err
	}
	m, err := s.repos.Menus.ByID(ctx, id)
	if err != nil {
		return domain.Menu{}, err
	}
	if err := s.applyMenu(ctx, &m, in); err != nil {
		return domain.Menu{}, err
	}
	return s.repos.Menus.Update(ctx, m)
}

// applyMenu merges the input into m and validates the result.
func (s *Service) applyMenu(ctx context.Context, m *domain.Menu, in domain.MenuInput) error {
	f := domain.Fields{}
	if in.Name.Valid || m.ID == "" {
		m.Name = cleanName(f, in.Name.Value)
	}
	if in.Description.Valid {
		m.Description = cleanDescription(f, in.Description.Value)
	}
	if in.Icon.Valid {
		m.Icon = strings.TrimSpace(in.Icon.Value)
		if len(m.Icon) > 60 {
			f.Add("icon", "Слишком длинное имя иконки")
		}
	}
	if in.IsActive.Valid {
		m.IsActive = in.IsActive.Value
	}
	if in.ScheduleID.Valid {
		m.ScheduleID = nil
		if in.ScheduleID.Value != nil {
			id := strings.TrimSpace(*in.ScheduleID.Value)
			ok := domain.IsUUID(id)
			if ok {
				var err error
				if ok, err = s.repos.Schedules.Exists(ctx, id); err != nil {
					return err
				}
			}
			if !ok {
				f.Add("scheduleId", "Расписание не найдено")
			} else {
				m.ScheduleID = &id
			}
		}
	}
	base := resolveSlug(f, in.Slug, m.Name, m.Slug)
	if err := f.Err(); err != nil {
		return err
	}
	if base != m.Slug || m.ID == "" {
		unique, err := slug.Unique(ctx, base, func(ctx context.Context, c string) (bool, error) {
			return s.repos.Menus.SlugExists(ctx, c, m.ID)
		})
		if err != nil {
			return err
		}
		m.Slug = unique
	}
	return nil
}

// DeleteMenu removes a menu and everything below it.
func (s *Service) DeleteMenu(ctx context.Context, id string) error {
	if err := requireUUID(id); err != nil {
		return err
	}
	return s.repos.Menus.Delete(ctx, id)
}

// ReorderMenus assigns sort order by list index.
func (s *Service) ReorderMenus(ctx context.Context, ids []string) error {
	if err := validateReorder(ids); err != nil {
		return err
	}
	return s.repos.Menus.Reorder(ctx, ids)
}
