// Package storage abstracts where media files live. Handlers and services only
// see relative paths; the implementation decides the physical location.
package storage

import (
	"context"
	"io"
)

// Storage persists media files addressed by a relative path such as "ab/abcdef.jpg".
type Storage interface {
	// Save writes the reader's content to relPath, creating parent directories.
	Save(ctx context.Context, relPath string, r io.Reader) (int64, error)
	// Delete removes the file; a missing file is not an error.
	Delete(ctx context.Context, relPath string) error
	// PublicURL returns the root-relative URL clients use to fetch the file.
	PublicURL(relPath string) string
}
