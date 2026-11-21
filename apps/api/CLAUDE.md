# apps/api

Hono on Node: the HTTP adapters, the persistence adapters that implement the domain ports, auth, and the composition root. The rules: `.claude/rules/architecture.md`, `typescript-style.md`, `testing.md`, `verification.md`. The map is `ARCHITECTURE.md` at the repo root: this file holds only the commands, the two container recipes and the traps nothing else catches.

## Commands

- `API_PORT=3106 pnpm --filter @mygame/api dev` — `tsx watch src/listen.ts`, the local Node listener. Use the port the dispatch assigns, never a default. Add `SESSION_COOKIE_SECURE=false` when a browser reaches the api over plain `http://localhost`: Safari refuses a `Secure` cookie there.
- `pnpm --filter @mygame/api build` — esbuild bundles `src/index.ts` into one ESM file, `dist/index.js`, the production entry Vercel runs (ADR 031). CI imports the bundle after the gate and asks its `fetch` for `/health`.
- `pnpm --filter @mygame/api test` — Vitest, `src/**/*.test.ts`. Route tests compose the real server on the session's Postgres, with the real adapters; an in-memory adapter exists only to run a port's contract suite beside the Drizzle one.
- `pnpm --filter @mygame/api typecheck` — `tsc --noEmit` over `src`, the Vitest config and `drizzle.config.ts`.
- `pnpm --filter @mygame/api openapi:write` — composes the server from the shell's `DATABASE_URL`, `SMTP_URL`, `MAIL_FROM` and `WEB_URL` (nothing connects) and writes `openapi.json`, the copy the Android client is generated from, OpenAPI 3.0.0 because openapi-generator's 3.1 support is partial. `src/openApi.test.ts` turns `pnpm gate` red while it differs from what the app emits.
- `pnpm --filter @mygame/api db:generate --name <change>` — `drizzle-kit generate`: diffs `src/adapters/postgres/schema.ts` against `migrations/meta` and writes the next SQL migration. It needs `DATABASE_URL` set, though it never connects. Commit the SQL and the `meta` files together; a merged migration is never edited.
- `pnpm --filter @mygame/api db:migrate` — `drizzle-kit migrate`: applies pending migrations to `DATABASE_URL`.
- `pnpm gate` from the repo root before every push.

## Local database

Postgres 18.6 in Docker (the exact tag `.github/workflows/ci.yml` pins), one container, one named volume and one host port per session, never a system service and never the owner's database. The container is named `mygame-<session>-pg`, its data volume `mygame-<session>-pgdata`, the database `mygame_<session>`, and the dispatch assigns the port:

```
docker run -d --name mygame-schema-pg -v mygame-schema-pgdata:/var/lib/postgresql -e POSTGRES_PASSWORD=mygame -e POSTGRES_DB=mygame_schema -p 5433:5432 postgres:18.6 -c fsync=off -c synchronous_commit=off -c full_page_writes=off
export DATABASE_URL=postgres://postgres:mygame@localhost:5433/mygame_schema
```

- Without `-v` the image creates an anonymous volume that cannot be told apart from another project's; the named one lets `scripts/mygame-wave-close` remove it and `scripts/mygame-orphans` report it.
- The three `-c` flags drop durability, which holds only test data: never on Neon or any database whose data matters.
- `DATABASE_URL` must be set in the shell that runs `pnpm gate`. The test run leaves that database alone: `vitest.globalSetup.ts` rebuilds `<database>_template` from the migrations and clones `<database>_worker_<n>` from it, one per Vitest worker, which `vitest.workerDatabase.ts` picks by `VITEST_POOL_ID`; `dev` needs `db:migrate` first.

## Local mail

Mailpit in Docker beside the Postgres one, one container and two host ports per session, the ports assigned by the dispatch. The container is named `mygame-<session>-mail`; the tag is the one `.github/workflows/ci.yml` pins, never `latest`:

