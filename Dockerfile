# Railway production build.
FROM node:22-slim AS builder

WORKDIR /app
ENV NODE_ENV=development
ENV npm_config_optional=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 make g++ libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libatomic1 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml .npmrc .pnpmrc.json ./
COPY patches ./patches
RUN corepack enable \
  && corepack prepare pnpm@10.4.1 --activate \
  && pnpm install --frozen-lockfile \
  && node -e "require('@rollup/rollup-linux-x64-gnu'); console.log('Rollup Linux native package present')" || npm install --no-save --no-audit --no-fund @rollup/rollup-linux-x64-gnu@4.52.4

COPY . .
RUN pnpm run build

FROM node:22-slim AS production

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libatomic1 \
  && rm -rf /var/lib/apt/lists/*

COPY package.runtime.json ./package.json
RUN npm config set registry https://registry.npmjs.org/ \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/public/assets ./client/public/assets
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "dist/index.js"]
