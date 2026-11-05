---
paths:
  - "apps/api/**"
  - "apps/web/**"
  - "packages/**"
---
# Architecture

Covers the TypeScript side: the server (`apps/api`), the web (`apps/web`) and the shared packages. The native clients follow `android-architecture.md`.

Hexagonal. The game rules live in `packages/domain` and know nothing about HTTP, the database or React. Everything else is an adapter.

## Layers and the dependency direction

```
apps/web           -> packages/contracts, packages/domain, packages/catalog
apps/api           -> packages/contracts, packages/domain, packages/catalog
packages/contracts -> packages/domain
packages/domain    -> nothing
packages/catalog   -> nothing
```

An import against the arrow is a defect, whatever the reason. The leak check, expected empty:

```
rg -n "from '(node:|hono|drizzle|@tanstack|react|zod|\.\./\.\./apps)" packages/domain/src
rg -n "from '@mygame/" packages/catalog/src
rg -l '"@mygame/catalog":' packages/*/package.json
```

And the reverse leak, an app reaching into another package's internals instead of its public entry, expected empty:

```
rg -n "from '@mygame/(domain|contracts|catalog)/src" apps packages
```

## `packages/catalog`

The only source of copy (ADR 038): `es.json` and `en.json`, ICU MessageFormat, one key set. It generates one typed function per key for `apps/web` and `apps/api`, the ICU parsed at generation so no ICU runtime ships, and every Android `strings.xml`; the generated files are committed and a test fails on any drift. No client or api module writes a player-facing string of its own; `packages/catalog/CLAUDE.md` holds the key shape and the checks.

## `packages/domain`

- **Entities** hold identity and invariants (`Fief`, `Building`, `BuildQueue`). Invariants are enforced in constructors or factory functions that return `Result<T, DomainError>`, never by a validator called later.
- **Value objects** are immutable and compared by value (`ResourceAmount`, `Coordinates`, `Duration`). Arithmetic lives on them, not on the caller.
- **Use cases** are one exported function or one class with one `execute`. A use case takes its ports as parameters and returns `Result`. It never imports another use case; shared logic is a domain service.
- **Ports** are interfaces the domain needs the outside to fulfil: `FiefRepository`, `Clock`, `IdGenerator`. Defined in `packages/domain`, implemented in `apps/api`.
- **Use-case admission**: a use case earns a file when it enforces a rule or coordinates more than one port. A pass-through from a route to a repository is not a use case; the route calls the repository.

## Errors

Failure modes are a sealed discriminated union:

```ts
export type DomainError =
  | { kind: 'InsufficientResources'; missing: ResourceAmount }
  | { kind: 'QueueFull'; cap: number }
  | { kind: 'UnknownBuilding'; building: string }
```

A use case returns `Result<T, DomainError>`; it never throws. An adapter maps `kind` to an HTTP status in one place (`apps/api`, `answerRefusal`) and answers the `kind` with its typed `params`, the refusal's fields, never a player-facing line (ADR 038); each client reads the same `ApiError` from `packages/contracts` and renders the line from `packages/catalog`: the web and the api from `refusal.<Kind>`, Android from its module's `android.<module>.*refusal*` keys until the town rebuild shares one key set. A new failure mode is a new member of the union, never a new `class extends Error`.

## Time

`Clock` is a port: `{ now(): Instant }`. Every use case that reads time takes it. Tests pass a fixed clock. `Date.now()` appears only in the one adapter that implements `Clock`.

## Lazy evaluation

Resource state is `(amount, at, ratePerHour, capacity, fullSince)`, `fullSince` the instant the store reached the capacity, null while it is under it. Reading a fief's resources computes `max(amount, min(capacity, amount + rate * elapsed(at, now)))` and never writes: a stock under the capacity accrues up to it, a stock at or above it (a refund may exceed it) stays frozen until spending brings it under (ADR 005, amendment). A mutation (spend, upgrade finished) first materializes the current amount at `now`, then applies the change, then stores `(newAmount, now, fullSince)`: a store at or above the capacity after the change keeps the `fullSince` it held, or takes the instant it crossed the capacity before the change (the change's own instant when a credit pushed it over); a store under the capacity clears it. Finished queue items are resolved the same way, on read, for the fief being read only. Nothing scans all fiefs.

## `packages/contracts`

zod schemas for every request and response the api serves, and the types inferred from them. The api parses input with them; the web types its calls with them. A schema is the only place a wire shape is written. No behavior, no domain imports beyond types the wire needs.

## `apps/api`

Hono routes are thin: parse with the contract schema, call the use case, map the `Result`. Adapters implement the domain ports over the database. The composition root wires ports to adapters in one file; nothing else constructs an adapter. Auth is middleware that yields a `PlayerId`, never a domain concern.

## `apps/web`

Routes load data through typed clients built on `packages/contracts`. Screens are presentational; a route or a hook owns the data. Visual primitives follow `ui-components.md`.

## Rebuild, never adapt

When a structure does not fit these rules, it is replaced, not wrapped. A shim that lets old and new coexist is rejected at review. A shim is code that bridges old and new: an adapter, a wrapper, a mapper, a dual read or write, a flag choosing a path. Code built beside the old is not one only when no code reads or writes both and the ticket deleting the old is filed with its blocking edges before any slice merges (ADR 040).
