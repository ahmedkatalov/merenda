package hours

import (
	"testing"
	"time"

	"merenda/backend/internal/domain"
)

const tz = "Europe/Moscow"

func mustLoc(t *testing.T) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation(tz)
	if err != nil {
		t.Fatalf("load location: %v", err)
	}
	return loc
}

func allDays(opens, closes string) []domain.ScheduleDay {
	days := make([]domain.ScheduleDay, 7)
	for i := range days {
		days[i] = domain.ScheduleDay{Weekday: i, OpensAt: opens, ClosesAt: closes}
	}
	return days
}

func withClosed(days []domain.ScheduleDay, weekdays ...int) []domain.ScheduleDay {
	out := append([]domain.ScheduleDay(nil), days...)
	for _, w := range weekdays {
		out[w].IsClosed = true
	}
	return out
}

func venue(hours []domain.ScheduleDay, ex ...domain.ScheduleException) domain.Schedule {
	return domain.Schedule{ID: "venue-id", Key: "venue", Name: "Заведение", Kind: domain.ScheduleVenue, Hours: hours, Exceptions: ex}
}

func kitchen(hours []domain.ScheduleDay) domain.Schedule {
	return domain.Schedule{ID: "kitchen-id", Key: "kitchen", Name: "Кухня", Kind: domain.ScheduleCustom, Hours: hours}
}

func ptr(s string) *string { return &s }

