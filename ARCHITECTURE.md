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

A package is imported only through its `src/index.ts`. Inside `apps/api` and `packages/domain`, an import that leaves its top-level folder, or goes from a file at the `src/` root into a folder, is a subpath import named from the package root (`#town/useCases/sendJob`, `#DomainError`); an import inside one top-level folder, or between two root files, stays relative (`./`, `../`). Inside `apps/api` the features form a graph with no cycle, and a feature imports only from a feature to its left:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

A file under `<feature>/infrastructure/persistence/` may also import, from any feature's `infrastructure/persistence/`, the files that describe the schema: `*Tables.ts`, `*FromRow.ts` and `*Columns.ts`.

## The folders

One row for each folder directly under `apps/api/src` or `packages/domain/src`: the features of ADR 052 (section 2) and the domain's kernel folders. A new folder there adds its row in the same commit.

| Folder | Package | What it holds |
|---|---|---|
| `platform` | api, domain | What holds no game word: the HTTP kernel, the Postgres kernel, the system clock and ids, the failure sink and the deferred work. In the domain, `platform/domain/` holds the ports no feature owns (`Clock`, `IdGenerator`, `RandomSource`, `UnitOfWork`, `FailureSink`, `AfterResponse`, `AfterResponseDrain`), `Refusal` and `thrownCauseOf`, and `platform/testing/` the fakes `firstItemsRandom`, `sequentialIds` and `inMemoryUnitOfWork`. |
| `content` | api, domain | The JSON catalogs of the town and the lessons, and the content gate: the checks the shipped content passes. In the domain, `content/domain/` holds `LessonLibrary`, the port the use cases read the lessons through. |
| `account` | api, domain | Players, sessions, account tokens and mail, the scaffold choice and the chrome phase. In the domain, `account/domain/` holds the ports (`Accounts`, `AccountTokens`, `Sessions`, `AccountStores`, `ChromeProgressReader`, `Mailer`, `MailCopy`, `PasswordHasher`, `SessionTokens`, `StoredScaffold`), the types `MailRecipient` and `SignedIn` and the pure rules `accountTokenExpiryFrom`, `sessionExpiryFrom` and `isRedeemableAgain`; `account/application/` the use-case classes `SignUp`, `SignIn`, `VerifyEmail`, `ResendVerificationMail`, `RequestPasswordReset`, `ResetPassword` and `ReadChromePhase` and their steps `issueAccountToken`, `openSession`, `sendVerificationMail` and `readScaffold`; and `account/testing/` the fakes `inMemoryAccounts`, `MemoryAccountTokens`, `MemoryChromeProgressReader` and `MemoryMailer`. |
| `town` | api, domain | The holding: founding, resolve, the overview. In the domain, `town/domain/` keeps the name, label and address (`TownName`, `townLabelOf`, `TownAddress`), the terrain and site (`Terrain`, `SiteAddress`), the people (`derivePeople`), the skills the player earns (`TownSkill`, `earnTownSkill`), the settings (`TownSettings`), Town News (`TownEvent`), and the season percents (`townSeasonAt`, `seasonPercentsAt`), the ports (`TownRepository`, `EarnedSkillRepository`, `TownCatalog`, `TownNews`, `TownNewsReader`, `TownReader`, `ReadOnlyTowns`), the store list `TownStores` and the type `TownReading`; `town/application/` the use-case classes `FoundTown` and `ResolveCurrentTown` and the steps `mutateTown`, `changeTown`, `readTownReading`, `resolveTown`, `resolveTownReading`, `resolveStoredTown`, `saveChangedTown` and `saveResolvedTown`; `town/testing/` the fakes, `inMemoryTownStores`, `inMemoryTownReader` and `MemoryTownNewsReader` among them; `town/guidance/domain/` the ports `GuidanceDismissals` and `SeenTips`, and `town/guidance/testing/` their fakes `MemoryGuidanceDismissals` and `MemorySeenTips`; the sub-areas are `resources` (stocks, storage, accrual), `building` (building work, the waiting list), `hiring` (orders and hires), `jobs` (jobs, clean-ups, waste, the region map), `school` (the lesson slot and its lessons) and `guidance` (the next step, the goal, tips). In the api, `news` resolves Town News. |
| `learning` | api, domain | Reviews, hints, frames, retention and the curriculum's shape; in the domain, the lesson and the held card at its root and the sub-areas `reviews` (pending reviews, grading, due cards), `frames` (word frames and texts), `retention` (retained and stable words, skill levels), `curriculum` (the bands, their words and headwords) and `scaffold` (support text, glosses, the chrome phase). |
| `holdout` | api, domain | Band starts and the draw of their held-out words, their holdout checks and released lessons. |
| `placement` | api, domain | The placement offer and its bands. |
| `report` | api | The Report: the reviews due and the Town News since the player last closed it, and when it was served and closed. |
| `memory` | domain | FSRS, the memory model of a card. |
| `season` | domain | The season calendar. |
| `player` | domain | The id every feature keys by. |
| `time` | domain | `Instant`, `Duration` and the pure rules over them. |
| `hash` | domain | Text hashes and the ids drawn from them, with no game word. |
| `grid` | domain | Grid cells, with no game word. |

