package auth

import (
	"fmt"
	"math"
	"strings"
	"sync"
	"time"
)

// loginThrottle applies a progressive per-email lockout after repeated failures.
type loginThrottle struct {
	mu      sync.Mutex
	entries map[string]*throttleEntry
	now     func() time.Time
}

type throttleEntry struct {
	failures    int
	lockedUntil time.Time
	lastSeen    time.Time
}

const (
	throttleFreeAttempts = 5
	throttleMaxLock      = 60 * time.Second
	throttleForget       = time.Hour
)

func newLoginThrottle() *loginThrottle {
	return &loginThrottle{entries: map[string]*throttleEntry{}, now: time.Now}
}

// retryAfter returns how long the e-mail is still locked (0 when allowed).
func (t *loginThrottle) retryAfter(email string) time.Duration {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.sweep()
	e, ok := t.entries[normalizeEmail(email)]
	if !ok {
		return 0
	}
	if rest := e.lockedUntil.Sub(t.now()); rest > 0 {
		return rest
	}
	return 0
}

// fail records a failed attempt; from the 5th failure on, the lock grows as min(2^(n-5), 60) seconds.
func (t *loginThrottle) fail(email string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	key := normalizeEmail(email)
	e, ok := t.entries[key]
	if !ok {
		e = &throttleEntry{}
		t.entries[key] = e
	}
	e.failures++
	e.lastSeen = t.now()
	if e.failures >= throttleFreeAttempts {
		secs := math.Min(math.Pow(2, float64(e.failures-throttleFreeAttempts)), throttleMaxLock.Seconds())
		e.lockedUntil = t.now().Add(time.Duration(secs * float64(time.Second)))
	}
}

// reset clears the counter after a successful login.
func (t *loginThrottle) reset(email string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.entries, normalizeEmail(email))
}

func (t *loginThrottle) sweep() {
	cutoff := t.now().Add(-throttleForget)
	for k, e := range t.entries {
		if e.lastSeen.Before(cutoff) {
			delete(t.entries, k)
		}
	}
}

func normalizeEmail(email string) string { return strings.ToLower(strings.TrimSpace(email)) }

// RetryMessage renders "Слишком много попыток. Попробуйте через 30 секунд".
func RetryMessage(d time.Duration) string {
	secs := int(math.Ceil(d.Seconds()))
	if secs < 1 {
		secs = 1
	}
	return fmt.Sprintf("Слишком много попыток. Попробуйте через %d %s", secs, pluralSeconds(secs))
}

func pluralSeconds(n int) string {
	n100 := n % 100
	n10 := n % 10
	switch {
	case n100 >= 11 && n100 <= 19:
		return "секунд"
	case n10 == 1:
		return "секунду"
	case n10 >= 2 && n10 <= 4:
		return "секунды"
	default:
		return "секунд"
	}
}
