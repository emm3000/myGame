---
status: accepted
date: 2026-10-22
---
# Deploy on Vercel with Neon

## Context

ADR 026 ran production on a shared Contabo VPS: Docker Compose behind
Caddy, images built by CI and pushed to GHCR, a deploy over SSH into
`emm3000/infra`, Postgres in a container on the same box with dumps
shipped to R2. On 2026-10-22 the owner cancelled the VPS to stop paying
for hosting; Contabo deletes it and every byte on it on 2026-11-05. The
owner chose to let the production data go with it: the only player is
the owner, so nothing is migrated and the new database starts empty.

The owner already moved another app (`vitrina`, its ADR 048) from the
same VPS to Vercel, so the account, the team and the credentials exist.
Vercel's team is on the Hobby plan, which forbids commercial use; the
game charges nothing.

## Decision

- **Two Vercel projects, one per app.** `mygame-web` (root directory
  `apps/web`, framework TanStack Start) and `mygame-api` (root
  directory `apps/api`, framework Hono), both in region `iad1`, beside
  the database. Each app keeps its own build and its own function, so
  the dependency direction of the workspace stays as it is: the web
  never imports the api.
- **The web rewrites `/api/*` to the api.** `apps/web/vercel.json`
  rewrites `/api/:path*` to the api project's production domain with
  the prefix stripped, as Caddy's `handle_path` did, so the browser
  still talks to one origin and the session cookie stays first-party.
  The api project's deployment protection is off: a rewrite cannot
  pass Vercel's SSO, and the api answers only through the web's
  domain in practice.
- **The web builds through Nitro.** `nitro()` from `nitro/vite` joins
  the Vite plugins; it writes Vercel's Build Output from `vite build`.
  The srvx server, its static middleware and `WEB_PORT` in production
  are gone; the one-year `immutable` cache on `/assets/` and the
  one-day cache on `/art/` move to `headers` in `apps/web/vercel.json`.
- **The api is one function built from a JavaScript bundle.**
  `src/index.ts` composes the server and default-exports `{ fetch }`;
  `pnpm build` bundles it with esbuild into `dist/index.js`, and
  `apps/api/vercel.json` points Vercel at `dist`, where its Hono
  detection finds the entry. Vercel type-checks a TypeScript entry
  with the workspace's TypeScript, and under TypeScript 7 that check
  fails with TS2688 on `types: ["node"]` although `pnpm -r typecheck`
  passes, so the function starts from the bundle and the gate stays
  the type check. Vercel's Hono detection also takes the first
  candidate file that imports `hono`, which in `src/` would be
  `src/app.ts`, not the entry. The trace carries `content/` into the
  function because the bundle reads it from `import.meta.url`.
  `composeServer` no longer reads `API_PORT`; `src/listen.ts`, the local
  Node listener `dev` runs, reads it through `listenPortOf`.
- **Postgres on Neon.** Project `mygame-us-east` in `aws-us-east-1`,
  Postgres 18. The function reads the pooled URL as `DATABASE_URL`,
  because each function instance opens its own `pg` pool and Neon's
  pooler keeps the connection count bounded. Migrations run with the
  direct URL, `DIRECT_DATABASE_URL`, as Neon advises for schema
  changes: the pooler runs in transaction mode and holds no session
  between statements.
- **Lazy evaluation needs nothing from the host.** No cron, no worker,
  no timer advances state (ADR 005), so a function that sleeps between
  requests loses nothing.
- **`deploy.yml` builds, migrates, then deploys.** It keeps ADR 026's
  trigger, the `DEPLOY_ENABLED` gate, the tip guard and the docs-only
  rule. Per project it runs `vercel pull` and `vercel build --prod`;
  then `drizzle-kit migrate` against `DIRECT_DATABASE_URL`; then
  `vercel deploy --prebuilt --prod`, the api first and the web second.
  A broken build touches no database, and a broken migration deploys
  nothing. Git deploys are off in both `vercel.json` files, so CI is
  the only way in.
- **Health is a request.** `health.yml` asks `/api/health` through the
  web's domain once a day and fails on anything but 200.
- **Mail stays on Resend** over SMTP, with a key of its own for this
  project.

## Considered options

- **Move the web to Next.js and mount Hono in a route handler.** One
  project and no rewrite, but it rewrites every route, loader and route
  test of `apps/web` for a hosting change, and putting the api inside
  the web breaks the dependency direction. Rejected.
- **One Vercel project with the api as a function beside TanStack
  Start.** One domain and no rewrite, but nothing proves Vercel merges
  Nitro's output with a second framework's function, and the two apps
  would share one build. Rejected for two projects that each follow
  their framework's path.
- **A container host (Render, Railway).** The Node listener and the
  images would run nearly unchanged, but their free plans sleep or
  cap hours, and the owner already runs Vercel. Rejected.

## Consequences

- The api's cold start includes composing the server: parsing
  `content/`, building the pool. A request after idle waits for it.
- A local `vercel build` on macOS traces the macOS binary of
  `@node-rs/argon2`; Vercel picks the function's architecture from the
  build machine, so only the CI build on Linux x64 is deployable.
- The rewrite names the api's production domain in `apps/web/vercel.json`;
  renaming the api project changes that line.
- ADR 026's backups, restore drill, `emm3000/infra` app folder and Caddy
  site block no longer serve this repo. Neon's branch history replaces
  the dumps; nothing restores to a second host.
- CI publishes nothing any more: the GHCR images and the Dockerfiles
  are gone.
