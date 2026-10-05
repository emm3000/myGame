FROM node:24.15.0-trixie-slim AS build
RUN npm install --global pnpm@11.1.3
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json .gitignore ./
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @mygame/web...
COPY packages/contracts packages/contracts
COPY apps/web apps/web
RUN pnpm --filter @mygame/web build
RUN pnpm --filter @mygame/web deploy --prod --legacy /deploy

FROM node:24.15.0-trixie-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /deploy/package.json ./
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /repo/apps/web/server.ts ./
COPY --from=build /repo/apps/web/dist ./dist
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.WEB_PORT}/sign-in`).then((response) => process.exit(response.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.ts"]
