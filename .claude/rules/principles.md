---
paths:
  - "apps/**"
  - "packages/**"
---
# Principles

Applied in this order when they conflict: correctness, then the architecture rules, then these.

## YAGNI

Build what the current ticket's `Done when` needs. No configuration flag for a case that does not exist, no abstraction for a second implementation that is not scheduled, no "while I am here" widening. A second implementation is the moment to extract, not before.

## KISS

The simplest structure that passes the criteria and respects the layers. A plain function beats a class with one method. A discriminated union beats a class hierarchy. A hand-written mapper beats a reflection-based one. Complexity has to buy something the reviewer can name.

## SOLID, with its tests

- **Single responsibility**: a module has one reason to change. Test: can you name what it does without "and".
- **Open/closed**: a new building or resource is a new data entry or union member, not an edit to a `switch` in five files. Test: adding the sixth building touches how many files.
- **Liskov**: an adapter is substitutable for its port in every test the port has. Test: the port's contract test passes against every adapter.
- **Interface segregation**: a port exposes what one use case needs. Test: is any method unused by every caller.
- **Dependency inversion**: the domain declares the port, the app implements it. Test: the leak check in `architecture.md` is empty.

## DRY, with its caveat

Duplicate knowledge is a defect: a resource formula written twice diverges. Duplicate code that encodes different knowledge is fine: two mappers that look alike today and will not change together stay apart. Extract on the third occurrence, or on the first when the knowledge is a game rule.

## Rebuild, never adapt

A structure that does not fit is replaced. No shims, no adapters over legacy, no `Legacy*` names, no feature flags to keep two paths alive.

## Rejected

- Speculative generality: generics, plugin systems, event buses without two concrete users.
- Utility dumping grounds (`utils.ts`, `helpers.ts`).
- Defensive checks against states the type system already forbids.
- Silent fallbacks: a missing value is an error member, not a default zero.
- Premature performance work not backed by a measurement in the ticket.
