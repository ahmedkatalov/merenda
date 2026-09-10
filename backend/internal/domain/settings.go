package domain

import "encoding/json"

type VenueMode string

const (
	ModeAuto              VenueMode = "auto"
	ModeTemporarilyClosed VenueMode = "temporarily_closed"
)

// SettingsKeys lists the accepted keys of the settings table.
var SettingsKeys = []string{"business", "contacts", "orders", "seo", "status", "theme"}

// Currency mirrors `Currency`.
type Currency struct {
	Code     string `json:"code"`
	Symbol   string `json:"symbol"`
	Decimals int    `json:"decimals"`
}

// BusinessSettings mirrors `BusinessSettings`.
type BusinessSettings struct {
	Name        string   `json:"name"`
	Tagline     string   `json:"tagline"`
	Description string   `json:"description"`
	LogoID      *string  `json:"logoId"`
	FaviconID   *string  `json:"faviconId"`
	Currency    Currency `json:"currency"`
	Timezone    string   `json:"timezone"`
}

// SocialLink mirrors `SocialLink`.
type SocialLink struct {
	ID    string `json:"id"`
	Type  string `json:"type"`
	Label string `json:"label"`
	URL   string `json:"url"`
}

// SocialTypes lists the accepted `SocialType` values.
var SocialTypes = []string{"instagram", "telegram", "vk", "whatsapp", "youtube", "tiktok", "website", "other"}

// ContactSettings mirrors `ContactSettings`.
type ContactSettings struct {
	Phone       string       `json:"phone"`
	Email       string       `json:"email"`
	Address     string       `json:"address"`
	AddressNote string       `json:"addressNote"`
	MapURL      string       `json:"mapUrl"`
	MapEmbedURL string       `json:"mapEmbedUrl"`
	Social      []SocialLink `json:"social"`
}

// OrderSettings mirrors `OrderSettings`.
type OrderSettings struct {
	Enabled         bool   `json:"enabled"`
	WhatsappNumber  string `json:"whatsappNumber"`
	AllowDineIn     bool   `json:"allowDineIn"`
	AllowTakeaway   bool   `json:"allowTakeaway"`
	AskName         bool   `json:"askName"`
	AskPhone        bool   `json:"askPhone"`
	AskComment      bool   `json:"askComment"`
	MinOrderMinor   int64  `json:"minOrderMinor"`
	BlockWhenClosed bool   `json:"blockWhenClosed"`
	MessageTitle    string `json:"messageTitle"`
	MessageFooter   string `json:"messageFooter"`
}

// Public strips the WhatsApp number for the client site.
func (o OrderSettings) Public() PublicOrderSettings {
	return PublicOrderSettings{
		Enabled:            o.Enabled,
		WhatsappConfigured: o.WhatsappNumber != "",
		AllowDineIn:        o.AllowDineIn,
		AllowTakeaway:      o.AllowTakeaway,
		AskName:            o.AskName,
		AskPhone:           o.AskPhone,
		AskComment:         o.AskComment,
		MinOrderMinor:      o.MinOrderMinor,
		BlockWhenClosed:    o.BlockWhenClosed,
	}
}

// PublicOrderSettings mirrors `PublicOrderSettings`.
type PublicOrderSettings struct {
	Enabled            bool  `json:"enabled"`
	WhatsappConfigured bool  `json:"whatsappConfigured"`
	AllowDineIn        bool  `json:"allowDineIn"`
	AllowTakeaway      bool  `json:"allowTakeaway"`
	AskName            bool  `json:"askName"`
	AskPhone           bool  `json:"askPhone"`
	AskComment         bool  `json:"askComment"`
	MinOrderMinor      int64 `json:"minOrderMinor"`
	BlockWhenClosed    bool  `json:"blockWhenClosed"`
}

// SeoSettings mirrors `SeoSettings`.
type SeoSettings struct {
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	Keywords     string  `json:"keywords"`
	OgImageID    *string `json:"ogImageId"`
	CanonicalURL string  `json:"canonicalUrl"`
	RobotsIndex  bool    `json:"robotsIndex"`
}

// StatusSettings mirrors `StatusSettings`.
type StatusSettings struct {
	Mode    VenueMode `json:"mode"`
	Message string    `json:"message"`
}

// SettingsMap mirrors `SettingsMap`.
type SettingsMap struct {
	Business BusinessSettings `json:"business"`
	Contacts ContactSettings  `json:"contacts"`
	Orders   OrderSettings    `json:"orders"`
	Seo      SeoSettings      `json:"seo"`
	Status   StatusSettings   `json:"status"`
	Theme    ThemeSettings    `json:"theme"`
}

// RawSettings is the settings table as stored: key → JSON value.
type RawSettings map[string]json.RawMessage
