# apps/api

Hono on Node: the HTTP adapters, the persistence adapters that implement the domain ports, auth, and the composition root.

## Commands

- `API_PORT=3106 pnpm --filter @mygame/api dev` — `tsx watch src/server.ts`. Use the port the dispatch assigns, never a default.
- `pnpm --filter @mygame/api test` — Vitest, `src/**/*.test.ts`.
- `pnpm --filter @mygame/api typecheck` — `tsc --noEmit` over `src`, the Vitest config and `drizzle.config.ts`.
- `pnpm --filter @mygame/api db:generate --name <change>` — `drizzle-kit generate`: diffs `src/adapters/postgres/schema.ts` against `migrations/meta` and writes the next SQL migration. Commit the SQL and the `meta` files together.
- `pnpm --filter @mygame/api db:migrate` — `drizzle-kit migrate`: applies pending migrations to `DATABASE_URL`.
- `pnpm gate` from the repo root before every commit.

## Local database

Postgres 18 in Docker, one container and one host port per session, never a system service and never the owner's database. The container is named `mygame-<session>-pg`, the database `mygame_<session>`, and the dispatch assigns the port:

```
docker run -d --name mygame-schema-pg -e POSTGRES_PASSWORD=mygame -e POSTGRES_DB=mygame_schema -p 5433:5432 postgres:18
export DATABASE_URL=postgres://postgres:mygame@localhost:5433/mygame_schema
```

`DATABASE_URL` must be set in the shell that runs `pnpm gate`; the migration test fails without it. CI runs the same image as a service container of the `gate` job.

## Layout

- `src/app.ts` exports the Hono `app` with every route. Tests call `app.request('/health')`; no socket.
- `src/composeServer.ts` is the composition root: the only module that constructs an adapter and wires it to a port. It reads `API_PORT` and refuses to compose unless it is an integer from 1 to 65535.
- `src/server.ts` is the listener: it hands the composed server to `@hono/node-server` and does nothing else.
- `src/adapters/postgres/schema.ts` holds the Drizzle tables: `players`, `sessions`, `fiefs` (the five amounts, one `stored_at`, the nullable `slot_*` columns of the build slot) and `fief_buildings`. No rate, capacity or peasant count is stored (ADR 005, ADR 007).
- `migrations/` holds the generated SQL and drizzle-kit's `meta` snapshots. A migration is never edited after it merges; a change is a new migration.

## Gotchas

- Routes stay thin: parse with the contract schema, call the use case, map the `Result`. No rule lives in a route.
- Adapters implement ports defined in `@mygame/domain`; the api never declares a port of its own.
- No Drizzle import outside an adapter.
- Every mutation of a fief runs in one transaction that first locks the fief row with `SELECT ... FOR UPDATE`, then materializes, applies and writes (N4, ADR 006). Two concurrent mutations serialize on that lock.
- The migration test applies every migration inside one transaction after dropping `public` and `drizzle`, and rolls back, so it sees an empty database and leaves the session's database as it found it.
- `players_email_unique` is a unique index on `lower(email)`: the email is stored as typed and compared case-insensitively.
- `drizzle-orm`, `pg` and `drizzle-kit` have one consumer, so their versions live here, not in the catalog.
- Import `@mygame/contracts` and `@mygame/domain` only from their entry; `rg -n "from '@mygame/(domain|contracts)/src" apps packages` stays empty.
- The workspace packages export raw `.ts` with extensionless relative imports. Plain `node` cannot load `@mygame/domain` (`ERR_MODULE_NOT_FOUND`), so `dev` runs through `tsx`, which resolves both at runtime.
- `hono`, `@hono/node-server` and `tsx` have one consumer, so their versions live here, not in the catalog; `typescript` and `vitest` come from `catalog:`.
- `esbuild` (under `tsx`) is listed in `allowBuilds` in `pnpm-workspace.yaml`; pnpm 11 fails the install on an unreviewed build script.
