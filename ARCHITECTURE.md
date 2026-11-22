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

A package is imported only through its `src/index.ts`. Inside `apps/api` and `packages/domain`, an import that leaves its top-level folder, or goes from a file at the `src/` root into a folder, is a subpath import named from the package root (`#town/jobs/application/SendJob`, `#DomainError`); an import inside one top-level folder, or between two root files, stays relative (`./`, `../`). Inside `apps/api` the features form a graph with no cycle, and a feature imports only from a feature to its left:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

A file under `<feature>/infrastructure/persistence/` may also import, from any feature's `infrastructure/persistence/`, the files that describe the schema: `*Tables.ts`, `*FromRow.ts` and `*Columns.ts`. In `packages/domain`, the same order holds for `application/`: a file imports another feature's `application/` folder only from a feature to its left, with `memory` and `season` beside `platform`. The `domain/` folders are not ordered among features (ADR 055).

## The folders

One row for each folder directly under `apps/api/src` or `packages/domain/src`: the features of ADR 052 (section 2) and the domain's kernel folders. A new folder there adds its row in the same commit.

| Folder | Package | What it holds |
|---|---|---|
| `platform` | api, domain | What holds no game word: the HTTP kernel, the Postgres kernel, the system clock and ids, the failure sink and the deferred work. In the domain, `platform/domain/` holds the ports no feature owns (`Clock`, `IdGenerator`, `RandomSource`, `UnitOfWork`, `FailureSink`, `AfterResponse`, `AfterResponseDrain`), `Refusal` and `thrownCauseOf`, and `platform/testing/` the fakes `firstItemsRandom`, `sequentialIds` and `inMemoryUnitOfWork`. |
| `content` | api, domain | The JSON catalogs of the town and the lessons, and the content gate: the checks the shipped content passes. In the domain, `content/domain/` holds `LessonLibrary`, the port the use cases read the lessons through. |
| `account` | api, domain | Players, sessions, account tokens and mail, the scaffold choice and the chrome phase. In the domain, `account/domain/` holds the ports (`Accounts`, `AccountTokens`, `Sessions`, `AccountStores`, `ChromeProgressReader`, `Mailer`, `MailCopy`, `PasswordHasher`, `SessionTokens`, `StoredScaffold`), the types `MailRecipient` and `SignedIn` and the pure rules `accountTokenExpiryFrom`, `sessionExpiryFrom` and `isRedeemableAgain`; `account/application/` the use-case classes `SignUp`, `SignIn`, `VerifyEmail`, `ResendVerificationMail`, `RequestPasswordReset`, `ResetPassword` and `ReadChromePhase` and their steps `issueAccountToken`, `openSession`, `sendVerificationMail` and `readScaffold`; and `account/testing/` the fakes `inMemoryAccounts`, `MemoryAccountTokens`, `MemoryChromeProgressReader` and `MemoryMailer`. |
| `town` | api, domain | The holding: founding, resolve, the overview. In the domain, `town/domain/` keeps the name, label and address (`TownName`, `townLabelOf`, `TownAddress`), the terrain and site (`Terrain`, `SiteAddress`), the people (`derivePeople`), the skills the player earns (`TownSkill`, `earnTownSkill`), the settings (`TownSettings`), Town News (`TownEvent`), and the season percents (`townSeasonAt`, `seasonPercentsAt`), the ports (`TownRepository`, `EarnedSkillRepository`, `TownCatalog`, `TownNews`, `TownNewsReader`, `TownReader`, `ReadOnlyTowns`), the store list `TownStores` and the type `TownReading`; `town/application/` the use-case classes `FoundTown` and `ResolveCurrentTown` and the steps `mutateTown`, `changeTown`, `readTownReading`, `resolveTown`, `resolveTownReading`, `resolveStoredTown`, `saveChangedTown` and `saveResolvedTown`; `town/testing/` the fakes, `inMemoryTownStores`, `inMemoryTownReader` and `MemoryTownNewsReader` among them; `town/guidance/domain/` the next step, the goal and the tips (`nextStepOf`, `nextGoalOf`, `tipOf`) and the ports `GuidanceDismissals` and `SeenTips`, `town/guidance/application/` the use-case classes `DismissGuidance` and `MarkTipSeen`, and `town/guidance/testing/` their fakes `MemoryGuidanceDismissals` and `MemorySeenTips`; `town/news/application/` the use-case class `ResolveTownNews`; `town/resources/domain/` the stocks, the storage and the accrual (`Stocks`, `deriveStorageCapacity`, `accrueTown`); the sub-areas are `resources` (stocks, storage, accrual), `building` (building work, the waiting list), `hiring` (orders and hires), `jobs` (jobs, clean-ups, waste, the region map), `school` (the lesson slot and its lessons) and `guidance` (the next step, the goal, tips). In the api, `news` answers Town News through `ResolveTownNewsController`, and `guidance` marks tips seen and dismisses the guidance through `MarkTipSeenController` and `DismissGuidanceController`. |
| `learning` | api, domain | Reviews, hints, frames, retention and the curriculum's shape; in the domain, `learning/domain/` keeps the lesson, the held card and the ports `CardRepository`, `CardReader` and `LearnerStores`, and each sub-area keeps its own `domain/`: `reviews` (pending reviews, grading, due cards, the ports `PendingReviewRepository` and `ReviewLog`), `frames` (word frames and texts, the ports `FrameCatalog` and `TextCatalog`), `retention` (retained and stable words, skill levels), `curriculum` (the bands, their words and headwords, the ports `BandCatalog` and `LessonCatalog`) and `scaffold` (support text, glosses, the chrome phase). `learning/reviews/application/` holds the classes `ServeDueReviews`, `RequestReviewHint` and `SubmitReviewAnswer`, which answers the `ReviewOutcome` of `reviews/domain/`, and the steps `answerReview`, `requestHint`, `showDueReviews`, `readLearner` and `readDueReviews`, the due-reviews reading the report shares. In the api, `infrastructure/http/` holds the three controllers, `learningRoutes`, `gatherReviewVerdict` and the presenters, and `infrastructure/persistence/` the Drizzle adapters beside their contract suites. |
| `holdout` | api, domain | Band starts and the draw of their held-out words, their holdout checks and released lessons. In the domain, `holdout/domain/` keeps the band start, the checks and their views, the weeks, the draws and the port `BandStartRepository`; `holdout/application/` the use-case classes `ReadHoldoutChecks`, `BeginHoldoutCheck`, `AnswerHoldoutCheck` and `SkipHoldoutCheck` and the steps `mutateHoldoutCheck`, `readHoldoutCheckViews` and `resolveDueBandStart`; `holdout/testing/` the fake `inMemoryBandStarts` and the fixtures. In the api, `infrastructure/http/` the four controllers `holdoutCheckRoutes` builds, and `infrastructure/persistence/` the Drizzle adapter beside the port's contract suite. |
| `placement` | api, domain | The placement offer and its bands. In the domain, `placement/domain/` keeps the placement, its view, its samples and scores and the ports `PlacementRepository` and `PlacementWordCatalog`; `placement/application/` the use-case classes `ReadPlacement`, `BeginPlacement`, `SkipPlacement` and `AnswerPlacement` and the steps `admitPlacementOffer` and `readPlacementView`; `placement/testing/` the fake `inMemoryPlacements`. In the api, `infrastructure/http/` the four controllers `placementRoutes` builds, and `infrastructure/persistence/` the Drizzle adapter beside the port's contract suite. |
| `report` | api, domain | The Report: the reviews due and the Town News since the player last closed it, and when it was served and closed. In the domain, `report/application/` holds the class `ServeReport`, which reads the due-reviews and the current-town steps, `report/domain/` the port `ReportClosings` and `report/testing/` its fake `MemoryReportClosings`; in the api, `infrastructure/http/` holds `ServeReportController`, `CloseReportController`, which calls the port, `reportRoutes` and `presentReport`, and `infrastructure/persistence/` holds `DrizzleReportClosings` beside the contract suite both run. |
| `memory` | domain | FSRS, the memory model of a card. |
| `season` | domain | The season calendar. |
| `player` | domain | The id every feature keys by. |
| `time` | domain | `Instant`, `Duration` and the pure rules over them. |
| `hash` | domain | Text hashes and the ids drawn from them, with no game word. |
| `grid` | domain | Grid cells, with no game word. |

