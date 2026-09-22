---
paths:
  - "apps/**"
  - "packages/**"
---
# Naming

English for every identifier, file, directory, branch, commit and doc. Spanish appears only in user-facing copy. A name is a sentence fragment a reader understands without opening the file.

## By layer

| Thing | Pattern | Example |
|---|---|---|
| Entity | noun | `Fief`, `Building`, `BuildQueue` |
| Value object | noun, immutable | `ResourceAmount`, `Coordinates`, `Duration` |
| Use case | verb phrase | `enqueueBuilding`, `collectResources` |
| Port | noun + role | `FiefRepository`, `Clock`, `IdGenerator` |
| Adapter | technology + port | `DrizzleFiefRepository`, `SystemClock` |
| Domain error member | past or present participle of the failure | `InsufficientResources`, `QueueBusy` |
| Contract schema | wire noun + `Schema` | `FiefOverviewSchema`, `EnqueueBuildingRequestSchema` |
| Contract type | the schema's noun | `FiefOverview`, `EnqueueBuildingRequest` |
| Hono route module | resource | `fiefs.ts`, `queue.ts` |
| Web route | TanStack file route | `routes/fief.$fiefId.tsx` |
| Component | noun, PascalCase | `ResourceBar`, `BuildQueuePanel` |
| Hook | `use` + noun | `useFiefOverview` |
| Test | `<subject>.test.ts` beside the subject | `enqueueBuilding.test.ts` |

## Files

- One primary export per file, file named after it: `enqueueBuilding.ts` exports `enqueueBuilding`.
- camelCase for files that export a function or value, PascalCase for files that export a type, class or component.
- Directories are plural nouns for collections (`useCases/`, `ports/`, `adapters/`) and singular for a single concern (`auth/`).

## Booleans and collections

- Booleans read as predicates: `isBusy`, `hasCapacity`, `canAfford`. No negated names (`isNotReady`).
- Collections are plural: `buildings`, never `buildingList`.
- Quantities carry their unit: `durationSeconds`, `ratePerHour`, `capacityUnits`.

## Game content

Names players see come from `docs/lore/` and `CONTEXT.md`, never invented in code. The identifier stays English (`sawmill`); the Spanish label lives in the copy layer of `apps/web`.

## Rejected

Abbreviations (`cfg`, `repo`, `mgr`, `ctx` outside Hono's own `c`), Hungarian prefixes (`IFiefRepository`), `Impl` suffixes, `Helper` / `Util` / `Manager` classes, numbered variants (`fief2`).
