package auth

import (
	"strings"
	"testing"
	"time"
)

func TestHashAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("s3cret-pass")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(hash, "$argon2id$v=19$m=65536,t=3,p=2$") {
		t.Fatalf("unexpected encoding: %s", hash)
	}
	ok, err := VerifyPassword(hash, "s3cret-pass")
	if err != nil || !ok {
		t.Fatalf("verify = %v, %v", ok, err)
	}
	ok, _ = VerifyPassword(hash, "wrong")
	if ok {
		t.Fatal("wrong password verified")
	}
	if _, err := VerifyPassword("garbage", "x"); err == nil {
		t.Fatal("expected format error")
	}
}

func TestThrottleProgressiveLock(t *testing.T) {
	th := newLoginThrottle()
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	th.now = func() time.Time { return now }

	for i := 0; i < 4; i++ {
		th.fail("a@b.c")
		if th.retryAfter("A@B.C") != 0 {
			t.Fatalf("locked too early after %d failures", i+1)
		}
	}
	th.fail("a@b.c") // 5th failure → 1s
	if got := th.retryAfter("a@b.c"); got != time.Second {
		t.Fatalf("after 5 failures retry = %v, want 1s", got)
	}
	th.fail("a@b.c") // 6th → 2s
	if got := th.retryAfter("a@b.c"); got != 2*time.Second {
		t.Fatalf("after 6 failures retry = %v, want 2s", got)
	}
	for i := 0; i < 10; i++ {
		th.fail("a@b.c")
	}
	if got := th.retryAfter("a@b.c"); got != 60*time.Second {
		t.Fatalf("lock should cap at 60s, got %v", got)
	}
	now = now.Add(61 * time.Second)
	if th.retryAfter("a@b.c") != 0 {
		t.Fatal("lock should have expired")
	}
	th.reset("a@b.c")
	th.fail("a@b.c")
	if th.retryAfter("a@b.c") != 0 {
		t.Fatal("reset should clear the counter")
	}
}

func TestRetryMessagePlurals(t *testing.T) {
	cases := map[time.Duration]string{
		time.Second:             "Слишком много попыток. Попробуйте через 1 секунду",
		2 * time.Second:         "Слишком много попыток. Попробуйте через 2 секунды",
		5 * time.Second:         "Слишком много попыток. Попробуйте через 5 секунд",
		11 * time.Second:        "Слишком много попыток. Попробуйте через 11 секунд",
		21 * time.Second:        "Слишком много попыток. Попробуйте через 21 секунду",
		30 * time.Second:        "Слишком много попыток. Попробуйте через 30 секунд",
		1500 * time.Millisecond: "Слишком много попыток. Попробуйте через 2 секунды",
	}
	for d, want := range cases {
		if got := RetryMessage(d); got != want {
			t.Errorf("RetryMessage(%v) = %q, want %q", d, got, want)
		}
	}
}

func TestAccessTokenRoundTrip(t *testing.T) {
	s := New(nil, nil, Options{Secret: "0123456789abcdef0123456789abcdef", AccessTTL: time.Minute})
	token, err := s.signAccessToken("admin-1", "sess-1", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	claims, err := s.ParseAccessToken(token)
	if err != nil || claims.AdminID != "admin-1" || claims.SessionID != "sess-1" {
		t.Fatalf("claims = %+v, err = %v", claims, err)
	}
	other := New(nil, nil, Options{Secret: "another-secret-another-secret-xx", AccessTTL: time.Minute})
	if _, err := other.ParseAccessToken(token); err == nil {
		t.Fatal("token verified with a different secret")
	}
	expired, _ := s.signAccessToken("admin-1", "sess-1", time.Now().Add(-2*time.Minute))
	if _, err := s.ParseAccessToken(expired); err == nil {
		t.Fatal("expired token accepted")
	}
}
