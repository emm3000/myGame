# Architecture

The map of the TypeScript backend: `apps/api` and `packages/domain`, with `packages/contracts` beside them. The decision and its reasons are ADR 052 (`docs/adr/052-the-backend-reads-by-feature-then-by-role.md`); the laws are `.claude/rules/architecture.md`. This file holds the layout only. The tree is the inventory.

## The packages

```
apps/web           -> packages/contracts, packages/domain, packages/catalog
apps/api           -> packages/contracts, packages/domain, packages/catalog
packages/contracts -> packages/domain
packages/domain    -> nothing
packages/catalog   -> nothing
```

A package is imported only through its `src/index.ts`. Inside `apps/api` the features form a graph with no cycle, and a feature imports only from a feature to its left:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

A file under `<feature>/infrastructure/postgres/` may also import, from any feature's `infrastructure/postgres/`, the files that describe the schema: `*Tables.ts`, `*FromRow.ts` and `*Columns.ts`.

## The folders

One row for each folder directly under `apps/api/src` or `packages/domain/src`: the features of ADR 052 (section 2) and the domain's kernel folders. A new folder there adds its row in the same commit.

| Folder | Package | What it holds |
|---|---|---|
| `platform` | api | What holds no game word: the HTTP kernel, the Postgres kernel, the system clock and ids, the failure sink and the deferred work. |
| `content` | api | The JSON catalogs of the town and the lessons, and the content gate: the checks the shipped content passes. |
| `account` | api | Players, sessions, account tokens and mail, the scaffold choice and the chrome phase. |
| `town` | api, domain | The holding: founding, building work, hiring, jobs, the school, guidance and news; in the domain, the sub-area `resources`, each resource's "amount, a rate per hour and a capacity on a town" (`CONTEXT.md`, Resource): the stocks, their storage and their accrual. |
| `learning` | api, domain | Reviews, hints, frames, retention and the curriculum's shape; in the domain, the lesson and the held card at its root and the sub-areas `reviews`, `frames`, `retention`, `curriculum` and `scaffold`. |
| `holdout` | api, domain | Band starts, their holdout checks and released lessons. |
| `placement` | api, domain | The placement offer and its bands. |
| `report` | api | The Report: the reviews due and the Town News since the player last closed it, and when it was served and closed. |
| `memory` | domain | FSRS, the memory model of a card. |
| `season` | domain | The season calendar. |
| `player` | domain | The id every feature keys by. |
| `time` | domain | `Instant`, `Duration` and the pure rules over them. |
| `hash` | domain | Text hashes and the ids drawn from them, with no game word. |
| `grid` | domain | Grid cells, with no game word. |
| `ports` | domain | `Clock`, `IdGenerator` and `RandomSource`, the ports no feature owns, and in `ports/testing/` the fakes `firstItemsRandom` and `sequentialIds`. |

## The folder grammar

`packages/domain/src/<feature>/`:

```
Town.ts  TownAddress.ts           PascalCase: an entity, a value object or a type
jobPayOf.ts  isLessonRetained.ts  camelCase: a pure, synchronous function
useCases/     one file per thing a player or the clock can ask: reads ports, returns a Promise of Result
services/     a port-reading step two or more use cases share; never exported from index.ts
ports/        the interfaces the outside implements
testing/      the feature's in-memory ports and fixtures
<subArea>/    the same grammar again
```

A domain file lives in the sub-area whose word it names in the "What it is" column of ADR 052's feature table (section 2), even when another sub-area reads it, and the feature's root keeps the aggregate and the words no domain sub-area names. The root and its sub-areas may import one another, and they stay free of cycles: Biome's `noImportCycles` checks type-only imports as well as runtime ones in the backend.

`apps/api/src/`:

```
index.ts  listen.ts  app.ts  composeServer.ts  composeStores.ts    the composition root, the only place that constructs an adapter
<feature>/
  application/                the use cases the api owns
  application/ports/          the ports only the api needs
  infrastructure/http/        endpoints, route lists, presenters
  infrastructure/postgres/    Drizzle adapters, the feature's tables, row mappers
  infrastructure/memory/      in-memory adapters and the port's contract suite
  infrastructure/json/        the JSON catalogs
  infrastructure/smtp/        the mailer
  infrastructure/system/      the password hasher and the session tokens
  gate/                       the content gate (content): the checks the shipped content passes, one file per check in checks/ and the readings they share beside them; no request, port or adapter reaches it, only its tests
```