## The folder grammar

`packages/domain/src/<feature>/`:

```
domain/         Town.ts  TownAddress.ts        PascalCase: an entity, a value object, a type
                jobPayOf.ts  accrueTown.ts     camelCase: a pure, synchronous function
                TownRepository.ts  TownNews.ts PascalCase: a port, an interface, beside what it stores
application/    SendJob.ts                     PascalCase: a use case, a class
                dispatchJob.ts  mutateTown.ts  camelCase: a step use cases share, a function
testing/        the feature's in-memory ports and fixtures
<subArea>/      the same grammar again
```

The kernel: `platform/` keeps `domain/` (`Clock`, `IdGenerator`, `RandomSource`, `UnitOfWork`, `FailureSink`, `AfterResponse`, `AfterResponseDrain`, `Refusal`) and `testing/`; `player/`, `time/`, `hash/` and `grid/` are values with no port and no use case, one layer by nature; `DomainError.ts`, `Result.ts`, `index.ts` and `testing.ts` stay at the root (ADR 054, section 2).

A domain file lives in the sub-area whose word it names in the "What it is" column of ADR 052's feature table (section 2), even when another sub-area reads it, and the feature's own `domain/` keeps the aggregate and the words no domain sub-area names. The feature and its sub-areas may import one another, and they stay free of cycles: Biome's `noImportCycles` checks type-only imports as well as runtime ones in the backend.

