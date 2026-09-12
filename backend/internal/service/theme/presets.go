// Package theme is the Go port of packages/shared/src/theme.ts: presets and normalization.
package theme

import "merenda/backend/internal/domain"

func str(s string) *string { return &s }

// base mirrors the `base()` helper in theme.ts: shared typography/shape/effects/layout defaults.
func base(preset string, mode string, colors domain.ThemeColors) domain.ThemeSettings {
	return domain.ThemeSettings{
		Preset: str(preset),
		Mode:   mode,
		Colors: colors,
		Typography: domain.ThemeTypography{
			HeadingFont: "Manrope", BodyFont: "Manrope", BaseSize: 16, HeadingWeight: 700, BodyWeight: 400,
			LineHeight: 1.6, HeadingLetterSpacing: -0.02, HeadingTransform: "none",
		},
		Shape:   domain.ThemeShape{RadiusButton: 12, RadiusCard: 16, RadiusImage: 12, RadiusInput: 10, BorderWidth: 1},
		Effects: domain.ThemeEffects{Shadow: "sm", ShadowIntensity: 40, Blur: 12, SurfaceOpacity: 100},
		Layout:  domain.ThemeLayout{Density: "comfortable", MaxWidth: 1200, ButtonStyle: "solid"},
	}
}

// Elegant is the Merenda default theme (DEFAULT_THEME in theme.ts).
var Elegant = func() domain.ThemeSettings {
	t := base("elegant", "light", domain.ThemeColors{
		Primary: "#5B4030", PrimaryHover: "#4A3326", PrimaryActive: "#3A281E", OnPrimary: "#FBF8F2",
		Secondary: "#8E7A66", Accent: "#B98B4E", OnAccent: "#2A2019", Background: "#F5EFE5", Surface: "#FBF8F2", SurfaceAlt: "#EEE5D6",
		Border: "#E1D5C2", Text: "#2E2620", TextMuted: "#7A6C5F", Heading: "#221A14",
		Success: "#3E7C4F", Warning: "#C08A2C", Danger: "#B5443C", Disabled: "#C8BEB1",
	})
	t.Typography = domain.ThemeTypography{
		HeadingFont: "Playfair Display", BodyFont: "Manrope", BaseSize: 16, HeadingWeight: 600, BodyWeight: 400,
		LineHeight: 1.6, HeadingLetterSpacing: -0.01, HeadingTransform: "none",
	}
	t.Shape = domain.ThemeShape{RadiusButton: 12, RadiusCard: 18, RadiusImage: 14, RadiusInput: 10, BorderWidth: 1}
	t.Effects = domain.ThemeEffects{Shadow: "sm", ShadowIntensity: 35, Blur: 14, SurfaceOpacity: 100}
	return t
}()

var minimal = func() domain.ThemeSettings {
	t := base("minimal", "light", domain.ThemeColors{
		Primary: "#111111", PrimaryHover: "#2A2A2A", PrimaryActive: "#000000", OnPrimary: "#FFFFFF",
		Secondary: "#6B6B6B", Accent: "#111111", OnAccent: "#FFFFFF", Background: "#FFFFFF", Surface: "#FFFFFF", SurfaceAlt: "#F5F5F5",
		Border: "#E6E6E6", Text: "#1A1A1A", TextMuted: "#737373", Heading: "#0A0A0A",
		Success: "#2E7D4F", Warning: "#B7791F", Danger: "#C53030", Disabled: "#D4D4D4",
	})
	t.Typography = domain.ThemeTypography{
		HeadingFont: "Inter", BodyFont: "Inter", BaseSize: 16, HeadingWeight: 600, BodyWeight: 400,
		LineHeight: 1.55, HeadingLetterSpacing: -0.02, HeadingTransform: "none",
	}
	t.Shape = domain.ThemeShape{RadiusButton: 6, RadiusCard: 8, RadiusImage: 6, RadiusInput: 6, BorderWidth: 1}
	t.Effects = domain.ThemeEffects{Shadow: "none", ShadowIntensity: 0, Blur: 8, SurfaceOpacity: 100}
	t.Layout = domain.ThemeLayout{Density: "compact", MaxWidth: 1120, ButtonStyle: "solid"}
	return t
}()

var modern = func() domain.ThemeSettings {
	t := base("modern", "light", domain.ThemeColors{
		Primary: "#0F172A", PrimaryHover: "#1E293B", PrimaryActive: "#020617", OnPrimary: "#FFFFFF",
		Secondary: "#64748B", Accent: "#2F6FED", OnAccent: "#FFFFFF", Background: "#F8FAFC", Surface: "#FFFFFF", SurfaceAlt: "#F1F5F9",
		Border: "#E2E8F0", Text: "#1E293B", TextMuted: "#64748B", Heading: "#0F172A",
		Success: "#16A34A", Warning: "#D97706", Danger: "#DC2626", Disabled: "#CBD5E1",
	})
	t.Typography = domain.ThemeTypography{
		HeadingFont: "Manrope", BodyFont: "Manrope", BaseSize: 16, HeadingWeight: 800, BodyWeight: 400,
		LineHeight: 1.6, HeadingLetterSpacing: -0.03, HeadingTransform: "none",
	}
	t.Shape = domain.ThemeShape{RadiusButton: 14, RadiusCard: 20, RadiusImage: 16, RadiusInput: 12, BorderWidth: 1}
	t.Effects = domain.ThemeEffects{Shadow: "md", ShadowIntensity: 30, Blur: 16, SurfaceOpacity: 100}
	return t
}()

