FROM node:22-slim AS base
WORKDIR /app

# Use npm instead of pnpm for Railway deploy stability.  The previous failures
# were network/socket timeouts while pnpm fetched packages from the registry.
ENV NPM_CONFIG_FETCH_TIMEOUT=600000 \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_LOGLEVEL=warn

# Install once with the npm lockfile. The production stage reuses pruned
# node_modules from this stage, so dependencies are not downloaded twice.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Keep only production dependencies after the build is complete.
RUN npm prune --omit=dev

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
