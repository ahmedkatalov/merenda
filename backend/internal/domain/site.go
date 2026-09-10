package domain

// SiteBootstrap mirrors `SiteBootstrap`.
type SiteBootstrap struct {
	Business  BusinessSettings    `json:"business"`
	Contacts  ContactSettings     `json:"contacts"`
	Orders    PublicOrderSettings `json:"orders"`
	Seo       SeoSettings         `json:"seo"`
	Theme     ThemeSettings       `json:"theme"`
	Sections  []PageSection       `json:"sections"`
	Schedules []PublicSchedule    `json:"schedules"`
	Status    SiteStatus          `json:"status"`
	Media     map[string]Media    `json:"media"`
}
