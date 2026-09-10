// Package slug builds URL-safe identifiers with Cyrillic transliteration.
package slug

import (
	"context"
	"fmt"
	"strings"
	"unicode"
)

var translit = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "yo", 'ж': "zh", 'з': "z", 'и': "i",
	'й': "y", 'к': "k", 'л': "l", 'м': "m", 'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t",
	'у': "u", 'ф': "f", 'х': "kh", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "shch", 'ъ': "", 'ы': "y", 'ь': "",
	'э': "e", 'ю': "yu", 'я': "ya", 'і': "i", 'ї': "yi", 'є': "ye", 'ґ': "g",
}

// Make converts free text into a lowercase ASCII slug ("Кофе латте" → "kofe-latte").
// Empty results fall back to fallback.
func Make(text, fallback string) string {
	var b strings.Builder
	lastDash := true
	for _, r := range strings.ToLower(strings.TrimSpace(text)) {
		var chunk string
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			chunk = string(r)
		case unicode.IsLetter(r):
			if t, ok := translit[r]; ok {
				chunk = t
			}
		}
		if chunk == "" {
			if !lastDash {
				b.WriteByte('-')
				lastDash = true
			}
			continue
		}
		b.WriteString(chunk)
		lastDash = false
	}
	out := strings.Trim(b.String(), "-")
	if len(out) > 80 {
		out = strings.Trim(out[:80], "-")
	}
	if out == "" {
		return fallback
	}
	return out
}

// ExistsFunc reports whether a candidate slug is already taken.
type ExistsFunc func(ctx context.Context, candidate string) (bool, error)

// Unique appends -2, -3 … until exists reports the candidate as free.
func Unique(ctx context.Context, base string, exists ExistsFunc) (string, error) {
	candidate := base
	for i := 2; i < 1000; i++ {
		taken, err := exists(ctx, candidate)
		if err != nil {
			return "", err
		}
		if !taken {
			return candidate, nil
		}
		candidate = fmt.Sprintf("%s-%d", base, i)
	}
	return "", fmt.Errorf("could not find a free slug for %q", base)
}