`apps/api/src/`:

```
index.ts  listen.ts  app.ts  composeServer.ts  composeStores.ts  composeUseCases.ts    the composition root, the only place that constructs an adapter or a use case
listenPortOf.ts  writeOpenApiDocument.ts                                              the api's own entry helpers; no other source file
<feature>/infrastructure/
  http/           one controller per endpoint, the route list, responders, presenters, the views they gather, the wire declarations and the request and response helpers they share (`bearerToken`, `honoPath`, `readJsonBody`, `refusalResponse`, `reportServerFailures`)
  persistence/    Drizzle adapters, the feature's tables, row mappers, each port's contract suite and the test that runs it on the domain's fake
  json/           the JSON catalogs (content)
  catalog/        the copy of a mail (account)
  smtp/           the mailer (account)
  system/         the password hasher and the session tokens (account), the clock and ids (platform)
  vercel/         the deferred work (platform)
content/gate/     the content gate: the checks the shipped content passes, one file per check in checks/ and the readings they share beside them; no request, port or adapter reaches it, only its tests
```

`platform/` follows the same grammar: `infrastructure/{http,persistence,system,vercel}/` holds the kernels, `DrizzleUnitOfWork` among them. A layer with nothing to hold has no folder: in the domain package, `content` has only `domain/`. An adapter lives in the feature whose port it implements. A domain port has one in-memory implementation, the fake in its domain feature's `testing/`, which the api's contract suite runs against beside the Drizzle adapter, reading it through `@mygame/domain/testing`. `packages/contracts/src/<feature>/` holds one schema per file, with no layer folder. Only `infrastructure/http/`, `infrastructure/json/` and `content/gate/` import `@mygame/contracts`: they parse, or check, a shape written outside the process, a request or a content file.

## The file-name grammar

