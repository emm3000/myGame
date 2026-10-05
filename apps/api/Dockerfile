FROM node:24.21.0-bookworm-slim AS node

FROM node AS manifests
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/

FROM manifests AS dependencies
RUN pnpm install --frozen-lockfile --filter @mygame/api...

FROM manifests AS production-dependencies
RUN pnpm install --frozen-lockfile --prod --filter @mygame/api

FROM dependencies AS build
COPY packages/domain/src packages/domain/src
COPY packages/contracts/src packages/contracts/src
COPY apps/api/src apps/api/src
RUN pnpm --filter @mygame/api build

FROM node AS migrate
WORKDIR /repo/apps/api
COPY --from=dependencies /repo/node_modules /repo/node_modules
COPY --from=dependencies /repo/apps/api/node_modules ./node_modules
COPY apps/api/package.json apps/api/drizzle.config.ts ./
COPY apps/api/migrations ./migrations
USER node
ENTRYPOINT ["node", "node_modules/drizzle-kit/bin.cjs", "migrate"]

FROM node AS api
ENV NODE_ENV=production
WORKDIR /repo/apps/api
COPY --from=production-dependencies /repo/node_modules /repo/node_modules
COPY --from=production-dependencies /repo/apps/api/node_modules ./node_modules
COPY apps/api/package.json ./
COPY apps/api/content ./content
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