`platform/` follows the same grammar: `application/` holds `Refusal`, `application/ports/` the transaction, the failure sink and the deferred work, and `infrastructure/{http,postgres,system,vercel}/` the kernels. Only `platform/` may hold, at its root, a pure function that both its `application/` and its `infrastructure/` read; `thrownCauseOf.ts` is the one case, and a feature folder may not. An adapter lives in the feature whose port it implements. `packages/contracts/src/<feature>/` holds one schema per file, with no layer folder. Only `infrastructure/http/`, `infrastructure/json/` and `content/gate/` import `@mygame/contracts`: they parse, or check, a shape written outside the process, a request or a content file.

## The file-name grammar

| Role | Folder | Name | Example |
|---|---|---|---|
| Entity, value object, type | domain feature root | noun, PascalCase | `Town.ts` |
| Pure rule | domain feature root | `derive*`, `*Of`, `*At`, `is*`, `has*`, `refuse*` | `jobPayOf.ts` |
| Domain use case | `useCases/` | verb phrase | `sendJob.ts` |
| Domain service | `services/` | verb phrase | `resolveStoredTown.ts` |
| Port | `ports/`, `application/ports/` | noun + role | `TownRepository.ts` |
| Api use case | `application/` | verb phrase, never a domain export's name | `serveReport.ts` |
| Endpoint | `infrastructure/http/` | use case + `Route` | `sendJobRoute.ts` |
| Route list | `infrastructure/http/` | area + `Routes` | `jobsRoutes.ts` |
| Presenter | `infrastructure/http/` | `present` + wire noun | `presentTownOverview.ts` |
| Adapter | `infrastructure/<technology>/` | technology + port | `DrizzleTownRepository.ts` |
| Tables | `infrastructure/postgres/` | feature + `Tables` | `townTables.ts` |
| Row mapper | `infrastructure/postgres/` | noun + `FromRow`, noun + `Columns` | `lessonSlotFromRow.ts` |
| Contract suite | `infrastructure/memory/` | port + `Contract.testSupport.ts` | `townRepositoryContract.testSupport.ts` |
| Test | beside its subject | subject + `.test.ts` | `jobsRoutes.test.ts` |

`*Of` is a pure, synchronous derivation and nothing else: a function that returns a promise is named by a verb, and a function that writes is never named as a reading.

## One request, end to end

`POST /town/jobs`:

1. `apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts` parses the body with `SendJobSchema` and hands the change to `apps/api/src/town/infrastructure/http/answerTownChange.ts`, which opens the town's transaction with `apps/api/src/town/application/mutateTown.ts`.
2. `packages/domain/src/town/jobs/useCases/sendJob.ts` decides the rule over the ports it is handed.
3. `apps/api/src/town/infrastructure/postgres/DrizzleTownRepository.ts` stores the changed town.
4. `apps/api/src/town/application/readTownReading.ts` reads the town back through `apps/api/src/town/infrastructure/postgres/DrizzleTownReader.ts`, and `apps/api/src/town/infrastructure/http/answerTownReading.ts` presents it through `apps/api/src/town/infrastructure/http/presentTownOverview.ts` as the `TownOverview` the route answers.

## Where a new thing goes

1. Does it decide a game rule, or coordinate more than one domain port? A domain use case, in `packages/domain/src/<feature>/useCases/`.
2. Does it only place a domain use case in a transaction, gather what one response needs, or belong to the account? An api use case, in `apps/api/src/<feature>/application/`.

A pass-through earns no file: the route calls the store. A port lives with its user: in the domain when a domain use case reads it, otherwise in the leftmost api feature that reads it. A new endpoint adds, in order: its schema in `packages/contracts`, its use case if it earns one, its `*Route.ts` with its test, its line in the area's `*Routes.ts`, and a new `openapi.json` from `openapi:write`.

## The checks

`pnpm gate` runs them, and each fails on any hit: `scripts/mygame-structure-check.baseline` is empty.

- `feature_graph` (Biome): a feature imports only from its left.
- `noImportCycles` (Biome): no import cycle between two files, and in the backend no type-only one either.
- `map`: the folders above and the folders on disk are the same list, and a missing `ARCHITECTURE.md` fails.
- `application_imports_infrastructure`, `application_knows_wire`: the application reads no adapter, no wire type and no HTTP or database library.
- `contracts_outside_adapters`: `@mygame/contracts` stays in `infrastructure/http/`, `infrastructure/json/` and `content/gate/`.
- `persistence_knows_http`, `http_knows_database`: each technology stays in its folder.
- `adapter_built_outside_root`: only the composition root constructs an adapter.
- `reading_named_of_is_async`, `use_case_named_of`, `domain_promise_outside_its_roles`: a name says whether it reads a port.
- `use_case_imports_use_case`, `service_is_public`: use cases share a service, and a service stays inside the domain.
- `folder_over_limit`, `file_over_export_cap`, `type_over_method_cap`, and Biome's line limits: no folder, file, type or function grows past its wall.
