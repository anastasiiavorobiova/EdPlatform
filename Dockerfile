ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch(`http://localhost:${process.env.PORT ?? 3000}/api/health`).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]


FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


FROM base AS builder
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build


FROM base AS dev
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
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
