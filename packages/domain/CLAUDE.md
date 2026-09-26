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
- A busy `BuildSlot` carries `cost`, the stocks the enqueue debited, taken from the same catalog line as the debit. Whatever needs what a running upgrade cost reads it there, never the catalog, which may have changed since the enqueue (N5).
- `Fief` carries its `buildQueue`, the entries waiting behind the slot in order, each with the building, target level, debited cost and duration fixed at the enqueue (ADR 011). `Fief.restore` reads no catalog, so it cannot check the content cap `FiefSettings.buildQueueCap`; it refuses an entry whose duration is negative (`NegativeDuration`) or not whole seconds (`FractionalDuration`).
- `Fief.enqueueUpgrade(entry, stocksAtNow, now, buildQueueCap)` is the only way an upgrade is enqueued: an idle slot with nothing waiting takes it, otherwise it joins the end of the queue, and a full queue refuses `QueueFull` (`Fief.roomForUpgrade`). Either way it debits the cost at `now`. `enqueueBuilding` checks the room first, then judges the target level, `MaxLevelReached` and the peasants on `Fief.projectedBuildingLevels` (built levels with the slot and every waiting entry applied) through `deriveProjectedFreePeasants`.
- `scheduleBuildQueue(slot, buildQueue)` chains the waiting entries: the first starts at the slot's `finishesAt`, each next one when the one before finishes. Behind an idle slot it schedules nothing.
- `resolveUpgrade` walks the queue: while the slot's `finishesAt` is at or before `now`, it materializes the stocks to that finish at the levels before it, and `Fief.completeUpgrade` applies the level and moves the first waiting entry into the slot, started at that finish and finishing its stored duration later. Each step floors its accrual like any other materialization. The walk stops at the first upgrade still building; with nothing left the slot is idle. `hasChanged` is true when at least one step ran.
- Imports are extensionless (`'./Duration'`); the base tsconfig resolves as `Bundler` without `allowImportingTsExtensions`.
