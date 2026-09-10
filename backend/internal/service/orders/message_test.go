package orders

import (
	"strings"
	"testing"

	"merenda/backend/internal/domain"
)

func TestFormatMoney(t *testing.T) {
	rub := domain.Currency{Code: "RUB", Symbol: "₽", Decimals: 0}
	eur := domain.Currency{Code: "EUR", Symbol: "€", Decimals: 2}
	cases := []struct {
		minor int64
		cur   domain.Currency
		want  string
	}{
		// minor units are kopecks (÷100); Decimals only controls display precision.
		{35000, rub, "350 ₽"},
		{115000, rub, "1 150 ₽"},
		{45000, rub, "450 ₽"},
		{0, rub, "0 ₽"},
		{123456700, rub, "1 234 567 ₽"},
		{115050, eur, "1 150,50 €"},
		{5, eur, "0,05 €"},
		{-250000, rub, "-2 500 ₽"},
		{10000, domain.Currency{Code: "USD"}, "100 USD"},
	}
	for _, c := range cases {
		if got := FormatMoney(c.minor, c.cur); got != c.want {
			t.Errorf("FormatMoney(%d) = %q, want %q", c.minor, got, c.want)
		}
	}
}

func TestBuildMessage(t *testing.T) {
	cur := domain.Currency{Code: "RUB", Symbol: "₽"}
	o := domain.OrderSettings{MessageTitle: "Новый заказ — Меренда", MessageFooter: "Спасибо!"}
	order := domain.Order{
		Number: 1042, Type: domain.OrderTakeaway, CustomerName: "Иван", CustomerPhone: "+7 999 123-45-67",
		Comment: "без сахара", TotalMinor: 115000,
		Items: []domain.OrderItem{{Name: "Капучино", Quantity: 2, TotalMinor: 70000}, {Name: "Чизкейк", Quantity: 1, TotalMinor: 45000}},
	}
	want := strings.Join([]string{
		"Новый заказ — Меренда",
		"Заказ №1042",
		"Тип: На вынос",
		"Имя: Иван",
		"Телефон: +7 999 123-45-67",
		"",
		"Заказ:",
		"Капучино × 2 — 700 ₽",
		"Чизкейк × 1 — 450 ₽",
		"",
		"Итого: 1 150 ₽",
		"Комментарий: без сахара",
		"Спасибо!",
	}, "\n")
	if got := BuildMessage(o, cur, order); got != want {
		t.Errorf("message mismatch:\n%s\n--- want ---\n%s", got, want)
	}

	minimal := domain.Order{Number: 7, Type: domain.OrderDineIn, TotalMinor: 35000, Items: []domain.OrderItem{{Name: "Латте", Quantity: 1, TotalMinor: 35000}}}
	got := BuildMessage(domain.OrderSettings{}, cur, minimal)
	if !strings.HasPrefix(got, "Новый заказ\nЗаказ №7\nТип: В заведении\n\nЗаказ:\n") || strings.Contains(got, "Имя:") || strings.Contains(got, "Комментарий:") {
		t.Errorf("optional lines must be omitted, got:\n%s", got)
	}
	if !strings.HasSuffix(got, "Итого: 350 ₽") {
		t.Errorf("empty footer must not add a trailing line, got:\n%s", got)
	}
}

func TestWhatsappURL(t *testing.T) {
	got := WhatsappURL("4915123456789", "Новый заказ\nИтого: 1 150 ₽ + чай")
	if !strings.HasPrefix(got, "https://wa.me/4915123456789?text=") {
		t.Fatalf("unexpected prefix: %s", got)
	}
	if strings.Contains(got, "+") || !strings.Contains(got, "%20") || !strings.Contains(got, "%0A") {
		t.Errorf("spaces must be %%20 and newlines %%0A: %s", got)
	}
}

func TestMergeLines(t *testing.T) {
	a, b := "11111111-0000-4000-8000-000000000001", "11111111-0000-4000-8000-000000000002"
	f := domain.Fields{}
	lines := mergeLines(f, []domain.CreateOrderItem{{ProductID: a, Quantity: 2}, {ProductID: b, Quantity: 1}, {ProductID: a, Quantity: 3}})
	if len(f) != 0 {
		t.Fatalf("unexpected errors: %v", f)
	}
	if len(lines) != 2 || lines[0].productID != a || lines[0].quantity != 5 || lines[1].quantity != 1 {
		t.Fatalf("merge failed: %+v", lines)
	}
	f = domain.Fields{}
	mergeLines(f, nil)
	if _, ok := f["items"]; !ok {
		t.Error("empty items must fail")
	}
	f = domain.Fields{}
	mergeLines(f, []domain.CreateOrderItem{{ProductID: a, Quantity: 100}})
	if _, ok := f["items"]; !ok {
		t.Error("quantity > 99 must fail")
	}
	f = domain.Fields{}
	mergeLines(f, []domain.CreateOrderItem{{ProductID: "nope", Quantity: 1}})
	if _, ok := f["items"]; !ok {
		t.Error("bad uuid must fail")
	}
}
