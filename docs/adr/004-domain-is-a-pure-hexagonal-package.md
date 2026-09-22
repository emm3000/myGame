---
status: accepted
date: 2026-09-21
---
# The game rules live in a pure TypeScript package

The rules of the game (what a building costs, how long it takes, when a queue
refuses, how resources accrue) are the product. They must be testable in
milliseconds, reusable by the api and, where the client predicts, by the web,
and immune to a framework or database swap.

## Decision

`packages/domain` is pure TypeScript with zero runtime dependencies and no
`node:` imports. It holds entities, value objects, use cases, the port
interfaces the outside must implement (`FiefRepository`, `Clock`,
`IdGenerator`) and the sealed `DomainError` union. Use cases return
`Result<T, DomainError>` and never throw. Time enters only through the
`Clock` port.

`apps/api` implements the ports and composes them in one file.
`packages/contracts` carries the wire shapes both apps share and depends on
`packages/domain` for types only. Nothing depends on an app. The leak check
in `.claude/rules/architecture.md` proves the direction on every review.

## Consequences

- The bulk of the test suite is domain tests with a fixed clock and
  in-memory ports; they need no database and no server.
- A pass-through from a route to a repository is not promoted to a use case;
  the layer exists for rules, not ceremony.
- Choosing Postgres or SQLite (ADR 006) changes adapters only.
