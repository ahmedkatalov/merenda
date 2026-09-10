package middleware

import (
	"math"
	"net/http"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"merenda/backend/internal/httpapi/respond"
)

// ipLimiter keeps one token bucket per client ip.
type ipLimiter struct {
	mu        sync.Mutex
	entries   map[string]*ipEntry
	limit     rate.Limit
	burst     int
	lastSweep time.Time
	now       func() time.Time
}

type ipEntry struct {
	lim      *rate.Limiter
	lastSeen time.Time
}

const (
	limiterIdle     = 10 * time.Minute
	limiterSweepGap = time.Minute
)

func newIPLimiter(perMinute, burst int) *ipLimiter {
	return &ipLimiter{
		entries: map[string]*ipEntry{},
		limit:   rate.Limit(float64(perMinute) / 60),
		burst:   burst,
		now:     time.Now,
	}
}

// allow reports whether the ip may proceed and, if not, how long to wait.
func (l *ipLimiter) allow(ip string) (bool, time.Duration) {
	now := l.now()
	l.mu.Lock()
	defer l.mu.Unlock()
	if now.Sub(l.lastSweep) > limiterSweepGap {
		for k, e := range l.entries {
			if now.Sub(e.lastSeen) > limiterIdle {
				delete(l.entries, k)
			}
		}
		l.lastSweep = now
	}
	e, ok := l.entries[ip]
	if !ok {
		e = &ipEntry{lim: rate.NewLimiter(l.limit, l.burst)}
		l.entries[ip] = e
	}
	e.lastSeen = now
	res := e.lim.ReserveN(now, 1)
	if !res.OK() {
		return false, time.Minute
	}
	if delay := res.DelayFrom(now); delay > 0 {
		res.CancelAt(now)
		return false, delay
	}
	return true, 0
}

// RateLimit allows perMinute requests per client ip (burst = perMinute) and
// answers 429 with Retry-After otherwise.
func RateLimit(perMinute int) func(http.Handler) http.Handler {
	l := newIPLimiter(perMinute, perMinute)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ok, wait := l.allow(r.RemoteAddr)
			if !ok {
				secs := int(math.Ceil(wait.Seconds()))
				if secs < 1 {
					secs = 1
				}
				w.Header().Set("Retry-After", strconv.Itoa(secs))
				respond.Fail(w, http.StatusTooManyRequests, respond.CodeRateLimited, "Слишком много запросов. Попробуйте позже")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
