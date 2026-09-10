package domain

import "time"

// AdminUser mirrors `AdminUser`.
type AdminUser struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	Name        string     `json:"name"`
	Role        string     `json:"role"`
	LastLoginAt *time.Time `json:"lastLoginAt"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// Admin is the stored admin row including the password hash.
type Admin struct {
	AdminUser
	PasswordHash string
	UpdatedAt    time.Time
}

// LoginRequest mirrors `LoginRequest`.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse mirrors `LoginResponse`.
type LoginResponse struct {
	AccessToken string    `json:"accessToken"`
	ExpiresIn   int       `json:"expiresIn"`
	User        AdminUser `json:"user"`
}

// ChangePasswordRequest mirrors `ChangePasswordRequest`.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// UpdateProfileRequest mirrors `UpdateProfileRequest`.
type UpdateProfileRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
}

// AdminSession mirrors `AdminSession`.
type AdminSession struct {
	ID        string    `json:"id"`
	UserAgent string    `json:"userAgent"`
	IP        string    `json:"ip"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
	Current   bool      `json:"current"`
}

// Session is the stored session row.
type Session struct {
	ID        string
	AdminID   string
	TokenHash string
	UserAgent string
	IP        string
	ExpiresAt time.Time
	RevokedAt *time.Time
	CreatedAt time.Time
}

// DashboardWarning is one entry of `DashboardStats.warnings`.
type DashboardWarning struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ProductCounts is `DashboardStats.products`.
type ProductCounts struct {
	Total       int `json:"total"`
	Available   int `json:"available"`
	Unavailable int `json:"unavailable"`
	Hidden      int `json:"hidden"`
}

// OrderCounts is `DashboardStats.orders`.
type OrderCounts struct {
	New   int `json:"new"`
	Today int `json:"today"`
	Total int `json:"total"`
}

// DashboardStats mirrors `DashboardStats`.
type DashboardStats struct {
	Products     ProductCounts      `json:"products"`
	Categories   int                `json:"categories"`
	Menus        int                `json:"menus"`
	Media        int                `json:"media"`
	Orders       OrderCounts        `json:"orders"`
	Status       SiteStatus         `json:"status"`
	Warnings     []DashboardWarning `json:"warnings"`
	RecentOrders []Order            `json:"recentOrders"`
}
