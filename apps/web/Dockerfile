# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://cohortquiz:cohortquiz@localhost:5432/cohortquiz?schema=public"
ENV AUTH_SECRET="build-time-placeholder-secret-not-for-runtime"
ENV AUTH_URL="http://localhost:3000"
ENV API_GO_URL="http://api:8080"
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
