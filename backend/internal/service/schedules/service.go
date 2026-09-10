// Package schedules manages working-hour schedules and their exceptions.
package schedules

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/service/hours"
	"merenda/backend/internal/service/slug"
)

// Service validates and persists schedules.
type Service struct {
	repos *repo.Repos
}

// New creates the service.
func New(repos *repo.Repos) *Service { return &Service{repos: repos} }

// List returns all schedules, venue first.
func (s *Service) List(ctx context.Context) ([]domain.Schedule, error) {
	return s.repos.Schedules.List(ctx)
}

// Create adds a custom schedule with 7 default days.
func (s *Service) Create(ctx context.Context, in domain.ScheduleInput) (domain.Schedule, error) {
	name, key, err := s.validateNameKey(ctx, in, "")
	if err != nil {
		return domain.Schedule{}, err
	}
	order, err := s.repos.Schedules.NextSortOrder(ctx)
	if err != nil {
		return domain.Schedule{}, err
	}
	var id string
	err = s.repos.Tx(ctx, func(ctx context.Context, tx pgx.Tx) error {
		r := s.repos.Schedules.WithTx(tx)
		var err error
		if id, err = r.Create(ctx, key, name, domain.ScheduleCustom, order); err != nil {
			return err
		}
		return r.ReplaceHours(ctx, id, domain.DefaultHours())
	})
	if err != nil {
		return domain.Schedule{}, err
	}
	return s.repos.Schedules.ByID(ctx, id)
}

// Update changes name/key.
func (s *Service) Update(ctx context.Context, id string, in domain.ScheduleInput) (domain.Schedule, error) {
	if !domain.IsUUID(id) {
		return domain.Schedule{}, domain.ErrNotFound
	}
	current, err := s.repos.Schedules.ByID(ctx, id)
	if err != nil {
		return domain.Schedule{}, err
	}
	if current.Kind == domain.ScheduleVenue {
		in.Key = nil // the venue key is fixed
	}
	name, key, err := s.validateNameKey(ctx, in, id)
	if err != nil {
		return domain.Schedule{}, err
	}
	if in.Key == nil {
		key = current.Key
	}
	if err := s.repos.Schedules.Update(ctx, id, key, name); err != nil {
		return domain.Schedule{}, err
	}
	return s.repos.Schedules.ByID(ctx, id)
}

func (s *Service) validateNameKey(ctx context.Context, in domain.ScheduleInput, excludeID string) (name, key string, err error) {
	f := domain.Fields{}
	name = strings.TrimSpace(in.Name)
	if name == "" {
		f.Add("name", "Укажите название")
	} else if len([]rune(name)) > 80 {
		f.Add("name", "Слишком длинное название")
	}
	if in.Key != nil && strings.TrimSpace(*in.Key) != "" {
		key = slug.Make(*in.Key, "")
		if key == "" {
			f.Add("key", "Ключ может содержать только латинские буквы, цифры и дефис")
		}
	} else {
		key = slug.Make(name, "schedule")
	}
	if key == "venue" && excludeID == "" {
		f.Add("key", "Ключ venue зарезервирован")
	}
	if err := f.Err(); err != nil {
		return "", "", err
	}
	if excludeID == "" || (in.Key != nil) {
		key, err = slug.Unique(ctx, key, func(ctx context.Context, cand string) (bool, error) {
			return s.repos.Schedules.KeyExists(ctx, cand, excludeID)
		})
		if err != nil {
			return "", "", err
		}
	}
	return name, key, nil
}

// PutHours replaces all 7 day rows.
func (s *Service) PutHours(ctx context.Context, id string, in domain.ScheduleHoursInput) (domain.Schedule, error) {
	if !domain.IsUUID(id) {
		return domain.Schedule{}, domain.ErrNotFound
	}
	if _, err := s.repos.Schedules.ByID(ctx, id); err != nil {
		return domain.Schedule{}, err
	}
	if err := validateHours(in.Hours); err != nil {
		return domain.Schedule{}, err
	}
	if err := s.repos.Schedules.ReplaceHours(ctx, id, in.Hours); err != nil {
		return domain.Schedule{}, err
	}
	return s.repos.Schedules.ByID(ctx, id)
}

