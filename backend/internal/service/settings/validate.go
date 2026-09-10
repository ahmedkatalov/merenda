package settings

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/url"
	"strconv"
	"strings"
	"time"
	"unicode"

	"merenda/backend/internal/domain"
)

func runeLen(s string) int { return len([]rune(s)) }

func maxLen(f domain.Fields, field, value string, n int) {
	if runeLen(value) > n {
		f.Add(field, "Слишком длинное значение")
	}
}

func validHTTPURL(v string) bool {
	u, err := url.Parse(v)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

// mediaExists returns false for a non-nil id that is malformed or missing.
func (s *Service) mediaExists(ctx context.Context, id *string) (bool, error) {
	if id == nil {
		return true, nil
	}
	if !domain.IsUUID(*id) {
		return false, nil
	}
	_, err := s.repos.Media.ByID(ctx, *id)
	if errors.Is(err, domain.ErrNotFound) {
		return false, nil
	}
	return err == nil, err
}

func (s *Service) validateBusiness(ctx context.Context, raw json.RawMessage) (any, error) {
	v := defaults().Business
	if err := decodeStrict(raw, &v); err != nil {
		return nil, err
	}
	f := domain.Fields{}
	v.Name = strings.TrimSpace(v.Name)
	v.Tagline = strings.TrimSpace(v.Tagline)
	v.Description = strings.TrimSpace(v.Description)
	if v.Name == "" {
		f.Add("name", "Укажите название")
	}
	maxLen(f, "name", v.Name, 120)
	maxLen(f, "tagline", v.Tagline, 200)
	maxLen(f, "description", v.Description, 2000)
	if _, err := time.LoadLocation(v.Timezone); err != nil || v.Timezone == "" {
		f.Add("timezone", "Неизвестный часовой пояс (пример: Europe/Moscow)")
	}
	v.Currency.Code = strings.ToUpper(strings.TrimSpace(v.Currency.Code))
	v.Currency.Symbol = strings.TrimSpace(v.Currency.Symbol)
	if v.Currency.Code == "" {
		f.Add("currency.code", "Укажите код валюты (например RUB)")
	}
	if v.Currency.Symbol == "" {
		f.Add("currency.symbol", "Укажите символ валюты")
	}
	if v.Currency.Decimals != 0 && v.Currency.Decimals != 2 {
		f.Add("currency.decimals", "Допустимые значения: 0 или 2")
	}
	for field, id := range map[string]*string{"logoId": v.LogoID, "faviconId": v.FaviconID} {
		ok, err := s.mediaExists(ctx, id)
		if err != nil {
			return nil, err
		}
		if !ok {
			f.Add(field, "Файл не найден")
		}
	}
	return v, f.Err()
}

func validateContacts(raw json.RawMessage) (any, error) {
	v := defaults().Contacts
	if err := decodeStrict(raw, &v); err != nil {
		return nil, err
	}
	f := domain.Fields{}
	v.Phone = strings.TrimSpace(v.Phone)
	v.Email = strings.TrimSpace(v.Email)
	v.Address = strings.TrimSpace(v.Address)
	v.AddressNote = strings.TrimSpace(v.AddressNote)
	v.MapURL = strings.TrimSpace(v.MapURL)
	v.MapEmbedURL = strings.TrimSpace(v.MapEmbedURL)
	maxLen(f, "phone", v.Phone, 40)
	maxLen(f, "address", v.Address, 300)
	maxLen(f, "addressNote", v.AddressNote, 300)
	if v.Email != "" && !strings.Contains(v.Email, "@") {
		f.Add("email", "Укажите корректный e-mail")
	}
	if v.MapURL != "" && !validHTTPURL(v.MapURL) {
		f.Add("mapUrl", "Ссылка должна начинаться с http:// или https://")
	}
	if v.MapEmbedURL != "" && !validHTTPURL(v.MapEmbedURL) {
		f.Add("mapEmbedUrl", "Ссылка должна начинаться с http:// или https://")
	}
	if v.Social == nil {
		v.Social = []domain.SocialLink{}
	}
	if len(v.Social) > 20 {
		f.Add("social", "Не более 20 ссылок")
	}
	for i := range v.Social {
		link := &v.Social[i]
		link.Label = strings.TrimSpace(link.Label)
		link.URL = strings.TrimSpace(link.URL)
		if link.ID == "" {
			link.ID = randomID()
		}
		if !validSocialType(link.Type) {
			f.Add("social."+itoa(i)+".type", "Неизвестный тип ссылки")
		}
		if link.URL == "" {
			f.Add("social."+itoa(i)+".url", "Укажите ссылку")
		} else if !validHTTPURL(link.URL) && !strings.HasPrefix(link.URL, "tg://") && !strings.HasPrefix(link.URL, "mailto:") {
			f.Add("social."+itoa(i)+".url", "Ссылка должна начинаться с http:// или https://")
		}
		maxLen(f, "social."+itoa(i)+".label", link.Label, 60)
	}
	return v, f.Err()
}

func validSocialType(t string) bool {
	for _, s := range domain.SocialTypes {
		if s == t {
			return true
		}
	}
	return false
}

// NormalizePhoneDigits strips "+", spaces, parentheses and dashes and keeps digits only.
// ok is false when other characters are present.
func NormalizePhoneDigits(v string) (digits string, ok bool) {
	var b strings.Builder
	for _, r := range v {
		switch {
		case unicode.IsDigit(r):
			b.WriteRune(r)
		case r == '+' || r == '(' || r == ')' || r == '-' || unicode.IsSpace(r):
		default:
			return "", false
		}
	}
	return b.String(), true
}

func validateOrders(raw json.RawMessage) (any, error) {
	v := defaults().Orders
	if err := decodeStrict(raw, &v); err != nil {
		return nil, err
	}
	f := domain.Fields{}
	v.WhatsappNumber = strings.TrimSpace(v.WhatsappNumber)
	v.MessageTitle = strings.TrimSpace(v.MessageTitle)
	v.MessageFooter = strings.TrimSpace(v.MessageFooter)
	if v.WhatsappNumber != "" {
		digits, ok := NormalizePhoneDigits(v.WhatsappNumber)
		if !ok || len(digits) < 7 || len(digits) > 15 {
			f.Add("whatsappNumber", "Укажите номер в международном формате, например +7 999 123-45-67")
		}
	}
	if v.MinOrderMinor < 0 {
		f.Add("minOrderMinor", "Минимальная сумма не может быть отрицательной")
	}
	if v.MessageTitle == "" {
		f.Add("messageTitle", "Укажите заголовок сообщения")
	}
	maxLen(f, "messageTitle", v.MessageTitle, 120)
	maxLen(f, "messageFooter", v.MessageFooter, 500)
	if v.Enabled && !v.AllowDineIn && !v.AllowTakeaway {
		f.Add("allowDineIn", "Разрешите хотя бы один тип заказа")
	}
	return v, f.Err()
}

func (s *Service) validateSeo(ctx context.Context, raw json.RawMessage) (any, error) {
	v := defaults().Seo
	if err := decodeStrict(raw, &v); err != nil {
		return nil, err
	}
	f := domain.Fields{}
	v.Title = strings.TrimSpace(v.Title)
	v.Description = strings.TrimSpace(v.Description)
	v.Keywords = strings.TrimSpace(v.Keywords)
	v.CanonicalURL = strings.TrimSpace(v.CanonicalURL)
	maxLen(f, "title", v.Title, 200)
	maxLen(f, "description", v.Description, 500)
	maxLen(f, "keywords", v.Keywords, 500)
	if v.CanonicalURL != "" && !validHTTPURL(v.CanonicalURL) {
		f.Add("canonicalUrl", "Ссылка должна начинаться с http:// или https://")
	}
	ok, err := s.mediaExists(ctx, v.OgImageID)
	if err != nil {
		return nil, err
	}
	if !ok {
		f.Add("ogImageId", "Файл не найден")
	}
	return v, f.Err()
}

func validateStatus(raw json.RawMessage) (any, error) {
	v := defaults().Status
	if err := decodeStrict(raw, &v); err != nil {
		return nil, err
	}
	f := domain.Fields{}
	v.Message = strings.TrimSpace(v.Message)
	if v.Mode != domain.ModeAuto && v.Mode != domain.ModeTemporarilyClosed {
		f.Add("mode", "Допустимые значения: auto, temporarily_closed")
	}
	maxLen(f, "message", v.Message, 500)
	return v, f.Err()
}

func randomID() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func itoa(i int) string { return strconv.Itoa(i) }
