FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Harden pnpm for Railway builders. The Railway/npm proxy has been timing out,
# so give pnpm longer network windows and more retries.
RUN pnpm config set fetch-retries 6 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 20000 \
  && pnpm config set fetch-retry-maxtimeout 180000 \
  && pnpm config set network-timeout 600000

# Install dependencies ONCE. Do not run a second production install in another
# stage; that doubles network downloads and is what has been causing repeated
# ERR_SOCKET_TIMEOUT failures on Railway.
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm fetch --frozen-lockfile

COPY . .
RUN pnpm install --offline --frozen-lockfile && pnpm run build

FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY drizzle/ ./drizzle/
COPY scripts/ ./scripts/
COPY seed-products.mjs ./seed-products.mjs

EXPOSE 8080
CMD ["sh", "-c", "node scripts/db-init.mjs && node seed-products.mjs && node dist/index.js"]
