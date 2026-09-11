.PHONY: api web test migrate seed

api:
	cd services/api-go && go run ./cmd/api

test:
	cd services/api-go && go test ./...

migrate:
	cd apps/web && npx prisma migrate deploy && npx prisma db seed

web:
	cd apps/web && npm run dev
