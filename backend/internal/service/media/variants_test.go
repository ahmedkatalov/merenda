package media

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

func TestFitSize(t *testing.T) {
	cases := []struct {
		w, h, box  int
		wantW      int
		wantH      int
		wantResize bool
	}{
		{400, 300, 480, 400, 300, false},
		{480, 480, 480, 480, 480, false},
		{1600, 1200, 480, 480, 360, true},
		{1200, 1600, 480, 360, 480, true},
		{3000, 100, 1400, 1400, 47, true},
		{100, 3000, 1400, 47, 1400, true},
	}
	for _, c := range cases {
		w, h, ok := fitSize(c.w, c.h, c.box)
		if w != c.wantW || h != c.wantH || ok != c.wantResize {
			t.Errorf("fitSize(%d,%d,%d) = %d,%d,%v want %d,%d,%v", c.w, c.h, c.box, w, h, ok, c.wantW, c.wantH, c.wantResize)
		}
	}
}

func TestEncodeVariant(t *testing.T) {
	src := image.NewRGBA(image.Rect(0, 0, 1000, 500))
	for y := 0; y < 500; y++ {
		for x := 0; x < 1000; x++ {
			src.Set(x, y, color.RGBA{uint8(x % 256), uint8(y % 256), 0, 255})
		}
	}
	data, ok, err := encodeVariant(src, 480, "image/jpeg")
	if err != nil || !ok {
		t.Fatalf("jpeg variant: ok=%v err=%v", ok, err)
	}
	cfg, err := jpeg.DecodeConfig(bytes.NewReader(data))
	if err != nil || cfg.Width != 480 || cfg.Height != 240 {
		t.Fatalf("jpeg variant size = %dx%d err=%v", cfg.Width, cfg.Height, err)
	}
	data, ok, err = encodeVariant(src, 480, "image/png")
	if err != nil || !ok {
		t.Fatalf("png variant: ok=%v err=%v", ok, err)
	}
	pcfg, err := png.DecodeConfig(bytes.NewReader(data))
	if err != nil || pcfg.Width != 480 || pcfg.Height != 240 {
		t.Fatalf("png variant size = %dx%d err=%v", pcfg.Width, pcfg.Height, err)
	}
	// 1000×500 fits in 1400 → the medium variant must be skipped.
	if _, ok, _ := encodeVariant(src, 1400, "image/png"); ok {
		t.Fatal("medium variant must be skipped when the source fits")
	}
}

func TestSniff(t *testing.T) {
	var buf bytes.Buffer
	_ = png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, 2, 2)))
	if got := sniff(buf.Bytes()); got != "image/png" {
		t.Errorf("sniff png = %q", got)
	}
	if got := sniff([]byte("<html><body>hi</body></html>")); got != "text/html" {
		t.Errorf("sniff html = %q", got)
	}
}

func TestCleanOriginalName(t *testing.T) {
	if got := cleanOriginalName("../../etc/passwd\x00.png", "png"); got != "passwd.png" {
		t.Errorf("got %q", got)
	}
	if got := cleanOriginalName("", "jpg"); got != "image.jpg" {
		t.Errorf("got %q", got)
	}
	if got := cleanOriginalName(`C:\Users\me\Фото кофе.JPG`, "jpg"); got != "Фото кофе.JPG" {
		t.Errorf("got %q", got)
	}
}
