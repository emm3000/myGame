---
paths:
  - "apps/**"
  - "packages/**"
---
# Naming

English for every identifier, file, directory, branch, commit and doc. Player-facing text is American English; a scaffold language appears only in its catalog and glosses (ADR 035). A name is a sentence fragment a reader understands without opening the file. The per-language patterns live in `typescript-style.md` and `kotlin-style.md`.

## Booleans and collections

- Booleans read as predicates: `isBusy`, `hasCapacity`, `canAfford`. No negated names (`isNotReady`).
- Collections are plural: `buildings`, never `buildingList`.
- Quantities carry their unit: `durationSeconds`, `ratePerHour`, `capacityUnits`.

## Game content

Names players see come from `docs/setting/` and `CONTEXT.md`, never invented in code. The identifier stays English (`storage`); the player-facing label lives only in `packages/catalog` (`en.json` and `es.json`), which generates the web's and the api's functions and the Android string resources (ADR 038).

## Rejected

Abbreviations (`cfg`, `repo`, `mgr`, `ctx`; Hono's own `c` is the exception), Hungarian prefixes (`ITownRepository`), `Impl` suffixes, `Helper` / `Util` / `Manager` classes, numbered variants (`town2`).
