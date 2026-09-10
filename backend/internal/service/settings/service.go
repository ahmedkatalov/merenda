// Package settings reads and validates the typed key/value settings.
package settings

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/theme"
)

// Service loads settings with defaults and validates writes.
type Service struct {
	repos *repo.Repos
}

// New creates the service.
func New(repos *repo.Repos) *Service { return &Service{repos: repos} }

// Load returns every setting fully typed, with the theme normalized.
func (s *Service) Load(ctx context.Context) (domain.SettingsMap, error) {
	raw, err := s.repos.Settings.All(ctx)
	if err != nil {
		return domain.SettingsMap{}, err
	}
	return decodeAll(raw)
}

func decodeAll(raw domain.RawSettings) (domain.SettingsMap, error) {
	m := defaults()
	if err := decodeInto(raw["business"], &m.Business); err != nil {
		return m, err
	}
	if err := decodeInto(raw["contacts"], &m.Contacts); err != nil {
		return m, err
	}
	if err := decodeInto(raw["orders"], &m.Orders); err != nil {
		return m, err
	}
	if err := decodeInto(raw["seo"], &m.Seo); err != nil {
		return m, err
	}
	if err := decodeInto(raw["status"], &m.Status); err != nil {
		return m, err
	}
	m.Theme = theme.Normalize(raw["theme"])
	if m.Contacts.Social == nil {
		m.Contacts.Social = []domain.SocialLink{}
	}
	return m, nil
}

func decodeInto(raw json.RawMessage, dst any) error {
	if len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, dst); err != nil {
		return fmt.Errorf("decode setting: %w", err)
	}
	return nil
}

// defaults are used when a key is missing from the table (the seed normally provides all).
func defaults() domain.SettingsMap {
	return domain.SettingsMap{
		Business: domain.BusinessSettings{Name: "Меренда", Currency: domain.Currency{Code: "RUB", Symbol: "₽", Decimals: 0}, Timezone: "Europe/Moscow"},
		Contacts: domain.ContactSettings{Social: []domain.SocialLink{}},
		Orders:   domain.OrderSettings{Enabled: true, AllowDineIn: true, AllowTakeaway: true, AskName: true, AskComment: true, BlockWhenClosed: true, MessageTitle: "Новый заказ"},
		Seo:      domain.SeoSettings{RobotsIndex: true},
		Status:   domain.StatusSettings{Mode: domain.ModeAuto},
		Theme:    theme.Elegant,
	}
}

// Get returns the typed value for one key.
func (s *Service) Get(ctx context.Context, key string) (any, error) {
	if !validKey(key) {
		return nil, domain.ErrNotFound
	}
	m, err := s.Load(ctx)
	if err != nil {
		return nil, err
	}
	return pick(m, key), nil
}

// Put validates and stores the value for a key, returning the stored typed value.
func (s *Service) Put(ctx context.Context, key string, raw json.RawMessage) (any, error) {
	if !validKey(key) {
		return nil, domain.ErrNotFound
	}
	if !isJSONObject(raw) {
		return nil, &domain.ValidationError{Message: "Ожидается JSON-объект"}
	}
	value, err := s.validate(ctx, key, raw)
	if err != nil {
		return nil, err
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return nil, fmt.Errorf("encode setting %s: %w", key, err)
	}
	if err := s.repos.Settings.Put(ctx, key, encoded); err != nil {
		return nil, err
	}
	return value, nil
}

func (s *Service) validate(ctx context.Context, key string, raw json.RawMessage) (any, error) {
	switch key {
	case "business":
		return s.validateBusiness(ctx, raw)
	case "contacts":
		return validateContacts(raw)
	case "orders":
		return validateOrders(raw)
	case "seo":
		return s.validateSeo(ctx, raw)
	case "status":
		return validateStatus(raw)
	case "theme":
		t := theme.Normalize(raw)
		if err := theme.Validate(t); err != nil {
			return nil, err
		}
		return t, nil
	}
	return nil, domain.ErrNotFound
}

func validKey(key string) bool {
	for _, k := range domain.SettingsKeys {
		if k == key {
			return true
		}
	}
	return false
}

func pick(m domain.SettingsMap, key string) any {
	switch key {
	case "business":
		return m.Business
	case "contacts":
		return m.Contacts
	case "orders":
		return m.Orders
	case "seo":
		return m.Seo
	case "status":
		return m.Status
	default:
		return m.Theme
	}
}

func isJSONObject(raw json.RawMessage) bool {
	trimmed := bytes.TrimSpace(raw)
	return len(trimmed) > 0 && trimmed[0] == '{'
}

// decodeStrict unmarshals into dst, reporting type errors as validation errors.
func decodeStrict(raw json.RawMessage, dst any) error {
	if err := json.Unmarshal(raw, dst); err != nil {
		var ute *json.UnmarshalTypeError
		if ok := asType(err, &ute); ok {
			return domain.NewValidation(ute.Field, "Неверный тип значения")
		}
		return &domain.ValidationError{Message: "Некорректный JSON"}
	}
	return nil
}

func asType(err error, target **json.UnmarshalTypeError) bool {
	if e, ok := err.(*json.UnmarshalTypeError); ok {
		*target = e
		return true
	}
	return false
}
