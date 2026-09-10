package catalog

import (
	"context"
	"errors"
	"strings"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/service/slug"
)

// ListCategories returns categories, optionally for one menu.
func (s *Service) ListCategories(ctx context.Context, menuID string) ([]domain.Category, error) {
	if menuID != "" && !domain.IsUUID(menuID) {
		return []domain.Category{}, nil
	}
	return s.repos.Categories.List(ctx, menuID)
}

// CreateCategory validates and inserts a category.
func (s *Service) CreateCategory(ctx context.Context, in domain.CategoryInput) (domain.Category, error) {
	c := domain.Category{IsActive: true}
	if !in.MenuID.Valid {
		return domain.Category{}, domain.NewValidation("menuId", "Выберите меню")
	}
	if err := s.applyCategory(ctx, &c, in); err != nil {
		return domain.Category{}, err
	}
	order, err := s.repos.Categories.NextSortOrder(ctx, c.MenuID)
	if err != nil {
		return domain.Category{}, err
	}
	c.SortOrder = order
	return s.repos.Categories.Create(ctx, c)
}

// UpdateCategory applies a partial update.
func (s *Service) UpdateCategory(ctx context.Context, id string, in domain.CategoryInput) (domain.Category, error) {
	if err := requireUUID(id); err != nil {
		return domain.Category{}, err
	}
	c, err := s.repos.Categories.ByID(ctx, id)
	if err != nil {
		return domain.Category{}, err
	}
	if err := s.applyCategory(ctx, &c, in); err != nil {
		return domain.Category{}, err
	}
	return s.repos.Categories.Update(ctx, c)
}

func (s *Service) applyCategory(ctx context.Context, c *domain.Category, in domain.CategoryInput) error {
	f := domain.Fields{}
	if in.MenuID.Valid {
		menuID := strings.TrimSpace(in.MenuID.Value)
		if !domain.IsUUID(menuID) {
			f.Add("menuId", "Меню не найдено")
		} else if _, err := s.repos.Menus.ByID(ctx, menuID); err != nil {
			if !errors.Is(err, domain.ErrNotFound) {
				return err
			}
			f.Add("menuId", "Меню не найдено")
		} else {
			c.MenuID = menuID
		}
	}
	if in.Name.Valid || c.ID == "" {
		c.Name = cleanName(f, in.Name.Value)
	}
	if in.Description.Valid {
		c.Description = cleanDescription(f, in.Description.Value)
	}
	if in.IsActive.Valid {
		c.IsActive = in.IsActive.Value
	}
	if in.ImageID.Valid {
		id, err := s.mediaRef(ctx, f, "imageId", in.ImageID.Value)
		if err != nil {
			return err
		}
		c.ImageID = id
	}
	base := resolveSlug(f, in.Slug, c.Name, c.Slug)
	if err := f.Err(); err != nil {
		return err
	}
	if base != c.Slug || c.ID == "" || in.MenuID.Valid {
		unique, err := slug.Unique(ctx, base, func(ctx context.Context, cand string) (bool, error) {
			return s.repos.Categories.SlugExists(ctx, c.MenuID, cand, c.ID)
		})
		if err != nil {
			return err
		}
		c.Slug = unique
	}
	return nil
}

// DeleteCategory removes a category and its products.
func (s *Service) DeleteCategory(ctx context.Context, id string) error {
	if err := requireUUID(id); err != nil {
		return err
	}
	return s.repos.Categories.Delete(ctx, id)
}

// ReorderCategories assigns sort order by list index.
func (s *Service) ReorderCategories(ctx context.Context, ids []string) error {
	if err := validateReorder(ids); err != nil {
		return err
	}
	return s.repos.Categories.Reorder(ctx, ids)
}
