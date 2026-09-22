# apps/api

Hono on Node: the HTTP adapters, the persistence adapters that implement the domain ports, auth, and the composition root.

## Commands

- `API_PORT=3106 pnpm --filter @mygame/api dev` — `tsx watch src/server.ts`. Use the port the dispatch assigns, never a default.
- `pnpm --filter @mygame/api test` — Vitest, `src/**/*.test.ts`.
- `pnpm --filter @mygame/api typecheck` — `tsc --noEmit` over `src` and the Vitest config.
- `pnpm gate` from the repo root before every commit.

## Layout

- `src/app.ts` exports the Hono `app` with every route. Tests call `app.request('/health')`; no socket.
- `src/compositionRoot.ts` is the only module that constructs an adapter and wires it to a port. It reads `API_PORT` and refuses to compose without a positive integer.
- `src/server.ts` is the listener: it hands the composed server to `@hono/node-server` and does nothing else.

## Gotchas

- Routes stay thin: parse with the contract schema, call the use case, map the `Result`. No rule lives in a route.
- Adapters implement ports defined in `@mygame/domain`; the api never declares a port of its own.
- No Drizzle import outside an adapter.
- Import `@mygame/contracts` and `@mygame/domain` only from their entry; `rg -n "from '@mygame/(domain|contracts)/src" apps packages` stays empty.
- The workspace packages export raw `.ts` with extensionless relative imports. Plain `node` cannot load `@mygame/domain` (`ERR_MODULE_NOT_FOUND`), so `dev` runs through `tsx`, which resolves both at runtime.
- `hono`, `@hono/node-server` and `tsx` have one consumer, so their versions live here, not in the catalog; `typescript` and `vitest` come from `catalog:`.
- `esbuild` (under `tsx`) is listed in `allowBuilds` in `pnpm-workspace.yaml`; pnpm 11 fails the install on an unreviewed build script.