## The folder grammar

`packages/domain/src/<feature>/`:

```
Town.ts  TownAddress.ts           PascalCase: an entity, a value object or a type
jobPayOf.ts  isLessonRetained.ts  camelCase: a pure, synchronous function
useCases/     one file per thing a player or the clock can ask: reads ports, returns a Promise of Result
services/     a port-reading step two or more use cases share; never exported from index.ts
ports/        the interfaces the outside implements
domain/       in a moved feature (ADR 054): its types, pure rules and ports
application/  in a moved feature: its use-case classes (`SignUp.ts`) and the steps they call (`issueAccountToken.ts`)
testing/      the feature's in-memory ports and fixtures
<subArea>/    the same grammar again
```

A domain file lives in the sub-area whose word it names in the "What it is" column of ADR 052's feature table (section 2), even when another sub-area reads it, and the feature's root keeps the aggregate and the words no domain sub-area names. The root and its sub-areas may import one another, and they stay free of cycles: Biome's `noImportCycles` checks type-only imports as well as runtime ones in the backend.

`apps/api/src/`:

```
index.ts  listen.ts  app.ts  composeServer.ts  composeStores.ts    the composition root, the only place that constructs an adapter
composeUseCases.ts                                                the composition root's use cases, the only place that constructs one
listenPortOf.ts  writeOpenApiDocument.ts                          the api's own entry helpers; no other source file
<feature>/
  application/                 the use cases the api owns
  application/ports/           the ports only the api needs
  infrastructure/http/         endpoints, route lists, responders, presenters, the wire declarations and the request and response helpers they share (`bearerToken`, `honoPath`, `readJsonBody`, `refusalResponse`, `reportServerFailures`)
  infrastructure/persistence/  Drizzle adapters, the feature's tables, row mappers
  infrastructure/memory/       in-memory adapters of application/ports/, each port's contract suite, and the test that runs a domain port's suite on its fake
  infrastructure/json/         the JSON catalogs
  infrastructure/catalog/      the mail copy, read from the message catalog
  infrastructure/smtp/         the mailer
  infrastructure/system/       the password hasher and the session tokens
  gate/                        the content gate (content): the checks the shipped content passes, one file per check in checks/ and the readings they share beside them; no request, port or adapter reaches it, only its tests
```

`platform/` follows the same grammar: `infrastructure/{http,persistence,system,vercel}/` holds the kernels, `DrizzleUnitOfWork` among them. A layer with nothing to hold has no folder: `placement` has no `application/`, and `content` has only `domain/`. An adapter lives in the feature whose port it implements. A domain port has one in-memory implementation, the fake in its domain feature's `testing/`, which the api's contract suite runs against beside the Drizzle adapter, reading it through `@mygame/domain/testing`; an in-memory adapter in `infrastructure/memory/` implements only a port of `application/ports/`. `packages/contracts/src/<feature>/` holds one schema per file, with no layer folder. Only `infrastructure/http/`, `infrastructure/json/` and `content/gate/` import `@mygame/contracts`: they parse, or check, a shape written outside the process, a request or a content file.

## The file-name grammar

