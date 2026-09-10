package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// Local stores files on disk under a root directory and serves them over HTTP.
type Local struct {
	root      string
	urlPrefix string
}

// NewLocal creates the root directory if needed.
func NewLocal(root, urlPrefix string) (*Local, error) {
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve upload dir: %w", err)
	}
	if err := os.MkdirAll(abs, 0o755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &Local{root: abs, urlPrefix: strings.TrimRight(urlPrefix, "/")}, nil
}

// Root returns the absolute upload directory.
func (l *Local) Root() string { return l.root }

// Save implements Storage.
func (l *Local) Save(_ context.Context, relPath string, r io.Reader) (int64, error) {
	full, err := l.resolve(relPath)
	if err != nil {
		return 0, err
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return 0, fmt.Errorf("create media dir: %w", err)
	}
	f, err := os.OpenFile(full, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o644)
	if err != nil {
		return 0, fmt.Errorf("create media file: %w", err)
	}
	n, err := io.Copy(f, r)
	if cerr := f.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		_ = os.Remove(full)
		return 0, fmt.Errorf("write media file: %w", err)
	}
	return n, nil
}

// Delete implements Storage.
func (l *Local) Delete(_ context.Context, relPath string) error {
	if relPath == "" {
		return nil
	}
	full, err := l.resolve(relPath)
	if err != nil {
		return err
	}
	if err := os.Remove(full); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("delete media file: %w", err)
	}
	return nil
}

// PublicURL implements Storage.
func (l *Local) PublicURL(relPath string) string {
	return l.urlPrefix + "/" + strings.TrimLeft(filepath.ToSlash(relPath), "/")
}

// Handler serves files below the root with immutable caching and no directory listing.
// The request path must already be stripped of the URL prefix.
func (l *Local) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		full, err := l.resolve(strings.TrimPrefix(r.URL.Path, "/"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		info, err := os.Stat(full)
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		http.ServeFile(w, r, full)
	})
}

// resolve turns a relative path into an absolute one, refusing traversal.
func (l *Local) resolve(relPath string) (string, error) {
	clean := path.Clean("/" + filepath.ToSlash(relPath))
	if clean == "/" || strings.Contains(clean, "..") {
		return "", fmt.Errorf("invalid media path %q", relPath)
	}
	full := filepath.Join(l.root, filepath.FromSlash(clean))
	if !strings.HasPrefix(full, l.root+string(filepath.Separator)) {
		return "", fmt.Errorf("media path escapes root: %q", relPath)
	}
	return full, nil
}
