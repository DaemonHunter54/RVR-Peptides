FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod=false

# Copy source
COPY . .

# Build
RUN pnpm run build

# Production
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/dist ./dist
COPY drizzle/ ./drizzle/
COPY scripts/ ./scripts/
COPY seed-products.mjs ./seed-products.mjs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "node scripts/db-init.mjs && node seed-products.mjs && node dist/index.js"]