| Role | Folder | Name | Example |
|---|---|---|---|
| Entity, value object, type | domain feature root | noun, PascalCase | `Job.ts` |
| Pure rule | domain feature root | `derive*`, `*Of`, `*At`, `*For`, `*Between`, `*After`, a unit suffix (`*Days`, `*Seconds`, `*Milliseconds`), `is*`, `has*`, `covers*`, `holds*`, `refuse*` | `jobPayOf.ts`, `wholeDaysBetween.ts` |
| Constant list | domain feature root | plural noun | `buildingKinds.ts` |
| Draw | domain feature root | noun + `Drawn` | `bandStartDrawn.ts` |
| Pure change | domain feature root, sub-area | verb phrase, returns the changed value, no port | `accrueTown.ts` |
| Domain use case | `useCases/` | verb phrase | `sendJob.ts` |
| Domain service | `services/` | verb phrase | `dispatchJob.ts` |
| Port | `ports/`, `application/ports/` | noun + role | `RegionMapReader.ts` |
| Api use case | `application/` | verb phrase, never a domain export's name | `serveReport.ts` |
| Api type or pure rule | `application/` | noun, or `*From`, `is*` | `LearningDependencies.ts` |
| View or verdict gatherer | `application/` | `gather` + view or verdict | `gatherWorkView.ts` |
| Use case | domain `<feature>/application/` | verb phrase, PascalCase, a class with `execute` | `SignUp.ts` |
| Step | domain `<feature>/application/` | verb phrase, camelCase, a function a use case calls | `issueAccountToken.ts` |
| Endpoint | `infrastructure/http/` | use case + `Route`; in a moved feature, use case + `Controller`, a class with `handle` | `sendJobRoute.ts`, `SignUpController.ts` |
| Route list | `infrastructure/http/` | area + `Routes`; it builds its controllers and its `requirePlayer` once | `jobsRoutes.ts`, `sessionRoutes.ts` |
| Wire declarations, request helper | `infrastructure/http/` | feature + `Components` or `Declarations`; a verb or noun | `townComponents.ts`, `requirePlayer.ts` |
| Responder | `infrastructure/http/` | `respond` + what it turns into a response | `respondTownChange.ts` |
| Presenter | `infrastructure/http/` | `present` + wire noun | `presentTownOverview.ts` |
| Adapter | `infrastructure/<technology>/` | technology + port | `DrizzleTownRepository.ts` |
| Aggregate read | `infrastructure/persistence/` | `aggregated` + noun | `aggregatedTown.ts` |
| Catalog builder | `infrastructure/json/` | `json` + catalog + `Of` | `jsonLessonCatalogOf.ts` |
| Tables | `infrastructure/persistence/` | feature + `Tables` | `townTables.ts` |
| Row mapper | `infrastructure/persistence/` | noun + `FromRow`, noun + `Columns` | `lessonSlotFromRow.ts` |
| Contract suite | `infrastructure/memory/`; once its feature has moved (ADR 054), beside the real adapter it proves, `infrastructure/persistence/` or `infrastructure/smtp/` | port + `Contract.testSupport.ts` | `townRepositoryContract.testSupport.ts`, `mailerContract.testSupport.ts` |
| Test | beside its subject | subject + `.test.ts` | `jobsRoutes.test.ts` |

`*Of` is a pure, synchronous derivation and nothing else: a function that returns a promise is named by a verb, and a function that writes is never named as a reading.

A route's cases sit in one test beside its area's route list, `<area>Routes.test.ts`; an area with no list of its own, or whose list's test would pass the 600 lines of a test file, has one test per route, `<endpoint>Route.test.ts`. A case that seeds or reads the state of a feature to the right of the route's own, its tables or its endpoints, lives in the rightmost feature whose state it seeds or reads, the one `feature_graph` lets import every other, in a test named for the behavior it proves (`learning/infrastructure/http/lessonFinish.test.ts`), never for a route of another feature.

## One request, end to end

`POST /town/jobs`:

