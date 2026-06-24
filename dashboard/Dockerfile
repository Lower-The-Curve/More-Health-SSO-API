# syntax=docker/dockerfile:1
# Build context must be the repo root:
#   docker build -f dashboard/Dockerfile -t morehealth-dashboard .
#   fly deploy (from repo root)

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Install dependencies ────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY dashboard/package.json dashboard/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @workspace/dashboard...

# ── Build ───────────────────────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.base.json ./
COPY dashboard dashboard

ENV NODE_ENV=production
RUN pnpm --filter @workspace/dashboard run build

# ── Production image ─────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner
WORKDIR /app/dashboard

ENV NODE_ENV=production
ENV PORT=8080

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nodejs

COPY --from=build --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=build --chown=nodejs:nodejs /app/dashboard/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dashboard/build ./build
# i18next-fs-backend reads locale files from ./public/locales/ at runtime
COPY --from=build --chown=nodejs:nodejs /app/dashboard/public ./public

USER nodejs

EXPOSE 8080

CMD ["./node_modules/.bin/react-router-serve", "./build/server/index.js"]
