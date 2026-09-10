package domain

import "time"

type OrderType string

const (
	OrderDineIn   OrderType = "dine_in"
	OrderTakeaway OrderType = "takeaway"
)

type OrderStatus string

const (
	OrderNew       OrderStatus = "new"
	OrderConfirmed OrderStatus = "confirmed"
	OrderCompleted OrderStatus = "completed"
	OrderCancelled OrderStatus = "cancelled"
)

// ValidOrderType reports whether t is an accepted order type.
func ValidOrderType(t OrderType) bool { return t == OrderDineIn || t == OrderTakeaway }

// ValidOrderStatus reports whether s is an accepted order status.
func ValidOrderStatus(s OrderStatus) bool {
	switch s {
	case OrderNew, OrderConfirmed, OrderCompleted, OrderCancelled:
		return true
	}
	return false
}

// OrderItem mirrors `OrderItem`.
type OrderItem struct {
	ID         string  `json:"id"`
	ProductID  *string `json:"productId"`
	Name       string  `json:"name"`
	PriceMinor int64   `json:"priceMinor"`
	Quantity   int     `json:"quantity"`
	TotalMinor int64   `json:"totalMinor"`
}

// Order mirrors `Order`.
type Order struct {
	ID              string      `json:"id"`
	Number          int64       `json:"number"`
	Type            OrderType   `json:"type"`
	Status          OrderStatus `json:"status"`
	CustomerName    string      `json:"customerName"`
	CustomerPhone   string      `json:"customerPhone"`
	Comment         string      `json:"comment"`
	SubtotalMinor   int64       `json:"subtotalMinor"`
	TotalMinor      int64       `json:"totalMinor"`
	Items           []OrderItem `json:"items"`
	WhatsappMessage string      `json:"whatsappMessage"`
	CreatedAt       time.Time   `json:"createdAt"`
	UpdatedAt       time.Time   `json:"updatedAt"`
}

// CreateOrderItem is one line of `CreateOrderRequest.items`.
type CreateOrderItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

// CreateOrderRequest mirrors `CreateOrderRequest`.
type CreateOrderRequest struct {
	Type          OrderType         `json:"type"`
	CustomerName  string            `json:"customerName"`
	CustomerPhone string            `json:"customerPhone"`
	Comment       string            `json:"comment"`
	Items         []CreateOrderItem `json:"items"`
}

// CreateOrderResponse mirrors `CreateOrderResponse`.
type CreateOrderResponse struct {
	Order       Order   `json:"order"`
	WhatsappURL *string `json:"whatsappUrl"`
	Message     string  `json:"message"`
}

// OrderQuery filters the admin order list.
type OrderQuery struct {
	Status  string
	Type    string
	Page    int
	PerPage int
}