1. `apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts` parses the body with `SendJobSchema` and hands the change to `apps/api/src/town/infrastructure/http/respondTownChange.ts`, which opens the town's transaction with `packages/domain/src/town/application/mutateTown.ts`.
2. `packages/domain/src/town/jobs/useCases/sendJob.ts` decides the rule over the ports it is handed.
3. `apps/api/src/town/infrastructure/persistence/DrizzleTownRepository.ts` stores the changed town.
4. `packages/domain/src/town/application/readTownReading.ts` reads the town back through `apps/api/src/town/infrastructure/persistence/DrizzleTownReader.ts`, and `apps/api/src/town/infrastructure/http/respondTownReading.ts` presents it through `apps/api/src/town/infrastructure/http/presentTownOverview.ts` as the `TownOverview` the route answers.

## Where a new thing goes

1. Does it decide a game rule, or coordinate more than one domain port? A domain use case, in `packages/domain/src/<feature>/useCases/`.
2. Does it only place a domain use case in a transaction or gather what one response needs? An api use case, in `apps/api/src/<feature>/application/`. In a moved feature, the account among them, what an endpoint asks is a use-case class in `packages/domain/src/<feature>/application/`, built in `composeUseCases.ts`.

A new refusal adds, in order: its member of `DomainError` (`packages/domain/src/DomainError.ts`) or of `Refusal` (`packages/domain/src/platform/domain/Refusal.ts`), its status in `respondRefusal.ts`, its `ApiErrorKind` in `packages/contracts/src/platform/ApiErrorKind.ts`, and its `refusal.<Kind>` key in `en.json` and `es.json` of `packages/catalog`. A new domain or contracts file adds its export to that package's `src/index.ts`. A new persistence adapter adds, in order: its port, its Drizzle adapter and its table in `*Tables.ts` with a migration from `db:generate`, its in-memory adapter and contract suite, its field in `packages/domain/src/account/domain/AccountStores.ts`, `packages/domain/src/town/domain/TownStores.ts` or `apps/api/src/learning/application/ports/LearnerStores.ts`, and its line in `composeStores.ts`. A pass-through earns no file: the route calls the store. A port lives with its user: in the domain when a domain use case reads it, otherwise in the leftmost api feature that reads it. A new endpoint adds, in order: its schema in `packages/contracts`, its use case if it earns one, its `*Route.ts` with its test, its line in the area's `*Routes.ts`, and a new `openapi.json` from `openapi:write`.

## The checks

`pnpm gate` runs them, and each fails on any hit that `scripts/mygame-structure-check.baseline` does not list. The baseline lists only what the features ADR 054 has yet to move still hold.

- `feature_graph` (Biome): a feature imports only from its left.
- `noImportCycles` (Biome): no import cycle between two files, and in the backend no type-only one either.
- `map`: the folders above and the folders on disk are the same list, and a missing `ARCHITECTURE.md` fails.
- `application_imports_infrastructure`, `application_knows_wire`: the application reads no adapter, no wire type and no HTTP or database library.
- `subpath_import_inside_folder`: no file imports its own top-level folder by a `#` subpath.
- `contracts_outside_adapters`: `@mygame/contracts` stays in `infrastructure/http/`, `infrastructure/json/` and `content/gate/`.
- `persistence_knows_http`, `http_knows_database`: each technology stays in its folder.
- `adapter_built_outside_root`: only the composition root constructs an adapter.
- `reading_named_of_is_async`, `reading_is_async`, `use_case_named_of`, `domain_promise_outside_its_roles`: a name says whether it reads a port, and no `function` or `const` named `*Of`, `*At`, `*For` or `*Between` is `async` or returns a `Promise`.
- `use_case_imports_use_case`, `step_is_public`: use cases share a step, and a step stays inside the domain.
- `api_holds_layer`, `role_folder`, `file_outside_layer`: the api holds no `application/` or `domain/` folder, no feature keeps a `useCases/`, `services/`, `ports/`, `postgres/` or `memory/` folder, and every file of a domain feature sits in `domain/`, `application/` or `testing/`.
- `route_file`, `use_case_shape`, `controller_shape`: an endpoint is a controller class with one `async handle(`, and a use case a class of `application/` with one `async execute(`.
- `use_case_built_outside_root`, `controller_built_outside_route_list`: only the composition root builds a use case, and only a route list builds a controller.
- `folder_over_limit`, `file_over_export_cap`, `type_over_method_cap`, and Biome's line limits: no folder, file, type or function grows past its wall.
