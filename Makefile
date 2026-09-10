.PHONY: db-up db-down api site admin build typecheck

db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

api:
	cd backend && go run ./cmd/server

site:
	npm run dev:site

admin:
	npm run dev:admin

build:
	cd backend && go build -o bin/server ./cmd/server
	npm run build

typecheck:
	npm run typecheck
	cd backend && go vet ./...

prod:
	docker compose up -d --build
