package domain

import "time"

type Availability string

const (
	Available   Availability = "available"
	Unavailable Availability = "unavailable"
	Hidden      Availability = "hidden"
)

// AvailabilityValues lists every accepted availability value.
var AvailabilityValues = []Availability{Available, Unavailable, Hidden}

// ValidAvailability reports whether v is one of the enum values.
func ValidAvailability(v Availability) bool {
	for _, a := range AvailabilityValues {
		if a == v {
			return true
		}
	}
	return false
}

// Menu mirrors `Menu`.
type Menu struct {
	ID          string    `json:"id"`
	Slug        string    `json:"slug"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	SortOrder   int       `json:"sortOrder"`
	IsActive    bool      `json:"isActive"`
	ScheduleID  *string   `json:"scheduleId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Category mirrors `Category`.
type Category struct {
	ID          string    `json:"id"`
	MenuID      string    `json:"menuId"`
	Slug        string    `json:"slug"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	ImageID     *string   `json:"imageId"`
	Image       *Media    `json:"image"`
	SortOrder   int       `json:"sortOrder"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ProductAttribute mirrors `ProductAttribute`.
type ProductAttribute struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

// Product mirrors `Product`.
type Product struct {
	ID            string             `json:"id"`
	CategoryID    string             `json:"categoryId"`
	Slug          string             `json:"slug"`
	Name          string             `json:"name"`
	Description   string             `json:"description"`
	PriceMinor    int64              `json:"priceMinor"`
	OldPriceMinor *int64             `json:"oldPriceMinor"`
	ImageID       *string            `json:"imageId"`
	Image         *Media             `json:"image"`
	GifID         *string            `json:"gifId"`
	Gif           *Media             `json:"gif"`
	Availability  Availability       `json:"availability"`
	IsPopular     bool               `json:"isPopular"`
	IsRecommended bool               `json:"isRecommended"`
	IsNew         bool               `json:"isNew"`
	Tags          []string           `json:"tags"`
	Attributes    []ProductAttribute `json:"attributes"`
	SortOrder     int                `json:"sortOrder"`
	CreatedAt     time.Time          `json:"createdAt"`
	UpdatedAt     time.Time          `json:"updatedAt"`
}

// ProductListItem mirrors `ProductListItem` (admin list view).
type ProductListItem struct {
	Product
	CategoryName string `json:"categoryName"`
	MenuID       string `json:"menuId"`
	MenuName     string `json:"menuName"`
}

// ProductQuery filters the admin product list.
type ProductQuery struct {
	MenuID       string
	CategoryID   string
	Availability string
	Q            string
}

// PublicCategory mirrors `PublicCategory`.
type PublicCategory struct {
	Category
	Products []Product `json:"products"`
}

// PublicMenu mirrors `PublicMenu`.
type PublicMenu struct {
	Menu
	Categories []PublicCategory `json:"categories"`
}

// PublicMenuResponse mirrors `PublicMenuResponse`.
type PublicMenuResponse struct {
	Menus []PublicMenu `json:"menus"`
}

// ReorderRequest mirrors `ReorderRequest`.
type ReorderRequest struct {
	IDs []string `json:"ids"`
}