var premium = func() domain.ThemeSettings {
	t := base("premium", "light", domain.ThemeColors{
		Primary: "#1B1B1B", PrimaryHover: "#2E2E2E", PrimaryActive: "#000000", OnPrimary: "#FAF7F0",
		Secondary: "#6F6A62", Accent: "#C9A24B", OnAccent: "#1B1B1B", Background: "#FAF7F0", Surface: "#FFFDF8", SurfaceAlt: "#F2EDE2",
		Border: "#E4DCCB", Text: "#2A2A2A", TextMuted: "#7A7469", Heading: "#161616",
		Success: "#3C7A52", Warning: "#B7791F", Danger: "#A83A32", Disabled: "#D3CDC1",
	})
	t.Typography = domain.ThemeTypography{
		HeadingFont: "Cormorant Garamond", BodyFont: "Inter", BaseSize: 16, HeadingWeight: 600, BodyWeight: 400,
		LineHeight: 1.65, HeadingLetterSpacing: 0.04, HeadingTransform: "uppercase",
	}
	t.Shape = domain.ThemeShape{RadiusButton: 2, RadiusCard: 4, RadiusImage: 2, RadiusInput: 2, BorderWidth: 1}
	t.Effects = domain.ThemeEffects{Shadow: "none", ShadowIntensity: 0, Blur: 10, SurfaceOpacity: 100}
	t.Layout = domain.ThemeLayout{Density: "spacious", MaxWidth: 1240, ButtonStyle: "solid"}
	return t
}()

var soft = func() domain.ThemeSettings {
	t := base("soft", "light", domain.ThemeColors{
		Primary: "#B56A4F", PrimaryHover: "#A25D44", PrimaryActive: "#8E503A", OnPrimary: "#FFFFFF",
		Secondary: "#9C8B80", Accent: "#E0A458", OnAccent: "#3D3430", Background: "#FBF6F2", Surface: "#FFFFFF", SurfaceAlt: "#F6ECE5",
		Border: "#EEDFD5", Text: "#3D3430", TextMuted: "#8A7B72", Heading: "#2E2622",
		Success: "#4C9A6A", Warning: "#D8973C", Danger: "#C9564D", Disabled: "#DACFC7",
	})
	t.Typography = domain.ThemeTypography{
		HeadingFont: "Golos Text", BodyFont: "Golos Text", BaseSize: 16, HeadingWeight: 700, BodyWeight: 400,
		LineHeight: 1.65, HeadingLetterSpacing: -0.01, HeadingTransform: "none",
	}
	t.Shape = domain.ThemeShape{RadiusButton: 999, RadiusCard: 24, RadiusImage: 20, RadiusInput: 14, BorderWidth: 1}
	t.Effects = domain.ThemeEffects{Shadow: "sm", ShadowIntensity: 25, Blur: 14, SurfaceOpacity: 100}
	t.Layout = domain.ThemeLayout{Density: "comfortable", MaxWidth: 1180, ButtonStyle: "soft"}
	return t
}()

var dark = func() domain.ThemeSettings {
	t := base("dark", "dark", domain.ThemeColors{
		Primary: "#D4A960", PrimaryHover: "#E0B872", PrimaryActive: "#C1984F", OnPrimary: "#151311",
		Secondary: "#9A9086", Accent: "#D4A960", OnAccent: "#151311", Background: "#131211", Surface: "#1C1A18", SurfaceAlt: "#262320",
		Border: "#302C28", Text: "#E8E3DB", TextMuted: "#A39B90", Heading: "#F5F1EA",
		Success: "#5FB27C", Warning: "#E0A84C", Danger: "#E06C62", Disabled: "#4A443E",
	})
	t.Typography = domain.ThemeTypography{
		HeadingFont: "Playfair Display", BodyFont: "Inter", BaseSize: 16, HeadingWeight: 600, BodyWeight: 400,
		LineHeight: 1.6, HeadingLetterSpacing: -0.01, HeadingTransform: "none",
	}
	t.Shape = domain.ThemeShape{RadiusButton: 10, RadiusCard: 16, RadiusImage: 12, RadiusInput: 10, BorderWidth: 1}
	t.Effects = domain.ThemeEffects{Shadow: "md", ShadowIntensity: 60, Blur: 16, SurfaceOpacity: 100}
	return t
}()

// Presets mirrors THEME_PRESETS in theme.ts (same order).
var Presets = []domain.ThemePreset{
	{ID: "elegant", Name: "Elegant", Description: "Тёплая кремовая палитра, серифные заголовки, золотой акцент.", Theme: Elegant},
	{ID: "minimal", Name: "Minimal", Description: "Белый фон, чёрный текст, минимум декора.", Theme: minimal},
	{ID: "modern", Name: "Modern", Description: "Нейтральная светлая палитра, синий акцент, крупные радиусы.", Theme: modern},
	{ID: "premium", Name: "Premium", Description: "Слоновая кость, графит и золото. Прописные заголовки, острые углы.", Theme: premium},
	{ID: "soft", Name: "Soft", Description: "Мягкие пастельные тона, терракота и большие скругления.", Theme: soft},
	{ID: "dark", Name: "Dark", Description: "Тёмный интерфейс с золотым акцентом.", Theme: dark},
}

// PresetByID returns the preset with the id, or ok=false.
func PresetByID(id string) (domain.ThemePreset, bool) {
	for _, p := range Presets {
		if p.ID == id {
			return p, true
		}
	}
	return domain.ThemePreset{}, false
}
