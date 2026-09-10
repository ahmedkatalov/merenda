package domain

// Write payloads for the admin API. Every field is Optional so the same struct
// serves both POST (create) and PATCH (partial update); services decide which
// fields are required on create.

// MenuInput mirrors `MenuInput` / `Partial<MenuInput>`.
type MenuInput struct {
	Name        Optional[string]  `json:"name"`
	Slug        Optional[string]  `json:"slug"`
	Description Optional[string]  `json:"description"`
	Icon        Optional[string]  `json:"icon"`
	IsActive    Optional[bool]    `json:"isActive"`
	ScheduleID  Optional[*string] `json:"scheduleId"`
}

// CategoryInput mirrors `CategoryInput` / `Partial<CategoryInput>`.
type CategoryInput struct {
	MenuID      Optional[string]  `json:"menuId"`
	Name        Optional[string]  `json:"name"`
	Slug        Optional[string]  `json:"slug"`
	Description Optional[string]  `json:"description"`
	ImageID     Optional[*string] `json:"imageId"`
	IsActive    Optional[bool]    `json:"isActive"`
}

// ProductInput mirrors `ProductInput` / `Partial<ProductInput>`.
type ProductInput struct {
	CategoryID    Optional[string]             `json:"categoryId"`
	Name          Optional[string]             `json:"name"`
	Slug          Optional[string]             `json:"slug"`
	Description   Optional[string]             `json:"description"`
	PriceMinor    Optional[int64]              `json:"priceMinor"`
	OldPriceMinor Optional[*int64]             `json:"oldPriceMinor"`
	ImageID       Optional[*string]            `json:"imageId"`
	GifID         Optional[*string]            `json:"gifId"`
	Availability  Optional[Availability]       `json:"availability"`
	IsPopular     Optional[bool]               `json:"isPopular"`
	IsRecommended Optional[bool]               `json:"isRecommended"`
	IsNew         Optional[bool]               `json:"isNew"`
	Tags          Optional[[]string]           `json:"tags"`
	Attributes    Optional[[]ProductAttribute] `json:"attributes"`
}

// SectionInput mirrors `SectionInput`.
type SectionInput struct {
	Type      string                   `json:"type"`
	Title     Optional[string]         `json:"title"`
	IsEnabled Optional[bool]           `json:"isEnabled"`
	Settings  Optional[map[string]any] `json:"settings"`
}

// SectionPatch mirrors `SectionPatch`.
type SectionPatch struct {
	Title     Optional[string]         `json:"title"`
	IsEnabled Optional[bool]           `json:"isEnabled"`
	Settings  Optional[map[string]any] `json:"settings"`
}
