# ---------- Stage 1: Builder ----------
FROM node:24-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---------- Stage 2: Runtime ----------
FROM node:24-bookworm-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl
RUN npm install -g pnpm

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/prisma.config.js ./prisma.config.js
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]
