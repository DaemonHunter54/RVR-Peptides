FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Make Railway/npm downloads more reliable and avoid short socket timeouts.
RUN pnpm config set fetch-timeout 600000 \
  && pnpm config set fetch-retries 5 \
  && pnpm config set network-concurrency 4

# Install dependencies once. The production image reuses the pruned node_modules
# from this stage so Railway does not download the same dependency tree twice.
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod=false

# Copy source and build
COPY . .
RUN pnpm run build

# Keep only production dependencies after the build is complete.
RUN pnpm prune --prod

# Production
FROM node:22-slim AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
# Copy local assets for storageProxy fallback (Railway has no Manus Forge API)
COPY --from=base /app/client/public/assets ./client/public/assets
COPY --from=base /app/drizzle ./drizzle

EXPOSE 3000

CMD ["node", "dist/index.js"]