func TestVenueStatus(t *testing.T) {
	loc := mustLoc(t)
	// 2026-09-09 is a Wednesday.
	at := func(day, hour, minute int) time.Time { return time.Date(2026, 9, day, hour, minute, 0, 0, loc) }

	cases := []struct {
		name       string
		schedule   domain.Schedule
		now        time.Time
		wantOpen   bool
		wantMsg    string
		wantOpens  *string
		wantCloses *string
		wantNext   *string
	}{
		{
			name: "open during the day", schedule: venue(allDays("08:00", "22:00")), now: at(9, 12, 0),
			wantOpen: true, wantMsg: "Сегодня открыто до 22:00", wantOpens: ptr("08:00"), wantCloses: ptr("22:00"),
		},
		{
			name: "closed before opening today", schedule: venue(allDays("08:00", "22:00")), now: at(9, 6, 30),
			wantOpen: false, wantMsg: "Сегодня откроется в 08:00", wantOpens: ptr("08:00"), wantCloses: ptr("22:00"),
			wantNext: ptr("2026-09-09T05:00:00Z"),
		},
		{
			name: "closed after closing opens tomorrow", schedule: venue(allDays("08:00", "22:00")), now: at(9, 22, 0),
			wantOpen: false, wantMsg: "Откроется завтра в 08:00", wantOpens: ptr("08:00"), wantCloses: ptr("22:00"),
			wantNext: ptr("2026-09-10T05:00:00Z"),
		},
		{
			name: "overnight interval after midnight is still open", schedule: venue(allDays("18:00", "02:00")), now: at(10, 1, 30),
			wantOpen: true, wantMsg: "Сегодня открыто до 02:00", wantOpens: ptr("18:00"), wantCloses: ptr("02:00"),
		},
		{
			name: "overnight interval before opening", schedule: venue(allDays("18:00", "02:00")), now: at(10, 12, 0),
			wantOpen: false, wantMsg: "Сегодня откроется в 18:00", wantOpens: ptr("18:00"), wantCloses: ptr("02:00"),
			wantNext: ptr("2026-09-10T15:00:00Z"),
		},
		{
			name: "overnight interval exactly at closing is closed", schedule: venue(allDays("18:00", "02:00")), now: at(10, 2, 0),
			wantOpen: false, wantMsg: "Сегодня откроется в 18:00",
		},
		{
			name:     "exception closes today",
			schedule: venue(allDays("08:00", "22:00"), domain.ScheduleException{Date: "2026-09-09", IsClosed: true}),
			now:      at(9, 12, 0),
			wantOpen: false, wantMsg: "Откроется завтра в 08:00", wantNext: ptr("2026-09-10T05:00:00Z"),
		},
		{
			name:     "exception overrides hours",
			schedule: venue(allDays("08:00", "22:00"), domain.ScheduleException{Date: "2026-09-09", OpensAt: ptr("10:00"), ClosesAt: ptr("16:00")}),
			now:      at(9, 9, 0),
			wantOpen: false, wantMsg: "Сегодня откроется в 10:00", wantOpens: ptr("10:00"), wantCloses: ptr("16:00"),
			wantNext: ptr("2026-09-09T07:00:00Z"),
		},
		{
			name:     "exception opens a normally closed day",
			schedule: venue(withClosed(allDays("08:00", "22:00"), 2), domain.ScheduleException{Date: "2026-09-09", OpensAt: ptr("12:00"), ClosesAt: ptr("15:00")}),
			now:      at(9, 13, 0),
			wantOpen: true, wantMsg: "Сегодня открыто до 15:00",
		},
		{
			name: "closed weekend opens on monday", schedule: venue(withClosed(allDays("08:00", "22:00"), 5, 6)), now: at(12, 12, 0), // Saturday
			wantOpen: false, wantMsg: "Откроется в понедельник в 08:00", wantNext: ptr("2026-09-14T05:00:00Z"),
		},
		{
			name: "closed until tuesday", schedule: venue(withClosed(allDays("08:00", "22:00"), 3, 4, 5, 6, 0)), now: at(10, 12, 0), // Thursday
			wantOpen: false, wantMsg: "Откроется во вторник в 08:00", wantNext: ptr("2026-09-15T05:00:00Z"),
		},
		{
			name: "closed all week", schedule: venue(withClosed(allDays("08:00", "22:00"), 0, 1, 2, 3, 4, 5, 6)), now: at(9, 12, 0),
			wantOpen: false, wantMsg: "Закрыто",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Compute(Input{Schedules: []domain.Schedule{tc.schedule}, Status: domain.StatusSettings{Mode: domain.ModeAuto}, Timezone: tz, Now: tc.now})
			v := got.Venue
			if v.IsOpen != tc.wantOpen {
				t.Errorf("isOpen = %v, want %v", v.IsOpen, tc.wantOpen)
			}
			if v.Message != tc.wantMsg {
				t.Errorf("message = %q, want %q", v.Message, tc.wantMsg)
			}
			if tc.wantOpens != nil && (v.OpensAt == nil || *v.OpensAt != *tc.wantOpens) {
				t.Errorf("opensAt = %v, want %v", deref(v.OpensAt), *tc.wantOpens)
			}
			if tc.wantCloses != nil && (v.ClosesAt == nil || *v.ClosesAt != *tc.wantCloses) {
				t.Errorf("closesAt = %v, want %v", deref(v.ClosesAt), *tc.wantCloses)
			}
			if tc.wantNext != nil && (v.NextOpenAt == nil || *v.NextOpenAt != *tc.wantNext) {
				t.Errorf("nextOpenAt = %v, want %v", deref(v.NextOpenAt), *tc.wantNext)
			}
			if tc.wantOpen && v.NextOpenAt != nil {
				t.Errorf("nextOpenAt should be null when open, got %v", *v.NextOpenAt)
			}
			if got.Timezone != tz {
				t.Errorf("timezone = %q", got.Timezone)
			}
			if got.Venue.Mode != domain.ModeAuto {
				t.Errorf("mode = %q", got.Venue.Mode)
			}
		})
	}
}

