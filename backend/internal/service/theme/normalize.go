package theme

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"merenda/backend/internal/domain"
)

var hexColorRe = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

// sectionKeys are the nested objects deep-merged one level (like the TS spread).
var sectionKeys = []string{"colors", "typography", "shape", "effects", "layout"}

// Normalize deep-merges a stored (possibly partial) theme over the preset it names,
// falling back to the elegant preset. It never fails: bad input yields the preset.
func Normalize(raw json.RawMessage) domain.ThemeSettings {
	var src map[string]any
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &src)
	}
	presetTheme := Elegant
	presetID, hasPreset := src["preset"].(string)
	if hasPreset {
		if p, ok := PresetByID(presetID); ok {
			presetTheme = p.Theme
		}
	}

	var out map[string]any
	baseJSON, _ := json.Marshal(presetTheme)
	_ = json.Unmarshal(baseJSON, &out)

	for _, key := range sectionKeys {
		baseSection, _ := out[key].(map[string]any)
		over, _ := src[key].(map[string]any)
		out[key] = mergeTyped(baseSection, over)
	}
	if mode, ok := src["mode"].(string); ok && (mode == "dark" || mode == "light") {
		out["mode"] = mode
	}
	if hasPreset {
		out["preset"] = presetID
	} else {
		out["preset"] = nil
	}

	var theme domain.ThemeSettings
	merged, _ := json.Marshal(out)
	if err := json.Unmarshal(merged, &theme); err != nil {
		return presetTheme
	}
	return theme
}

// mergeTyped copies base and overlays keys from over whose JSON kind matches the base value.
func mergeTyped(base, over map[string]any) map[string]any {
	out := make(map[string]any, len(base))
	for k, v := range base {
		out[k] = v
	}
	for k, v := range over {
		bv, known := base[k]
		if known && sameKind(bv, v) {
			out[k] = v
		}
	}
	return out
}

func sameKind(a, b any) bool {
	switch a.(type) {
	case string:
		_, ok := b.(string)
		return ok
	case float64:
		_, ok := b.(float64)
		return ok
	case bool:
		_, ok := b.(bool)
		return ok
	}
	return false
}

// Validate checks a normalized theme before it is stored.
func Validate(t domain.ThemeSettings) error {
	f := domain.Fields{}
	if t.Preset != nil {
		if _, ok := PresetByID(*t.Preset); !ok {
			f.Add("preset", "Неизвестный пресет")
		}
	}
	if t.Mode != "light" && t.Mode != "dark" {
		f.Add("mode", "Режим должен быть light или dark")
	}
	validateColors(t.Colors, f)
	validateTypography(t.Typography, f)
	validateShape(t.Shape, f)
	validateEffects(t.Effects, f)
	validateLayout(t.Layout, f)
	return f.Err()
}

func validateColors(c domain.ThemeColors, f domain.Fields) {
	colors := map[string]string{
		"primary": c.Primary, "primaryHover": c.PrimaryHover, "primaryActive": c.PrimaryActive, "onPrimary": c.OnPrimary,
		"secondary": c.Secondary, "accent": c.Accent, "background": c.Background, "surface": c.Surface, "surfaceAlt": c.SurfaceAlt,
		"border": c.Border, "text": c.Text, "textMuted": c.TextMuted, "heading": c.Heading,
		"success": c.Success, "warning": c.Warning, "danger": c.Danger, "disabled": c.Disabled,
	}
	for name, value := range colors {
		if !hexColorRe.MatchString(value) {
			f.Add("colors."+name, "Цвет должен быть в формате #rrggbb")
		}
	}
}

func validateTypography(t domain.ThemeTypography, f domain.Fields) {
	if strings.TrimSpace(t.HeadingFont) == "" {
		f.Add("typography.headingFont", "Укажите шрифт заголовков")
	}
	if strings.TrimSpace(t.BodyFont) == "" {
		f.Add("typography.bodyFont", "Укажите основной шрифт")
	}
	inRange(f, "typography.baseSize", t.BaseSize, 12, 24)
	inRange(f, "typography.headingWeight", t.HeadingWeight, 100, 900)
	inRange(f, "typography.bodyWeight", t.BodyWeight, 100, 900)
	inRange(f, "typography.lineHeight", t.LineHeight, 1, 2.5)
	inRange(f, "typography.headingLetterSpacing", t.HeadingLetterSpacing, -0.2, 0.5)
	if t.HeadingTransform != "none" && t.HeadingTransform != "uppercase" {
		f.Add("typography.headingTransform", "Допустимые значения: none, uppercase")
	}
}

func validateShape(s domain.ThemeShape, f domain.Fields) {
	inRange(f, "shape.radiusButton", s.RadiusButton, 0, 999)
	inRange(f, "shape.radiusCard", s.RadiusCard, 0, 999)
	inRange(f, "shape.radiusImage", s.RadiusImage, 0, 999)
	inRange(f, "shape.radiusInput", s.RadiusInput, 0, 999)
	inRange(f, "shape.borderWidth", s.BorderWidth, 0, 8)
}

func validateEffects(e domain.ThemeEffects, f domain.Fields) {
	switch e.Shadow {
	case "none", "sm", "md", "lg":
	default:
		f.Add("effects.shadow", "Допустимые значения: none, sm, md, lg")
	}
	inRange(f, "effects.shadowIntensity", e.ShadowIntensity, 0, 100)
	inRange(f, "effects.blur", e.Blur, 0, 64)
	inRange(f, "effects.surfaceOpacity", e.SurfaceOpacity, 0, 100)
}

func validateLayout(l domain.ThemeLayout, f domain.Fields) {
	switch l.Density {
	case "compact", "comfortable", "spacious":
	default:
		f.Add("layout.density", "Допустимые значения: compact, comfortable, spacious")
	}
	inRange(f, "layout.maxWidth", l.MaxWidth, 640, 2400)
	switch l.ButtonStyle {
	case "solid", "soft", "outline":
	default:
		f.Add("layout.buttonStyle", "Допустимые значения: solid, soft, outline")
	}
}

func inRange(f domain.Fields, field string, v, lo, hi float64) {
	if v < lo || v > hi {
		f.Add(field, fmt.Sprintf("Значение должно быть от %g до %g", lo, hi))
	}
}