| Role | Folder | Name | Example |
|---|---|---|---|
| Entity, value object, type | domain `domain/` | noun, PascalCase | `HeldCard.ts` |
| Pure rule | domain `domain/` | `derive*`, `*Of`, `*At`, `*For`, `*Between`, `*After`, a unit suffix (`*Days`, `*Seconds`, `*Milliseconds`), `is*`, `has*`, `covers*`, `holds*`, `refuse*` | `holdsLessonCards.ts`, `wholeDaysBetween.ts` |
| Constant list | domain `domain/` | plural noun | `holdoutCheckWeeks.ts` |
| Draw | domain `domain/` | noun + `Drawn` | `bandStartDrawn.ts` |
| Pure change | domain `domain/` | verb phrase, returns the changed value, no port | `accrueTown.ts` |
| Port | domain `domain/` | noun + role | `CardRepository.ts` |
| View or verdict gatherer | `infrastructure/http/`, beside the presenter that reads its view | `gather` + view or verdict | `gatherReviewVerdict.ts` |
| Use case | domain `<feature>/application/` | verb phrase, PascalCase, a class with `execute` | `SignUp.ts` |
| Step | domain `<feature>/application/` | verb phrase, camelCase, a function a use case calls | `issueAccountToken.ts` |
| Controller | `infrastructure/http/`, one per endpoint | use case + `Controller`, a class with `handle` | `SendJobController.ts`, `CloseReportController.ts` |
| Route list | `infrastructure/http/` | area + `Routes`; it builds its controllers and its `requirePlayer` once | `jobsRoutes.ts`, `sessionRoutes.ts` |
| Wire declarations, request helper | `infrastructure/http/` | feature + `Components` or `Declarations`; a verb or noun | `townComponents.ts`, `requirePlayer.ts` |
| Responder | `infrastructure/http/` | `respond` + what it turns into a response | `respondTownReading.ts` |
| Presenter | `infrastructure/http/` | `present` + wire noun | `presentTownOverview.ts` |
| Adapter | `infrastructure/persistence/` for a Drizzle adapter, else the folder of its technology (`smtp/`, `system/`, `vercel/`, `catalog/`, `json/`) | technology + port | `DrizzleTownRepository.ts`, `SmtpMailer.ts` |
| Aggregate read | `infrastructure/persistence/` | `aggregated` + noun | `aggregatedTown.ts` |
| Catalog builder | `infrastructure/json/` | `json` + catalog + `Of` | `jsonLessonCatalogOf.ts` |
| Tables | `infrastructure/persistence/` | feature + `Tables` | `townTables.ts` |
| Row mapper | `infrastructure/persistence/` | noun + `FromRow`, noun + `Columns` | `lessonSlotFromRow.ts` |
| Contract suite | beside the real adapter it proves, `infrastructure/persistence/` or `infrastructure/smtp/` | port + `Contract.testSupport.ts` | `townRepositoryContract.testSupport.ts`, `mailerContract.testSupport.ts` |
| Test | beside its subject | subject + `.test.ts` | `jobsRoutes.test.ts` |

`*Of` is a pure, synchronous derivation and nothing else: a function that returns a promise is named by a verb, and a function that writes is never named as a reading.

A route's cases sit in one test beside its area's route list, `<area>Routes.test.ts`; an area with no list of its own, or whose list's test would pass the 600 lines of a test file, has one test per controller, `<UseCase>Controller.test.ts`. A case that seeds or reads the state of a feature to the right of the route's own, its tables or its endpoints, lives in the rightmost feature whose state it seeds or reads, the one `feature_graph` lets import every other, in a test named for the behavior it proves (`learning/infrastructure/http/lessonFinish.test.ts`), never for a route of another feature.

## One request, end to end

`POST /town/jobs`:

1. `apps/api/src/town/jobs/infrastructure/http/jobsRoutes.ts` builds `SendJobController` once, with the `SendJob` that `apps/api/src/composeUseCases.ts` built, and mounts it behind `requirePlayer`.
2. `apps/api/src/town/jobs/infrastructure/http/SendJobController.ts` parses the body with `SendJobSchema` and asks `SendJob`.
3. `packages/domain/src/town/jobs/application/SendJob.ts` hands its change to `packages/domain/src/town/application/changeTown.ts`, whose `packages/domain/src/town/application/mutateTown.ts` opens the unit of work, `apps/api/src/platform/infrastructure/persistence/DrizzleUnitOfWork.ts`, locks the player and fixes the instant. The step `packages/domain/src/town/jobs/application/dispatchJob.ts` decides the rule over the stores of that transaction.
4. `apps/api/src/town/infrastructure/persistence/DrizzleTownRepository.ts` stores the changed town.
5. `packages/domain/src/town/application/readTownReading.ts` reads the town back in the same transaction through `apps/api/src/town/infrastructure/persistence/DrizzleTownReader.ts`, and the controller answers that `TownReading` through `apps/api/src/town/infrastructure/http/respondTownReading.ts`, which presents it through `apps/api/src/town/infrastructure/http/presentTownOverview.ts` as the `TownOverview`.