func TestCustomScheduleMessages(t *testing.T) {
	loc := mustLoc(t)
	at := func(day, hour int) time.Time { return time.Date(2026, 9, day, hour, 0, 0, 0, loc) }
	cases := []struct {
		name     string
		hours    []domain.ScheduleDay
		now      time.Time
		wantOpen bool
		wantMsg  string
	}{
		{"open", allDays("11:00", "21:00"), at(9, 12), true, "Кухня работает до 21:00"},
		{"opens later today", allDays("11:00", "21:00"), at(9, 9), false, "Кухня откроется в 11:00"},
		{"opens tomorrow", allDays("11:00", "21:00"), at(9, 22), false, "Кухня откроется завтра в 11:00"},
		{"opens another day", withClosed(allDays("11:00", "21:00"), 3, 4), at(10, 12), false, "Кухня откроется в субботу в 11:00"},
		{"never opens", withClosed(allDays("11:00", "21:00"), 0, 1, 2, 3, 4, 5, 6), at(9, 12), false, "Кухня сегодня не работает"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Compute(Input{Schedules: []domain.Schedule{venue(allDays("08:00", "22:00")), kitchen(tc.hours)}, Timezone: tz, Now: tc.now})
			if len(got.Schedules) != 1 {
				t.Fatalf("schedules = %d, want 1 (venue must be excluded)", len(got.Schedules))
			}
			s := got.Schedules[0]
			if s.IsOpen != tc.wantOpen || s.Message != tc.wantMsg {
				t.Errorf("got open=%v msg=%q, want open=%v msg=%q", s.IsOpen, s.Message, tc.wantOpen, tc.wantMsg)
			}
			if s.Key != "kitchen" || s.ScheduleID != "kitchen-id" {
				t.Errorf("identity not propagated: %+v", s)
			}
		})
	}
}

func TestTemporarilyClosedOverridesEverything(t *testing.T) {
	loc := mustLoc(t)
	now := time.Date(2026, 9, 9, 12, 0, 0, 0, loc)
	got := Compute(Input{
		Schedules: []domain.Schedule{venue(allDays("08:00", "22:00")), kitchen(allDays("11:00", "21:00"))},
		Status:    domain.StatusSettings{Mode: domain.ModeTemporarilyClosed, Message: "Ремонт до пятницы"},
		Timezone:  tz, Now: now,
	})
	if got.Venue.IsOpen || got.Venue.Message != TemporarilyClosedMessage || got.Venue.ClosedMessage != "Ремонт до пятницы" {
		t.Errorf("venue = %+v", got.Venue)
	}
	if got.Venue.Mode != domain.ModeTemporarilyClosed || got.Venue.NextOpenAt != nil {
		t.Errorf("venue mode/next = %+v", got.Venue)
	}
	if got.Venue.OpensAt == nil || *got.Venue.OpensAt != "08:00" {
		t.Errorf("today's hours should still be reported: %+v", got.Venue)
	}
	if len(got.Schedules) != 1 || got.Schedules[0].IsOpen || got.Schedules[0].Message != TemporarilyClosedMessage {
		t.Errorf("schedules = %+v", got.Schedules)
	}
}

func TestUnknownTimezoneFallsBackToUTC(t *testing.T) {
	now := time.Date(2026, 9, 9, 12, 0, 0, 0, time.UTC)
	got := Compute(Input{Schedules: []domain.Schedule{venue(allDays("08:00", "22:00"))}, Timezone: "Mars/Olympus", Now: now})
	if got.Timezone != "UTC" || !got.Venue.IsOpen {
		t.Errorf("got %+v", got)
	}
	if !got.ServerTime.Equal(now) {
		t.Errorf("serverTime = %v", got.ServerTime)
	}
}

func TestParseClock(t *testing.T) {
	for _, bad := range []string{"", "8:00", "24:00", "12:60", "12-00", "ab:cd"} {
		if _, _, ok := ParseClock(bad); ok {
			t.Errorf("ParseClock(%q) should fail", bad)
		}
	}
	h, m, ok := ParseClock("23:59")
	if !ok || h != 23 || m != 59 {
		t.Errorf("ParseClock(23:59) = %d:%d %v", h, m, ok)
	}
}

func deref(s *string) string {
	if s == nil {
		return "<nil>"
	}
	return *s
}
