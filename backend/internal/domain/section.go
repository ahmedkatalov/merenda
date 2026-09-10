package domain

import (
	"encoding/json"
	"time"
)

// SectionTypes mirrors `SECTION_TYPES` in packages/shared/src/types.ts.
var SectionTypes = []string{
	"header", "hero", "menu", "recommended", "promotions", "about",
	"gallery", "hours", "contacts", "social", "footer",
}

// SectionLocked reports whether the type is pinned (header/footer).
func SectionLocked(t string) bool { return t == "header" || t == "footer" }

// SectionUnique reports whether only one instance of the type may exist.
func SectionUnique(t string) bool { return t != "promotions" && t != "gallery" }

// ValidSectionType reports whether t is a known section type.
func ValidSectionType(t string) bool {
	for _, s := range SectionTypes {
		if s == t {
			return true
		}
	}
	return false
}

// PageSection mirrors `PageSection`.
type PageSection struct {
	ID        string          `json:"id"`
	Type      string          `json:"type"`
	Title     string          `json:"title"`
	IsEnabled bool            `json:"isEnabled"`
	SortOrder int             `json:"sortOrder"`
	IsLocked  bool            `json:"isLocked"`
	Settings  json.RawMessage `json:"settings"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}
