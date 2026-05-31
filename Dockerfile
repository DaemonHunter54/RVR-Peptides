FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Install all deps once. The final image reuses this node_modules so Railway
# does not download the dependency tree twice on every deploy.
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# Production
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY drizzle/ ./drizzle/
COPY scripts/ ./scripts/
COPY seed-products.mjs ./seed-products.mjs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "node scripts/db-init.mjs && node seed-products.mjs && node dist/index.js"]
