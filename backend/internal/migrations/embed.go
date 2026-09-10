// Package migrations embeds the SQL migration files applied at startup.
package migrations

import "embed"

// FS contains every *.sql migration, applied in file-name order.
//
//go:embed *.sql
var FS embed.FS
