FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.9 && pnpm config set store-dir /pnpm/store --global
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --offline --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @courtly/api build

FROM node:22-alpine AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "--enable-source-maps", "dist/server.mjs"]

FROM build AS migrate
WORKDIR /repo/apps/api
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM build AS api-test
WORKDIR /repo/apps/api
CMD ["pnpm", "exec", "vitest", "run"]
