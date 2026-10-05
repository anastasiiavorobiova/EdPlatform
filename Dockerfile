ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch(`http://localhost:${process.env.PORT ?? 3000}/api/health`).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]


FROM base AS deps
COPY package.json package-lock.json .npmrc ./
# typescript is an optional peer of @nestjs/swagger, needed only by its CLI plugin at build time
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev \
    && rm -rf node_modules/typescript node_modules/.bin/tsc node_modules/.bin/tsserver


FROM base AS builder
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build


FROM base AS dev
ENV NODE_ENV=development

# nest start --watch stops the previous process via `ps`, which node:*-slim lacks
RUN apt-get update \
    && apt-get install -y --no-install-recommends procps \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
# Compodoc is generated on the host; --no-save keeps package.json and the lockfile intact
RUN --mount=type=cache,target=/root/.npm \
    npm ci \
    && npm uninstall --no-save @compodoc/compodoc
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

# nest start --watch writes dist/ into /app, so the node user must own it
RUN chown node:node /app

USER node

CMD ["node_modules/.bin/nest", "start", "--watch"]


FROM base AS runner
ENV NODE_ENV=production

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node

CMD ["node", "dist/main.js"]
