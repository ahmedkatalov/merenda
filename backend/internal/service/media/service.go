// Package media handles uploads: MIME sniffing, size caps, random file names,
// dimension detection and thumb/medium variants for raster images.
package media

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"image"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strings"
	"unicode"

	// Register decoders for DecodeConfig / Decode.
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"

	_ "golang.org/x/image/webp"

	"merenda/backend/internal/domain"
	"merenda/backend/internal/repo"
	"merenda/backend/internal/storage"
)

// allowed maps sniffed MIME types to the stored extension.
var allowed = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
	"image/gif":  "gif",
}

const (
	maxAltLen          = 300
	maxOriginalNameLen = 200
	maxPixels          = 60_000_000 // decompression-bomb guard (~7700×7700)
)

// Service is the media use-case layer.
type Service struct {
	repos    *repo.Repos
	store    storage.Storage
	maxBytes int64
	log      *slog.Logger
}

// New creates the service; maxBytes caps the accepted file size.
func New(repos *repo.Repos, store storage.Storage, maxBytes int64, log *slog.Logger) *Service {
	return &Service{repos: repos, store: store, maxBytes: maxBytes, log: log}
}

// MaxBytes is the configured upload cap.
func (s *Service) MaxBytes() int64 { return s.maxBytes }

// Upload validates and stores one file, generating variants for jpeg/png/webp.
func (s *Service) Upload(ctx context.Context, src io.Reader, originalName, alt string) (domain.Media, error) {
	data, err := io.ReadAll(io.LimitReader(src, s.maxBytes+1))
	if err != nil {
		return domain.Media{}, err
	}
	if int64(len(data)) > s.maxBytes {
		return domain.Media{}, domain.ErrPayloadTooLarge
	}
	if len(data) == 0 {
		return domain.Media{}, domain.NewValidation("file", "Файл пуст")
	}
	mime := sniff(data)
	ext, ok := allowed[mime]
	if !ok {
		return domain.Media{}, domain.ErrUnsupportedMedia
	}
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return domain.Media{}, domain.ErrUnsupportedMedia
	}
	if cfg.Width <= 0 || cfg.Height <= 0 || cfg.Width*cfg.Height > maxPixels {
		return domain.Media{}, domain.NewValidation("file", "Слишком большое изображение")
	}
	alt = strings.TrimSpace(alt)
	if len([]rune(alt)) > maxAltLen {
		return domain.Media{}, domain.NewValidation("alt", "Слишком длинное описание")
	}

	dir, base, err := randomName()
	if err != nil {
		return domain.Media{}, err
	}
	rec := domain.MediaRecord{
		Kind: domain.MediaImage, Mime: mime, Path: dir + "/" + base + "." + ext,
		Width: cfg.Width, Height: cfg.Height, Size: int64(len(data)),
		OriginalName: cleanOriginalName(originalName, ext), Alt: alt,
	}
	if mime == "image/gif" {
		rec.Kind = domain.MediaGIF
	}

	var saved []string
	cleanup := func() {
		for _, p := range saved {
			if err := s.store.Delete(context.WithoutCancel(ctx), p); err != nil {
				s.log.Warn("cleanup media file", "path", p, "err", err)
			}
		}
	}
	if _, err := s.store.Save(ctx, rec.Path, bytes.NewReader(data)); err != nil {
		return domain.Media{}, err
	}
	saved = append(saved, rec.Path)

	if rec.Kind == domain.MediaImage {
		img, _, err := image.Decode(bytes.NewReader(data))
		if err != nil {
			cleanup()
			return domain.Media{}, domain.ErrUnsupportedMedia
		}
		variants := []struct {
			name string
			box  int
			dst  *string
		}{{"thumb", thumbBox, &rec.ThumbPath}, {"medium", mediumBox, &rec.MediumPath}}
		for _, v := range variants {
			encoded, ok, err := encodeVariant(img, v.box, mime)
			if err != nil {
				cleanup()
				return domain.Media{}, fmt.Errorf("encode %s variant: %w", v.name, err)
			}
			if !ok {
				continue // source already fits → '' means "use original"
			}
			path := dir + "/" + base + "_" + v.name + "." + variantExt(mime)
			if _, err := s.store.Save(ctx, path, bytes.NewReader(encoded)); err != nil {
				cleanup()
				return domain.Media{}, err
			}
			saved = append(saved, path)
			*v.dst = path
		}
	}

	created, err := s.repos.Media.Create(ctx, rec)
	if err != nil {
		cleanup()
		return domain.Media{}, err
	}
	return s.repos.Media.View(created), nil
}

