FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Harden pnpm network behavior for Railway builders
RUN pnpm config set registry https://registry.npmjs.org/ \
  && pnpm config set fetch-retries 6 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 20000 \
  && pnpm config set fetch-retry-maxtimeout 180000 \
  && pnpm config set network-timeout 600000

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm fetch --frozen-lockfile

COPY . .
RUN pnpm install --offline --frozen-lockfile && pnpm run build

FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY drizzle/ ./drizzle/
COPY scripts/ ./scripts/
COPY seed-products.mjs ./seed-products.mjs

EXPOSE 3000
CMD ["node", "dist/index.js"]
