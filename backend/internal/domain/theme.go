package domain

// ThemeColors mirrors `ThemeColors`.
type ThemeColors struct {
	Primary       string `json:"primary"`
	PrimaryHover  string `json:"primaryHover"`
	PrimaryActive string `json:"primaryActive"`
	OnPrimary     string `json:"onPrimary"`
	Secondary     string `json:"secondary"`
	Accent        string `json:"accent"`
	OnAccent      string `json:"onAccent"`
	Background    string `json:"background"`
	Surface       string `json:"surface"`
	SurfaceAlt    string `json:"surfaceAlt"`
	Border        string `json:"border"`
	Text          string `json:"text"`
	TextMuted     string `json:"textMuted"`
	Heading       string `json:"heading"`
	Success       string `json:"success"`
	Warning       string `json:"warning"`
	Danger        string `json:"danger"`
	Disabled      string `json:"disabled"`
}

// ThemeTypography mirrors `ThemeTypography`.
type ThemeTypography struct {
	HeadingFont          string  `json:"headingFont"`
	BodyFont             string  `json:"bodyFont"`
	BaseSize             float64 `json:"baseSize"`
	HeadingWeight        float64 `json:"headingWeight"`
	BodyWeight           float64 `json:"bodyWeight"`
	LineHeight           float64 `json:"lineHeight"`
	HeadingLetterSpacing float64 `json:"headingLetterSpacing"`
	HeadingTransform     string  `json:"headingTransform"`
}

// ThemeShape mirrors `ThemeShape`.
type ThemeShape struct {
	RadiusButton float64 `json:"radiusButton"`
	RadiusCard   float64 `json:"radiusCard"`
	RadiusImage  float64 `json:"radiusImage"`
	RadiusInput  float64 `json:"radiusInput"`
	BorderWidth  float64 `json:"borderWidth"`
}

// ThemeEffects mirrors `ThemeEffects`.
type ThemeEffects struct {
	Shadow          string  `json:"shadow"`
	ShadowIntensity float64 `json:"shadowIntensity"`
	Blur            float64 `json:"blur"`
	SurfaceOpacity  float64 `json:"surfaceOpacity"`
}

// ThemeLayout mirrors `ThemeLayout`.
type ThemeLayout struct {
	Density     string  `json:"density"`
	MaxWidth    float64 `json:"maxWidth"`
	ButtonStyle string  `json:"buttonStyle"`
}

// ThemeSettings mirrors `ThemeSettings`.
type ThemeSettings struct {
	Preset     *string         `json:"preset"`
	Mode       string          `json:"mode"`
	Colors     ThemeColors     `json:"colors"`
	Typography ThemeTypography `json:"typography"`
	Shape      ThemeShape      `json:"shape"`
	Effects    ThemeEffects    `json:"effects"`
	Layout     ThemeLayout     `json:"layout"`
}

// ThemePreset mirrors `ThemePreset`.
type ThemePreset struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Theme       ThemeSettings `json:"theme"`
}
