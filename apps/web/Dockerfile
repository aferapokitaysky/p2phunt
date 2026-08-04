# Build context must be the repo root: docker build -f apps/web/Dockerfile .
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
COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:4000
ARG VITE_WS_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN pnpm --filter @p2phunt/shared build && pnpm --filter @p2phunt/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/dist /repo/apps/web/dist
COPY --from=build /repo/apps/web/package.json /repo/apps/web/package.json
WORKDIR /repo/apps/web
RUN npm install --global serve@14
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
