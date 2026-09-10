// Package middleware contains the HTTP middleware chain: client ip, request id,
// logging, panic recovery, security headers, body limits, rate limiting and auth.
package middleware

import (
	"net"
	"net/http"
	"strings"
)

// RealIP normalizes r.RemoteAddr to a bare IP. When trustProxy is set the
// X-Real-IP / X-Forwarded-For headers set by the reverse proxy are honoured;
// otherwise they are ignored so clients cannot spoof their address.
func RealIP(trustProxy bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.RemoteAddr = clientIP(r, trustProxy)
			next.ServeHTTP(w, r)
		})
	}
}

func clientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if ip := strings.TrimSpace(r.Header.Get("X-Real-IP")); ip != "" && net.ParseIP(ip) != nil {
			return ip
		}
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			first := strings.TrimSpace(strings.Split(xff, ",")[0])
			if net.ParseIP(first) != nil {
				return first
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
