# packages/domain

The game rules as pure TypeScript (ADR 004). Everything else depends on this package; it depends on nothing.

## Commands

- `pnpm --filter @mygame/domain typecheck` — `tsc --noEmit` over `src` and the Vitest config.
- `pnpm --filter @mygame/domain test` — Vitest, runs `src/**/*.test.ts`.
- `pnpm gate` from the repo root before every commit.

## Entry

`src/index.ts` is the only entry. Consumers import from `@mygame/domain`, never from a path under `src`.

## Gotchas

- Zero runtime dependencies. `typescript` and `vitest` are dev dependencies taken from the workspace `catalog:`; `jq '.dependencies' package.json` prints `null`.
- No `node:` imports, no framework, no `zod`. The leak check in `.claude/rules/architecture.md` must stay empty.
- No comments of any kind, including JSDoc. The narrow exceptions are in `.claude/rules/typescript-style.md`.
- Explicit return type on every exported function, method and exported arrow.
- Nothing throws. A failure is a member of the `DomainError` union returned inside a `Result`; `rg -n "extends Error|throw new" src` stays empty, test files included. In a test, narrow a `Result` with Vitest's `assert(result.ok)` instead of throwing.
- Time comes only from the `Clock` port. `Date.now()`, `new Date()`, `setTimeout` and `setInterval` never appear in `src`, tests included; a test builds a `frozenClock` beside itself.
- `Instant` is stored as epoch milliseconds; `Duration` is whole or fractional seconds and never negative.
- A busy `BuildSlot` carries `cost`, the stocks `startUpgrade` debited, taken from the same catalog line as the debit. Whatever needs what a running upgrade cost reads it there, never the catalog, which may have changed since the enqueue (N5).
- Imports are extensionless (`'./Duration'`); the base tsconfig resolves as `Bundler` without `allowImportingTsExtensions`.