func validateHours(days []domain.ScheduleDay) error {
	f := domain.Fields{}
	if len(days) != 7 {
		return domain.NewValidation("hours", "Нужно указать все 7 дней недели")
	}
	seen := map[int]bool{}
	for i, d := range days {
		prefix := "hours." + itoa(i) + "."
		if d.Weekday < 0 || d.Weekday > 6 || seen[d.Weekday] {
			f.Add(prefix+"weekday", "День недели должен быть от 0 до 6 и не повторяться")
		}
		seen[d.Weekday] = true
		if _, _, ok := hours.ParseClock(d.OpensAt); !ok {
			f.Add(prefix+"opensAt", "Время в формате ЧЧ:ММ")
		}
		if _, _, ok := hours.ParseClock(d.ClosesAt); !ok {
			f.Add(prefix+"closesAt", "Время в формате ЧЧ:ММ")
		}
	}
	return f.Err()
}

// Delete removes a custom schedule; the venue schedule is protected.
func (s *Service) Delete(ctx context.Context, id string) error {
	if !domain.IsUUID(id) {
		return domain.ErrNotFound
	}
	current, err := s.repos.Schedules.ByID(ctx, id)
	if err != nil {
		return err
	}
	if current.Kind == domain.ScheduleVenue {
		return domain.Conflict("Расписание заведения нельзя удалить")
	}
	return s.repos.Schedules.Delete(ctx, id)
}

// UpsertException creates or replaces the exception for a date.
func (s *Service) UpsertException(ctx context.Context, scheduleID string, in domain.ScheduleExceptionInput) (domain.ScheduleException, error) {
	if !domain.IsUUID(scheduleID) {
		return domain.ScheduleException{}, domain.ErrNotFound
	}
	if _, err := s.repos.Schedules.ByID(ctx, scheduleID); err != nil {
		return domain.ScheduleException{}, err
	}
	f := domain.Fields{}
	if _, err := time.Parse("2006-01-02", in.Date); err != nil {
		f.Add("date", "Дата в формате ГГГГ-ММ-ДД")
	}
	if in.IsClosed {
		in.OpensAt, in.ClosesAt = nil, nil
	} else {
		in.OpensAt = emptyToNil(in.OpensAt)
		in.ClosesAt = emptyToNil(in.ClosesAt)
		if (in.OpensAt == nil) != (in.ClosesAt == nil) {
			f.Add("opensAt", "Укажите и время открытия, и время закрытия")
		}
		if in.OpensAt != nil {
			if _, _, ok := hours.ParseClock(*in.OpensAt); !ok {
				f.Add("opensAt", "Время в формате ЧЧ:ММ")
			}
		}
		if in.ClosesAt != nil {
			if _, _, ok := hours.ParseClock(*in.ClosesAt); !ok {
				f.Add("closesAt", "Время в формате ЧЧ:ММ")
			}
		}
	}
	if in.Note != nil {
		note := strings.TrimSpace(*in.Note)
		in.Note = &note
		if len([]rune(note)) > 200 {
			f.Add("note", "Слишком длинное примечание")
		}
	}
	if err := f.Err(); err != nil {
		return domain.ScheduleException{}, err
	}
	return s.repos.Schedules.UpsertException(ctx, scheduleID, in)
}

// DeleteException removes an exception.
func (s *Service) DeleteException(ctx context.Context, scheduleID, exceptionID string) error {
	if !domain.IsUUID(scheduleID) || !domain.IsUUID(exceptionID) {
		return domain.ErrNotFound
	}
	return s.repos.Schedules.DeleteException(ctx, scheduleID, exceptionID)
}

func emptyToNil(v *string) *string {
	if v == nil || strings.TrimSpace(*v) == "" {
		return nil
	}
	t := strings.TrimSpace(*v)
	return &t
}

func itoa(i int) string {
	if i < 10 {
		return string(rune('0' + i))
	}
	return string(rune('0'+i/10)) + string(rune('0'+i%10))
}
