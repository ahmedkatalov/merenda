package domain

import "time"

type ScheduleKind string

const (
	ScheduleVenue  ScheduleKind = "venue"
	ScheduleCustom ScheduleKind = "custom"
)

// ScheduleDay mirrors `ScheduleDay`. Weekday: 0 = Monday … 6 = Sunday.
type ScheduleDay struct {
	Weekday  int    `json:"weekday"`
	IsClosed bool   `json:"isClosed"`
	OpensAt  string `json:"opensAt"`
	ClosesAt string `json:"closesAt"`
}

// ScheduleException mirrors `ScheduleException`.
type ScheduleException struct {
	ID         string  `json:"id"`
	ScheduleID string  `json:"scheduleId"`
	Date       string  `json:"date"`
	IsClosed   bool    `json:"isClosed"`
	OpensAt    *string `json:"opensAt"`
	ClosesAt   *string `json:"closesAt"`
	Note       string  `json:"note"`
}

// Schedule mirrors `Schedule`.
type Schedule struct {
	ID         string              `json:"id"`
	Key        string              `json:"key"`
	Name       string              `json:"name"`
	Kind       ScheduleKind        `json:"kind"`
	SortOrder  int                 `json:"sortOrder"`
	Hours      []ScheduleDay       `json:"hours"`
	Exceptions []ScheduleException `json:"exceptions"`
	CreatedAt  time.Time           `json:"createdAt"`
	UpdatedAt  time.Time           `json:"updatedAt"`
}

// ScheduleInput mirrors `ScheduleInput`.
type ScheduleInput struct {
	Name string  `json:"name"`
	Key  *string `json:"key"`
}

// ScheduleHoursInput mirrors `ScheduleHoursInput`.
type ScheduleHoursInput struct {
	Hours []ScheduleDay `json:"hours"`
}

// ScheduleExceptionInput mirrors `ScheduleExceptionInput`.
type ScheduleExceptionInput struct {
	Date     string  `json:"date"`
	IsClosed bool    `json:"isClosed"`
	OpensAt  *string `json:"opensAt"`
	ClosesAt *string `json:"closesAt"`
	Note     *string `json:"note"`
}

// ScheduleStatus mirrors `ScheduleStatus`.
type ScheduleStatus struct {
	ScheduleID string  `json:"scheduleId"`
	Key        string  `json:"key"`
	Name       string  `json:"name"`
	IsOpen     bool    `json:"isOpen"`
	OpensAt    *string `json:"opensAt"`
	ClosesAt   *string `json:"closesAt"`
	NextOpenAt *string `json:"nextOpenAt"`
	Message    string  `json:"message"`
}

// VenueStatus is the `venue` part of `SiteStatus`.
type VenueStatus struct {
	Mode          VenueMode `json:"mode"`
	IsOpen        bool      `json:"isOpen"`
	ClosedMessage string    `json:"closedMessage"`
	Message       string    `json:"message"`
	OpensAt       *string   `json:"opensAt"`
	ClosesAt      *string   `json:"closesAt"`
	NextOpenAt    *string   `json:"nextOpenAt"`
}

// SiteStatus mirrors `SiteStatus`.
type SiteStatus struct {
	ServerTime time.Time        `json:"serverTime"`
	Timezone   string           `json:"timezone"`
	Venue      VenueStatus      `json:"venue"`
	Schedules  []ScheduleStatus `json:"schedules"`
}

// PublicSchedule mirrors `PublicSchedule`.
type PublicSchedule struct {
	ID    string        `json:"id"`
	Key   string        `json:"key"`
	Name  string        `json:"name"`
	Kind  ScheduleKind  `json:"kind"`
	Hours []ScheduleDay `json:"hours"`
}

// DefaultHours returns the 7 default day rows for a new schedule.
func DefaultHours() []ScheduleDay {
	days := make([]ScheduleDay, 7)
	for i := range days {
		days[i] = ScheduleDay{Weekday: i, IsClosed: false, OpensAt: "09:00", ClosesAt: "21:00"}
	}
	return days
}