```
docker run -d --name mygame-schema-mail -e MP_SMTP_DISABLE_RDNS=true -p 1033:1025 -p 8033:8025 axllent/mailpit:v1.31.3
export SMTP_URL=smtp://127.0.0.1:1033
export MAILPIT_URL=http://127.0.0.1:8033
export MAIL_FROM='myGame <no-reply@mygame.local>'
export WEB_URL=http://localhost:3233
```

- `MP_SMTP_DISABLE_RDNS=true` stops Mailpit's reverse DNS lookup of the client, which it runs before its `220` greeting: a lookup that stalls passes `SmtpMailer`'s 2 s greeting timeout, the send answers `failed`, and a test reads no mail (#1099).
- `SMTP_URL` names `127.0.0.1`, never `localhost`: nodemailer resolves a host name through DNS before it falls back to `dns.lookup`, and on macOS that query for `localhost` can stall the first send for about 5 s, past Vitest's timeout.
- `pnpm gate` reads only `SMTP_URL` and `MAILPIT_URL` from the shell; the tests take `MAIL_FROM` and `WEB_URL` from `mailEnvironment` in `src/composeServer.testSupport.ts`. `dev` and `openapi:write` need `SMTP_URL`, `MAIL_FROM` and `WEB_URL`, or `composeServer` refuses to compose.

## Gotchas

- Every town mutation runs through `mutateTown` (`src/town/mutateTown.ts`), which locks the player's row, then the town's. A new lock taken in another order can deadlock.
- Inside `inTransaction`, every store comes from `TransactionStores`: a write through an outside store that touches a row referencing `towns` blocks on the town's `FOR UPDATE` lock, since the foreign key takes `FOR KEY SHARE`.
- Drizzle's `insert` lists every column of the current `schema.ts`, so it fails on a database at an older migration: a migration test seeds the previous version's rows with `client.query` and plain SQL.
- A new table that references `players` or `towns` joins `truncatePlayerTables` (`src/truncatePlayerTables.testSupport.ts`), the one list every api test empties the database with.
- Drizzle runs every pending migration of one `db:migrate` in one transaction, and Postgres refuses a value that `ALTER TYPE ... ADD VALUE` added in that transaction unless the type was created there too: a migration never uses an enum value that it, or an earlier pending one, adds.
- `drizzle-kit generate` asks whether a new column renames an old one and fails without a TTY ("Interactive prompts require a TTY terminal"). Run `db:generate --custom --name <change>`, write the SQL, edit the new snapshot to match `schema.ts`, and confirm with `db:generate --name probe`, which must write no file.
- In a `CHECK`, test each nullable column with `IS NOT NULL` or count with `num_nonnulls`: a comparison with a null passes the check.
- A new runtime dependency gets its own `--external:` in the `build` script, so Vercel's trace carries it into the function. `zod` is external because `@hono/zod-openapi` imports it from `node_modules`: an inlined copy would be a second zod at runtime.
- `src/index.ts` default-exports a plain `Hono` that mounts the server: Vercel's detection needs a value import of `hono` in the bundle, and without it `vercel build` fails with `No entrypoint found which imports hono`.
- `@node-rs/argon2` loads a prebuilt binary per platform, and a function takes the architecture of the machine that ran `vercel build`: never deploy a `vercel build` run on macOS.
- Never run `src` with plain `node`: the workspace packages export raw `.ts` with extensionless imports (`ERR_MODULE_NOT_FOUND`). `dev` runs `tsx`, production the bundle; both find `../content/` from `import.meta.url`, so `dist/` stays beside `src/`.
- A route is declared with `openAPIRegistry.registerPath`, never `app.openapi`, which validates the body itself and answers 415 or a plain-text 400 where the route answers its own refusal.
- Never write a thrown error's `message` to a log: `DrizzleQueryError`'s is `Failed query: <query>\nparams: <params>`, an email and a password hash included. Write `thrownCauseOf(error)` (`src/platform/thrownCauseOf.ts`).
- A test awaits `server.afterResponse.settled()` before it reads what deferred work wrote (the password reset's mail), never Mailpit alone.

A PR adds a gotcha here only when it is a trap no code, rule or test catches, in one line, and never narrates its module.
