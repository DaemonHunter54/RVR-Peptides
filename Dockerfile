# Runtime-only Railway deploy.
# The app is already built in /dist, so Railway does NOT rebuild the Vite app
# or install hundreds of front-end/dev dependencies during deployment.
FROM node:22-slim AS production

WORKDIR /app
ENV NODE_ENV=production

# Runtime support for native packages used by the server.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libatomic1 \
  && rm -rf /var/lib/apt/lists/*

# Install only the packages the prebuilt server actually imports.
# This avoids Railway timing out while downloading hundreds of build-only packages.
COPY package.runtime.json ./package.json
RUN npm config set registry https://registry.npmjs.org/ \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install --omit=dev --no-audit --no-fund

# Copy the already-optimized production build and local assets used by the server.
COPY dist ./dist
COPY client/public/assets ./client/public/assets
COPY drizzle ./drizzle

EXPOSE 3000
CMD ["node", "dist/index.js"]
