package domain

import "time"

type MediaKind string

const (
	MediaImage MediaKind = "image"
	MediaGIF   MediaKind = "gif"
)

// Media mirrors `Media` in packages/shared/src/types.ts.
type Media struct {
	ID           string    `json:"id"`
	Kind         MediaKind `json:"kind"`
	Mime         string    `json:"mime"`
	URL          string    `json:"url"`
	ThumbURL     string    `json:"thumbUrl"`
	MediumURL    string    `json:"mediumUrl"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	Size         int64     `json:"size"`
	OriginalName string    `json:"originalName"`
	Alt          string    `json:"alt"`
	CreatedAt    time.Time `json:"createdAt"`
}

// MediaRecord is the stored form: relative paths inside the upload dir.
type MediaRecord struct {
	ID           string
	Kind         MediaKind
	Mime         string
	Path         string
	ThumbPath    string
	MediumPath   string
	Width        int
	Height       int
	Size         int64
	OriginalName string
	Alt          string
	CreatedAt    time.Time
}

// MediaQuery filters the admin media list.
type MediaQuery struct {
	Kind    string
	Q       string
	Page    int
	PerPage int
}

// Paginated mirrors `Paginated<T>`.
type Paginated[T any] struct {
	Items   []T `json:"items"`
	Total   int `json:"total"`
	Page    int `json:"page"`
	PerPage int `json:"perPage"`
}