## Where a new thing goes

A thing that decides or coordinates is in `packages/domain`, under `domain/` when it is pure and under `application/` when it reads a port; a thing that talks to HTTP, Postgres, a file or a mail server is in `apps/api`, under `infrastructure/` (ADR 054, section 1). What an endpoint asks is a use-case class of `application/`, and a function it calls with the ports it reads is a step beside it; what gathers one response's view is a gatherer in `infrastructure/http/`, beside the presenter that reads it.

A new endpoint adds, in order: its schema in `packages/contracts`; its use case in `packages/domain/src/<feature>/application/` if it earns one, with its export in `src/index.ts`; its line of `composeUseCases.ts`; its `*Controller.ts` with its test in `infrastructure/http/`; its lines of the area's `*Routes.ts`, the controller built once and mounted behind `requirePlayer`; and a new `openapi.json` from `openapi:write`.

A new refusal adds, in order: its member of `DomainError` (`packages/domain/src/DomainError.ts`) or of `Refusal` (`packages/domain/src/platform/domain/Refusal.ts`), its status in `respondRefusal.ts`, its `ApiErrorKind` in `packages/contracts/src/platform/ApiErrorKind.ts`, and its `refusal.<Kind>` key in `en.json` and `es.json` of `packages/catalog`. A new domain or contracts file adds its export to that package's `src/index.ts`. A new persistence adapter adds, in order: its port, its Drizzle adapter and its table in `*Tables.ts` with a migration from `db:generate`, its in-memory adapter and contract suite, its field in `packages/domain/src/account/domain/AccountStores.ts`, `packages/domain/src/town/domain/TownStores.ts` or `packages/domain/src/learning/domain/LearnerStores.ts`, and its line in `composeStores.ts`. A pass-through earns no file: the controller calls the store, as `CloseReportController` calls `ReportClosings`. A port lives in the `domain/` of the feature whose use case reads it.

## The checks

`pnpm gate` runs them, and each fails on any hit that `scripts/mygame-structure-check.baseline` does not list. The baseline is empty: every feature has moved (ADR 054).

- `feature_graph` (Biome): in the api a feature imports only from its left; in the domain package an `application/` folder is imported only from its right.
- `noImportCycles` (Biome): no import cycle between two files, and in the backend no type-only one either.
- `map`: the folders above and the folders on disk are the same list, and a missing `ARCHITECTURE.md` fails.
- `subpath_import_inside_folder`: no file imports its own top-level folder by a `#` subpath.
- `contracts_outside_adapters`: `@mygame/contracts` stays in `infrastructure/http/`, `infrastructure/json/` and `content/gate/`.
- `persistence_knows_http`, `http_knows_database`: each technology stays in its folder.
- `adapter_built_outside_root`: only the composition root constructs an adapter.
- `reading_named_of_is_async`, `reading_is_async`, `use_case_named_of`, `domain_promise_outside_its_roles`: a name says whether it reads a port, and no `function` or `const` named `*Of`, `*At`, `*For` or `*Between` is `async` or returns a `Promise`.
- `use_case_imports_use_case`, `step_is_public`: use cases share a step, and a step stays inside the domain.
- `api_holds_layer`, `role_folder`, `file_outside_layer`: the api holds no `application/` or `domain/` folder; `role_folder` refuses a `useCases/`, `services/` or `ports/` folder anywhere in the domain package, the kernel folders included, and a `postgres/` or `memory/` folder in the api; and every file of a domain feature sits in `domain/`, `application/` or `testing/`.
- `route_file`, `use_case_shape`, `controller_shape`: an endpoint is a controller class with one `async handle(`, and a use case a class of `application/` with one `async execute(`.
- `use_case_built_outside_root`, `controller_built_outside_route_list`: only the composition root builds a use case, and only a route list builds a controller.
- `folder_over_limit`, `file_over_export_cap`, `type_over_method_cap`, and Biome's line limits: no folder, file, type or function grows past its wall.
