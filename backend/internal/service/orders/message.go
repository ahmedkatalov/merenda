package orders

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"merenda/backend/internal/domain"
)

// TypeLabel renders an order type for humans.
func TypeLabel(t domain.OrderType) string {
	if t == domain.OrderDineIn {
		return "В заведении"
	}
	return "На вынос"
}

// FormatMoney renders minor units like "1 150 ₽" (space as thousands separator,
// comma decimals when the currency has them).
//
// Minor units are always hundredths of the currency unit (kopecks): 35000 = 350.00.
// The currency's Decimals field controls only how many fraction digits are shown,
// so RUB (Decimals=0) renders 35000 as "350 ₽" while EUR (Decimals=2) renders
// 115050 as "1 150,50 €". This matches formatMoney() in packages/shared.
func FormatMoney(minor int64, cur domain.Currency) string {
	neg := minor < 0
	if neg {
		minor = -minor
	}
	decimals := cur.Decimals
	if decimals < 0 {
		decimals = 0
	}
	// Re-scale hundredths to `decimals` display digits, rounding half up.
	var units int64 // value expressed in units of 10^-decimals
	if decimals <= 2 {
		scale := int64(1)
		for i := 0; i < 2-decimals; i++ {
			scale *= 10
		}
		units = (minor + scale/2) / scale
	} else {
		mul := int64(1)
		for i := 0; i < decimals-2; i++ {
			mul *= 10
		}
		units = minor * mul
	}
	pow := int64(1)
	for i := 0; i < decimals; i++ {
		pow *= 10
	}
	whole, frac := units/pow, units%pow
	s := groupThousands(whole)
	if decimals > 0 {
		s += "," + fmt.Sprintf("%0*d", decimals, frac)
	}
	if neg {
		s = "-" + s
	}
	symbol := strings.TrimSpace(cur.Symbol)
	if symbol == "" {
		symbol = strings.TrimSpace(cur.Code)
	}
	if symbol != "" {
		s += " " + symbol
	}
	return s
}

func groupThousands(n int64) string {
	digits := strconv.FormatInt(n, 10)
	if len(digits) <= 3 {
		return digits
	}
	var b strings.Builder
	head := len(digits) % 3
	if head > 0 {
		b.WriteString(digits[:head])
	}
	for i := head; i < len(digits); i += 3 {
		if b.Len() > 0 {
			b.WriteByte(' ')
		}
		b.WriteString(digits[i : i+3])
	}
	return b.String()
}

// BuildMessage renders the WhatsApp text exactly as specified in docs/API.md.
func BuildMessage(o domain.OrderSettings, cur domain.Currency, order domain.Order) string {
	title := strings.TrimSpace(o.MessageTitle)
	if title == "" {
		title = "Новый заказ"
	}
	lines := []string{title, fmt.Sprintf("Заказ №%d", order.Number), "Тип: " + TypeLabel(order.Type)}
	if order.CustomerName != "" {
		lines = append(lines, "Имя: "+order.CustomerName)
	}
	if order.CustomerPhone != "" {
		lines = append(lines, "Телефон: "+order.CustomerPhone)
	}
	lines = append(lines, "", "Заказ:")
	for _, it := range order.Items {
		lines = append(lines, fmt.Sprintf("%s × %d — %s", it.Name, it.Quantity, FormatMoney(it.TotalMinor, cur)))
	}
	lines = append(lines, "", "Итого: "+FormatMoney(order.TotalMinor, cur))
	if order.Comment != "" {
		lines = append(lines, "Комментарий: "+order.Comment)
	}
	if footer := strings.TrimSpace(o.MessageFooter); footer != "" {
		lines = append(lines, footer)
	}
	return strings.Join(lines, "\n")
}

// WhatsappURL builds https://wa.me/<digits>?text=<encoded> with %20 for spaces.
func WhatsappURL(digits, message string) string {
	return "https://wa.me/" + digits + "?text=" + strings.ReplaceAll(url.QueryEscape(message), "+", "%20")
}
