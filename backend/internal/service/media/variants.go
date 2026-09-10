package media

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"

	"golang.org/x/image/draw"
)

const (
	thumbBox    = 480
	mediumBox   = 1400
	jpegQuality = 85
)

// fitSize scales (w, h) to fit inside box×box preserving aspect ratio. ok is
// false when the source already fits (no variant needed).
func fitSize(w, h, box int) (int, int, bool) {
	if w <= 0 || h <= 0 || (w <= box && h <= box) {
		return w, h, false
	}
	if w >= h {
		return box, maxInt(1, int(float64(h)*float64(box)/float64(w)+0.5)), true
	}
	return maxInt(1, int(float64(w)*float64(box)/float64(h)+0.5)), box, true
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// variantExt is the file extension of a generated variant for the source mime.
func variantExt(mime string) string {
	if mime == "image/png" {
		return "png"
	}
	return "jpg"
}

// encodeVariant resizes img to fit box and encodes it as PNG (png sources) or
// JPEG q85 (everything else, flattened onto white). ok=false means the source
// is already small enough and no variant should be written.
func encodeVariant(img image.Image, box int, mime string) ([]byte, bool, error) {
	b := img.Bounds()
	w, h, ok := fitSize(b.Dx(), b.Dy(), box)
	if !ok {
		return nil, false, nil
	}
	dst := image.NewRGBA(image.Rect(0, 0, w, h))
	var buf bytes.Buffer
	if mime == "image/png" {
		draw.CatmullRom.Scale(dst, dst.Bounds(), img, b, draw.Src, nil)
		if err := png.Encode(&buf, dst); err != nil {
			return nil, false, err
		}
		return buf.Bytes(), true, nil
	}
	draw.Draw(dst, dst.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, b, draw.Over, nil)
	if err := jpeg.Encode(&buf, dst, &jpeg.Options{Quality: jpegQuality}); err != nil {
		return nil, false, err
	}
	return buf.Bytes(), true, nil
}
