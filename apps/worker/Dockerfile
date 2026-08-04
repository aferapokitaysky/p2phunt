# Build context must be the repo root: docker build -f apps/worker/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/connectors/package.json packages/connectors/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/connectors packages/connectors
COPY apps/api/prisma apps/api/prisma
COPY apps/api/package.json apps/api/package.json
COPY apps/worker apps/worker
RUN pnpm --filter @p2phunt/shared build \
  && pnpm --filter @p2phunt/connectors build \
  && pnpm --filter @p2phunt/api exec prisma generate \
  && pnpm --filter @p2phunt/worker build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/worker
CMD ["node", "dist/main.js"]
