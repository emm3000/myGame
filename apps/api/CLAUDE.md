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

- `src/app.ts` exports `createApp(dependencies)`, the Hono app with every route. Tests build it with `createApp({ ...server, clock })` over a composed server, swapping the clock, and call `app.request(...)`; no socket.
- `src/composeServer.ts` is the composition root: the only module that constructs an adapter and wires it to a port. It reads `API_PORT` and refuses to compose unless it is an integer from 1 to 65535, and refuses to compose without `DATABASE_URL`. It exposes the app's dependencies, `fiefs`, a lock-free `DrizzleFiefRepository` for reads, and `inTransaction(work)`, which runs `work` inside one Drizzle transaction with a locking `DrizzleFiefRepository` and a `DrizzleAccounts` bound to it. `work` returns a `Result`; a refusal rolls the whole transaction back. Every fief mutation and every sign-up goes through `inTransaction`.
- `src/server.ts` is the listener: it hands the composed server to `@hono/node-server` and does nothing else.
- `src/adapters/postgres/schema.ts` holds the Drizzle tables: `players`, `sessions`, `fiefs` (the five amounts, one `stored_at`, the nullable `slot_*` columns of the build slot) and `fief_buildings`. No rate, capacity or peasant count is stored (ADR 005, ADR 007).
- `src/adapters/postgres/DrizzleFiefRepository.ts` implements `FiefRepository`. `fiefOf` is one query, the fief row left-joined to its level rows. With `'lockedForUpdate'` it takes `FOR UPDATE OF fiefs`; with `'lockFree'` it takes no lock, so a read never queues behind a mutation. `save` upserts the fief row and its built level rows in one transaction, which is a savepoint inside `inTransaction`. A building without a row is unbuilt.
- `src/adapters/memory/MemoryFiefRepository.ts` is the in-memory `FiefRepository`. `src/adapters/fiefRepositoryContract.ts` is the port's contract suite, and both adapters' tests run it.
- `src/adapters/system/` holds `SystemClock`, the only file that calls `Date.now()`, `CryptoIdGenerator`, which issues uuids, `CryptoSessionTokens`, which issues 256-bit base64url session tokens, and `Argon2Passwords`, which hashes with Argon2id (`@node-rs/argon2` defaults) and verifies an unknown email against a decoy hash so both refusals cost the same.
- `src/adapters/postgres/DrizzleAccounts.ts` stores players and sessions. It is api-side persistence behind the auth middleware, not a domain port. The session token is stored as issued in `sessions.token`: it is 256 random bits, and whoever reads that table already reads every fief.
- `src/auth/` holds `signUp`, `signIn` and `foundFiefOnFreePlot`. Sign-up hashes the password, then in one `inTransaction` inserts the player, founds the fief and opens the session. `foundFiefOnFreePlot` retries `foundFief` up to three times on `CoordinatesTaken`: a racing sign-up that took the plot has committed by then, so the retry picks the next free plot, and a second founding for one player ends as `PlayerAlreadyHoldsFief`.
- `src/http/requirePlayer.ts` is the only reader of the session cookie. It renews the session row to now + 30 days in one `UPDATE ... WHERE expires_at > now RETURNING`, rewrites the cookie and yields `playerId` and `sessionToken` in `c.var`; without a live session it answers 401.
- `src/http/answerRefusal.ts` is the one module that maps a `Refusal` (every `DomainError` kind plus the api's `EmailTaken`, `InvalidCredentials`, `WeakPassword`, `MalformedRequest`, `SignedOut`) to a status and, for the kinds `ApiErrorSchema` knows, the Spanish message. A kind the wire does not name answers its status with an empty body.
- `src/routes/auth.ts` serves `POST /auth/sign-up` (201 `Player`), `POST /auth/sign-in` (200 `Player`), `POST /auth/sign-out` (204) and `GET /auth/session` (200 `Player`). The cookie is `session`, `HttpOnly; Secure; SameSite=Lax; Path=/`, 30 days.
- `migrations/` holds the generated SQL and drizzle-kit's `meta` snapshots. A migration is never edited after it merges; a change is a new migration.

## Gotchas

- Routes stay thin: parse with the contract schema, call the use case, map the `Result`. No rule lives in a route.
- Adapters implement ports defined in `@mygame/domain`; the api never declares a port of its own.
- No Drizzle import outside an adapter.
- Every mutation of a fief runs in one transaction that first locks the fief row with `SELECT ... FOR UPDATE`, then materializes, applies and writes (N4, ADR 006). Two concurrent mutations serialize on that lock.
- The migration test applies every migration inside one transaction after dropping `public` and `drizzle`, and rolls back, so it sees an empty database and leaves the session's database as it found it.
- `vitest.globalSetup.ts` applies `migrations/` to `DATABASE_URL` before the suite, so a fresh database (CI's service container) has the tables. The api test files share that database and truncate it, so `vitest.config.ts` sets `fileParallelism: false`.
- The `fiefs.terrain` column is written from `Fief.terrain` and never read back: the domain derives terrain from the province.
- The race test in `composeServer.test.ts` pauses the first transaction after its read. It resumes once the second transaction's `for update of "fiefs"` query shows up as waiting on a lock in `pg_stat_activity`, or once the second has read. The probe is bounded. With the lock removed the test fails every time.
- `fiefs_player_unique` holds one fief per player; `save` maps its violation to `PlayerAlreadyHoldsFief`. Two foundings that race for one player also pick the same plot, and Postgres checks `fiefs_coordinates_unique` first, so the loser's first attempt reports `CoordinatesTaken`; `foundFiefOnFreePlot` retries it into `PlayerAlreadyHoldsFief`.
- The race tests in `src/auth/foundFiefOnFreePlot.test.ts` hold both transactions after their first `occupiedPlots` read until both have read, so both pick the same plot. With the retry removed both tests fail every time.
- A password shorter than 8 characters fails `SignUpRequestSchema`; the sign-up route turns a parse failure on `password` into `WeakPassword` and any other into `MalformedRequest`. A sign-in body that does not parse answers `InvalidCredentials`.
- `pnpm add` in pnpm 11 ignores `save-exact` from `.npmrc` and writes a caret; fix the specifier by hand. `@node-rs/argon2` ships prebuilt binaries, so it needs no `allowBuilds` entry.
- No pepper or secret is configured: Argon2id salts each hash itself, so no auth env variable exists yet.
- The `fiefs_<resource>_whole` checks refuse a stored amount that is fractional or negative.
- `players_email_unique` is a unique index on `lower(email)`: the email is stored as typed and compared case-insensitively.
- `drizzle-orm`, `pg` and `drizzle-kit` have one consumer, so their versions live here, not in the catalog.
- Import `@mygame/contracts` and `@mygame/domain` only from their entry; `rg -n "from '@mygame/(domain|contracts)/src" apps packages` stays empty.
- The workspace packages export raw `.ts` with extensionless relative imports. Plain `node` cannot load `@mygame/domain` (`ERR_MODULE_NOT_FOUND`), so `dev` runs through `tsx`, which resolves both at runtime.
- `hono`, `@hono/node-server` and `tsx` have one consumer, so their versions live here, not in the catalog; `typescript` and `vitest` come from `catalog:`.
- `esbuild` (under `tsx`) is listed in `allowBuilds` in `pnpm-workspace.yaml`; pnpm 11 fails the install on an unreviewed build script.
