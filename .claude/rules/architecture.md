---
paths:
  - "apps/**"
  - "packages/**"
---
# Architecture

Hexagonal. The game rules live in `packages/domain` and know nothing about HTTP, the database or React. Everything else is an adapter.

## Layers and the dependency direction

```
apps/web           -> packages/contracts, packages/domain
apps/api           -> packages/contracts, packages/domain
packages/contracts -> packages/domain
packages/domain    -> nothing
```

An import against the arrow is a defect, whatever the reason. The leak check, expected empty:

```
rg -n "from '(node:|hono|drizzle|@tanstack|react|zod|\.\./\.\./apps)" packages/domain/src
```

And the reverse leak, an app reaching into another package's internals instead of its public entry, expected empty:

```
rg -n "from '@mygame/(domain|contracts)/src" apps packages
```

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
  | { kind: 'QueueBusy'; until: Instant }
  | { kind: 'UnknownBuilding'; building: string }
```

A use case returns `Result<T, DomainError>`; it never throws. An adapter maps `kind` to an HTTP status and a Spanish message in one place (`apps/api`), and the web reads the same `kind` from `packages/contracts`. A new failure mode is a new member of the union, never a new `class extends Error`.

## Time

`Clock` is a port: `{ now(): Instant }`. Every use case that reads time takes it. Tests pass a fixed clock. `Date.now()` appears only in the one adapter that implements `Clock`.

## Lazy evaluation

Resource state is `(amount, at, ratePerHour, capacity)`. Reading a fief's resources computes `min(capacity, amount + rate * elapsed(at, now))` and never writes. A mutation (spend, upgrade finished) first materializes the current amount at `now`, then applies the change, then stores `(newAmount, now)`. Finished queue items are resolved the same way, on read, for the fief being read only. Nothing scans all fiefs.

## `packages/contracts`

zod schemas for every request and response the api serves, and the types inferred from them. The api parses input with them; the web types its calls with them. A schema is the only place a wire shape is written. No behavior, no domain imports beyond types the wire needs.

## `apps/api`

Hono routes are thin: parse with the contract schema, call the use case, map the `Result`. Adapters implement the domain ports over the database. The composition root wires ports to adapters in one file; nothing else constructs an adapter. Auth is middleware that yields a `PlayerId`, never a domain concern.

## `apps/web`

Routes load data through typed clients built on `packages/contracts`. Screens are presentational; a route or a hook owns the data. The design system is the only source of visual primitives; a feature screen never imports a raw third-party UI control.

## Rebuild, never adapt

When a structure does not fit these rules, it is replaced, not wrapped. A shim that lets old and new coexist is rejected at review.
