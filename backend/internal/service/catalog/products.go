package catalog

import (
	"context"
	"errors"
	"strings"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/service/slug"
)

// ListProducts returns the admin list view.
func (s *Service) ListProducts(ctx context.Context, q domain.ProductQuery) ([]domain.ProductListItem, error) {
	if (q.MenuID != "" && !domain.IsUUID(q.MenuID)) || (q.CategoryID != "" && !domain.IsUUID(q.CategoryID)) {
		return []domain.ProductListItem{}, nil
	}
	if q.Availability != "" && !domain.ValidAvailability(domain.Availability(q.Availability)) {
		return nil, domain.NewValidation("availability", "Недопустимое значение")
	}
	return s.repos.Products.List(ctx, q)
}

// GetProduct loads one product.
func (s *Service) GetProduct(ctx context.Context, id string) (domain.Product, error) {
	if err := requireUUID(id); err != nil {
		return domain.Product{}, err
	}
	return s.repos.Products.ByID(ctx, id)
}

// CreateProduct validates and inserts a product.
func (s *Service) CreateProduct(ctx context.Context, in domain.ProductInput) (domain.Product, error) {
	p := domain.Product{Availability: domain.Available, Tags: []string{}, Attributes: []domain.ProductAttribute{}}
	f := domain.Fields{}
	if !in.CategoryID.Valid {
		f.Add("categoryId", "Выберите категорию")
	}
	if !in.PriceMinor.Valid {
		f.Add("priceMinor", "Укажите цену")
	}
	if err := f.Err(); err != nil {
		return domain.Product{}, err
	}
	if err := s.applyProduct(ctx, &p, in); err != nil {
		return domain.Product{}, err
	}
	order, err := s.repos.Products.NextSortOrder(ctx, p.CategoryID)
	if err != nil {
		return domain.Product{}, err
	}
	p.SortOrder = order
	return s.repos.Products.Create(ctx, p)
}

// UpdateProduct applies a partial update.
func (s *Service) UpdateProduct(ctx context.Context, id string, in domain.ProductInput) (domain.Product, error) {
	if err := requireUUID(id); err != nil {
		return domain.Product{}, err
	}
	p, err := s.repos.Products.ByID(ctx, id)
	if err != nil {
		return domain.Product{}, err
	}
	if err := s.applyProduct(ctx, &p, in); err != nil {
		return domain.Product{}, err
	}
	return s.repos.Products.Update(ctx, p)
}

func (s *Service) applyProduct(ctx context.Context, p *domain.Product, in domain.ProductInput) error {
	f := domain.Fields{}
	if in.CategoryID.Valid {
		categoryID := strings.TrimSpace(in.CategoryID.Value)
		if !domain.IsUUID(categoryID) {
			f.Add("categoryId", "Категория не найдена")
		} else if _, err := s.repos.Categories.ByID(ctx, categoryID); err != nil {
			if !errors.Is(err, domain.ErrNotFound) {
				return err
			}
			f.Add("categoryId", "Категория не найдена")
		} else {
			p.CategoryID = categoryID
		}
	}
	if in.Name.Valid || p.ID == "" {
		p.Name = cleanName(f, in.Name.Value)
	}
	if in.Description.Valid {
		p.Description = cleanDescription(f, in.Description.Value)
	}
	if in.PriceMinor.Valid {
		p.PriceMinor = in.PriceMinor.Value
		if p.PriceMinor < 0 {
			f.Add("priceMinor", "Цена не может быть отрицательной")
		}
	}
	if in.OldPriceMinor.Valid {
		p.OldPriceMinor = in.OldPriceMinor.Value
		if p.OldPriceMinor != nil && *p.OldPriceMinor < 0 {
			f.Add("oldPriceMinor", "Старая цена не может быть отрицательной")
		}
	}
	if in.Availability.Valid {
		if !domain.ValidAvailability(in.Availability.Value) {
			f.Add("availability", "Допустимые значения: available, unavailable, hidden")
		} else {
			p.Availability = in.Availability.Value
		}
	}
	if in.IsPopular.Valid {
		p.IsPopular = in.IsPopular.Value
	}
	if in.IsRecommended.Valid {
		p.IsRecommended = in.IsRecommended.Value
	}
	if in.IsNew.Valid {
		p.IsNew = in.IsNew.Value
	}
	if in.Tags.Valid {
		p.Tags = cleanTags(f, in.Tags.Value)
	}
	if in.Attributes.Valid {
		p.Attributes = cleanAttributes(f, in.Attributes.Value)
	}
	for field, opt := range map[string]domain.Optional[*string]{"imageId": in.ImageID, "gifId": in.GifID} {
		if !opt.Valid {
			continue
		}
		id, err := s.mediaRef(ctx, f, field, opt.Value)
		if err != nil {
			return err
		}
		if field == "imageId" {
			p.ImageID = id
		} else {
			p.GifID = id
		}
	}
	base := resolveSlug(f, in.Slug, p.Name, p.Slug)
	if err := f.Err(); err != nil {
		return err
	}
	if base != p.Slug || p.ID == "" || in.CategoryID.Valid {
		unique, err := slug.Unique(ctx, base, func(ctx context.Context, cand string) (bool, error) {
			return s.repos.Products.SlugExists(ctx, p.CategoryID, cand, p.ID)
		})
		if err != nil {
			return err
		}
		p.Slug = unique
	}
	return nil
}

func cleanTags(f domain.Fields, tags []string) []string {
	out := make([]string, 0, len(tags))
	seen := map[string]struct{}{}
	for _, t := range tags {
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		if len([]rune(t)) > maxTagLen {
			f.Add("tags", "Слишком длинный тег")
			continue
		}
		key := strings.ToLower(t)
		if _, dup := seen[key]; dup {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, t)
	}
	if len(out) > maxTags {
		f.Add("tags", "Не более 20 тегов")
	}
	return out
}

func cleanAttributes(f domain.Fields, attrs []domain.ProductAttribute) []domain.ProductAttribute {
	out := make([]domain.ProductAttribute, 0, len(attrs))
	for _, a := range attrs {
		a.Label, a.Value = strings.TrimSpace(a.Label), strings.TrimSpace(a.Value)
		if a.Label == "" && a.Value == "" {
			continue
		}
		if a.Label == "" {
			f.Add("attributes", "Укажите название характеристики")
		}
		if len([]rune(a.Label)) > 60 || len([]rune(a.Value)) > 120 {
			f.Add("attributes", "Слишком длинное значение характеристики")
		}
		out = append(out, a)
	}
	if len(out) > maxAttributes {
		f.Add("attributes", "Не более 30 характеристик")
	}
	return out
}

// SetAvailability toggles the availability of a product.
func (s *Service) SetAvailability(ctx context.Context, id string, a domain.Availability) (domain.Product, error) {
	if err := requireUUID(id); err != nil {
		return domain.Product{}, err
	}
	if !domain.ValidAvailability(a) {
		return domain.Product{}, domain.NewValidation("availability", "Допустимые значения: available, unavailable, hidden")
	}
	return s.repos.Products.SetAvailability(ctx, id, a)
}

// DeleteProduct removes a product.
func (s *Service) DeleteProduct(ctx context.Context, id string) error {
	if err := requireUUID(id); err != nil {
		return err
	}
	return s.repos.Products.Delete(ctx, id)
}

// ReorderProducts assigns sort order by list index.
func (s *Service) ReorderProducts(ctx context.Context, ids []string) error {
	if err := validateReorder(ids); err != nil {
		return err
	}
	return s.repos.Products.Reorder(ctx, ids)
}
