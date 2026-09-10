package hours

import (
	"fmt"
	"time"
)

// weekdayPrepositional gives "в понедельник", "во вторник" … indexed by Go's time.Weekday.
var weekdayPrepositional = map[time.Weekday]string{
	time.Monday:    "в понедельник",
	time.Tuesday:   "во вторник",
	time.Wednesday: "в среду",
	time.Thursday:  "в четверг",
	time.Friday:    "в пятницу",
	time.Saturday:  "в субботу",
	time.Sunday:    "в воскресенье",
}

func venueMessage(ev evaluation, loc *time.Location) string {
	if ev.isOpen {
		return "Сегодня открыто до " + *clock(ev.active.end, loc)
	}
	if ev.nextOpen == nil {
		return "Закрыто"
	}
	at := *clock(*ev.nextOpen, loc)
	switch ev.nextOffset {
	case 0:
		return "Сегодня откроется в " + at
	case 1:
		return "Откроется завтра в " + at
	default:
		return fmt.Sprintf("Откроется %s в %s", weekdayPrepositional[ev.nextOpen.In(loc).Weekday()], at)
	}
}

func customMessage(name string, ev evaluation, loc *time.Location) string {
	if ev.isOpen {
		return fmt.Sprintf("%s работает до %s", name, *clock(ev.active.end, loc))
	}
	if ev.nextOpen == nil {
		return name + " сегодня не работает"
	}
	at := *clock(*ev.nextOpen, loc)
	switch ev.nextOffset {
	case 0:
		return fmt.Sprintf("%s откроется в %s", name, at)
	case 1:
		return fmt.Sprintf("%s откроется завтра в %s", name, at)
	default:
		return fmt.Sprintf("%s откроется %s в %s", name, weekdayPrepositional[ev.nextOpen.In(loc).Weekday()], at)
	}
}
