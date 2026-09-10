package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// accessClaims is the HS256 access token payload: sub (admin id), sid (session id), iat, exp.
type accessClaims struct {
	SessionID string `json:"sid"`
	jwt.RegisteredClaims
}

// Claims is the validated content of an access token.
type Claims struct {
	AdminID   string
	SessionID string
}

func (s *Service) signAccessToken(adminID, sessionID string, now time.Time) (string, error) {
	claims := accessClaims{
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   adminID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}
	return token, nil
}

// ParseAccessToken validates signature and expiry and returns the claims.
func (s *Service) ParseAccessToken(raw string) (Claims, error) {
	var claims accessClaims
	_, err := jwt.ParseWithClaims(raw, &claims, func(t *jwt.Token) (any, error) { return s.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
	if err != nil {
		return Claims{}, err
	}
	if claims.Subject == "" || claims.SessionID == "" {
		return Claims{}, errors.New("token missing sub/sid")
	}
	return Claims{AdminID: claims.Subject, SessionID: claims.SessionID}, nil
}

// newRefreshToken returns 32 random bytes as hex plus its SHA-256 hex digest for storage.
func newRefreshToken() (token, hash string, err error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}
	token = hex.EncodeToString(buf)
	return token, hashToken(token), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