// List returns a page of media.
func (s *Service) List(ctx context.Context, q domain.MediaQuery) (domain.Paginated[domain.Media], error) {
	if q.Kind != "" && q.Kind != string(domain.MediaImage) && q.Kind != string(domain.MediaGIF) {
		return domain.Paginated[domain.Media]{}, domain.NewValidation("kind", "Допустимые значения: image, gif")
	}
	return s.repos.Media.List(ctx, q)
}

// Get loads one media item.
func (s *Service) Get(ctx context.Context, id string) (domain.Media, error) {
	if !domain.IsUUID(id) {
		return domain.Media{}, domain.ErrNotFound
	}
	rec, err := s.repos.Media.ByID(ctx, id)
	if err != nil {
		return domain.Media{}, err
	}
	return s.repos.Media.View(rec), nil
}

// UpdateAlt changes the alt text.
func (s *Service) UpdateAlt(ctx context.Context, id, alt string) (domain.Media, error) {
	if !domain.IsUUID(id) {
		return domain.Media{}, domain.ErrNotFound
	}
	alt = strings.TrimSpace(alt)
	if len([]rune(alt)) > maxAltLen {
		return domain.Media{}, domain.NewValidation("alt", "Слишком длинное описание")
	}
	rec, err := s.repos.Media.UpdateAlt(ctx, id, alt)
	if err != nil {
		return domain.Media{}, err
	}
	return s.repos.Media.View(rec), nil
}

// Delete removes the row (references become NULL) and then the files.
func (s *Service) Delete(ctx context.Context, id string) error {
	if !domain.IsUUID(id) {
		return domain.ErrNotFound
	}
	rec, err := s.repos.Media.ByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repos.Media.Delete(ctx, id); err != nil {
		return err
	}
	for _, p := range []string{rec.Path, rec.ThumbPath, rec.MediumPath} {
		if p == "" {
			continue
		}
		if err := s.store.Delete(context.WithoutCancel(ctx), p); err != nil {
			s.log.Warn("delete media file", "path", p, "err", err)
		}
	}
	return nil
}

// sniff detects the MIME type from the first 512 bytes, ignoring the extension.
func sniff(data []byte) string {
	head := data
	if len(head) > 512 {
		head = head[:512]
	}
	mime := http.DetectContentType(head)
	if i := strings.IndexByte(mime, ';'); i >= 0 {
		mime = mime[:i]
	}
	return strings.TrimSpace(mime)
}

// randomName returns a 2-hex directory and a 32-hex file base name.
func randomName() (dir, base string, err error) {
	var buf [17]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", "", fmt.Errorf("random file name: %w", err)
	}
	return hex.EncodeToString(buf[:1]), hex.EncodeToString(buf[1:]), nil
}

// cleanOriginalName keeps only the base name with printable characters.
func cleanOriginalName(name, ext string) string {
	name = filepath.Base(strings.TrimSpace(strings.ReplaceAll(name, "\\", "/")))
	if name == "." || name == "/" {
		name = ""
	}
	name = strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, name)
	if runes := []rune(name); len(runes) > maxOriginalNameLen {
		name = string(runes[:maxOriginalNameLen])
	}
	if name == "" {
		name = "image." + ext
	}
	return name
}
