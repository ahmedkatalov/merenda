// Package hours computes open/closed status from schedules, exceptions and the venue mode.
package hours

import (
	"fmt"
	"time"

	"merenda/backend/internal/domain"
)

// Input is everything the engine needs; it performs no I/O.
type Input struct {
	Schedules []domain.Schedule
	Status    domain.StatusSettings
	Timezone  string
	Now       time.Time
}

// TemporarilyClosedMessage is shown while the admin has forced the venue closed.
const TemporarilyClosedMessage = "Временно закрыто"

// lookahead is how many days ahead nextOpenAt is searched.
const lookahead = 8

// interval is one open period in local time.
type interval struct {
	start, end time.Time
}

// evaluation is the raw result for one schedule before messages are attached.
type evaluation struct {
	isOpen     bool
	active     *interval // the interval we are inside, when open
	today      *interval // today's interval, when the day is not closed
	nextOpen   *time.Time
	nextOffset int // days from today to nextOpen (0 = today, 1 = tomorrow)
}

// Compute builds the SiteStatus for all schedules at in.Now.
func Compute(in Input) domain.SiteStatus {
	loc := loadLocation(in.Timezone)
	now := in.Now.In(loc)
	out := domain.SiteStatus{
		ServerTime: in.Now.UTC(),
		Timezone:   loc.String(),
		Venue:      domain.VenueStatus{Mode: domain.ModeAuto, Message: "Закрыто"},
		Schedules:  []domain.ScheduleStatus{},
	}
	if in.Status.Mode == domain.ModeTemporarilyClosed {
		out.Venue.Mode = domain.ModeTemporarilyClosed
	}
	closedByAdmin := out.Venue.Mode == domain.ModeTemporarilyClosed

	for _, s := range in.Schedules {
		ev := evaluate(s, now, loc)
		if s.Kind == domain.ScheduleVenue {
			out.Venue.IsOpen = ev.isOpen
			out.Venue.OpensAt, out.Venue.ClosesAt = ev.hoursOfDay(loc)
			out.Venue.NextOpenAt = ev.nextOpenISO()
			out.Venue.Message = venueMessage(ev, loc)
			continue
		}
		st := domain.ScheduleStatus{ScheduleID: s.ID, Key: s.Key, Name: s.Name, IsOpen: ev.isOpen, Message: customMessage(s.Name, ev, loc)}
		st.OpensAt, st.ClosesAt = ev.hoursOfDay(loc)
		st.NextOpenAt = ev.nextOpenISO()
		if closedByAdmin {
			st.IsOpen, st.NextOpenAt, st.Message = false, nil, TemporarilyClosedMessage
		}
		out.Schedules = append(out.Schedules, st)
	}

	if closedByAdmin {
		out.Venue.IsOpen = false
		out.Venue.NextOpenAt = nil
		out.Venue.Message = TemporarilyClosedMessage
		out.Venue.ClosedMessage = in.Status.Message
	}
	return out
}

// IsScheduleOpen reports whether a single schedule is open at now (ignores the admin override).
func IsScheduleOpen(s domain.Schedule, now time.Time, timezone string) bool {
	loc := loadLocation(timezone)
	return evaluate(s, now.In(loc), loc).isOpen
}

func loadLocation(name string) *time.Location {
	if loc, err := time.LoadLocation(name); err == nil && name != "" {
		return loc
	}
	return time.UTC
}

// evaluate resolves open state, today's hours and the next opening for one schedule.
func evaluate(s domain.Schedule, now time.Time, loc *time.Location) evaluation {
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	var ev evaluation

	// An overnight interval that started yesterday may still be running.
	if iv, ok := intervalFor(s, today.AddDate(0, 0, -1), loc); ok && iv.end.After(today) && contains(iv, now) {
		ev.isOpen, ev.active = true, &iv
	}
	if iv, ok := intervalFor(s, today, loc); ok {
		ev.today = &iv
		if !ev.isOpen && contains(iv, now) {
			ev.isOpen, ev.active = true, &iv
		}
	}
	if ev.isOpen {
		return ev
	}
	for d := 0; d <= lookahead; d++ {
		iv, ok := intervalFor(s, today.AddDate(0, 0, d), loc)
		if ok && iv.start.After(now) {
			start := iv.start
			ev.nextOpen, ev.nextOffset = &start, d
			break
		}
	}
	return ev
}

func contains(iv interval, t time.Time) bool { return !t.Before(iv.start) && t.Before(iv.end) }

// intervalFor returns the open interval that starts on the given local date, applying exceptions.
func intervalFor(s domain.Schedule, day time.Time, loc *time.Location) (interval, bool) {
	weekday := (int(day.Weekday()) + 6) % 7 // Go: Sunday=0 → contract: Monday=0
	var opens, closes string
	var closed bool
	for _, h := range s.Hours {
		if h.Weekday == weekday {
			opens, closes, closed = h.OpensAt, h.ClosesAt, h.IsClosed
			break
		}
	}
	date := day.Format("2006-01-02")
	for _, ex := range s.Exceptions {
		if ex.Date != date {
			continue
		}
		if ex.IsClosed {
			return interval{}, false
		}
		closed = false
		if ex.OpensAt != nil && *ex.OpensAt != "" {
			opens = *ex.OpensAt
		}
		if ex.ClosesAt != nil && *ex.ClosesAt != "" {
			closes = *ex.ClosesAt
		}
		break
	}
	if closed {
		return interval{}, false
	}
	oh, om, ok1 := ParseClock(opens)
	ch, cm, ok2 := ParseClock(closes)
	if !ok1 || !ok2 {
		return interval{}, false
	}
	start := time.Date(day.Year(), day.Month(), day.Day(), oh, om, 0, 0, loc)
	end := time.Date(day.Year(), day.Month(), day.Day(), ch, cm, 0, 0, loc)
	if !end.After(start) {
		end = time.Date(day.Year(), day.Month(), day.Day()+1, ch, cm, 0, 0, loc)
	}
	return interval{start: start, end: end}, true
}

// ParseClock parses "HH:MM" (24h).
func ParseClock(v string) (hour, minute int, ok bool) {
	if len(v) != 5 || v[2] != ':' {
		return 0, 0, false
	}
	if _, err := fmt.Sscanf(v, "%02d:%02d", &hour, &minute); err != nil {
		return 0, 0, false
	}
	if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return 0, 0, false
	}
	return hour, minute, true
}

func clock(t time.Time, loc *time.Location) *string {
	s := t.In(loc).Format("15:04")
	return &s
}

// hoursOfDay returns the interval to display: the active one when open, otherwise today's.
func (ev evaluation) hoursOfDay(loc *time.Location) (opens, closes *string) {
	iv := ev.today
	if ev.active != nil {
		iv = ev.active
	}
	if iv == nil {
		return nil, nil
	}
	return clock(iv.start, loc), clock(iv.end, loc)
}

func (ev evaluation) nextOpenISO() *string {
	if ev.nextOpen == nil {
		return nil
	}
	s := ev.nextOpen.UTC().Format(time.RFC3339)
	return &s
}
