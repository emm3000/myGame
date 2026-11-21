---
status: accepted
date: 2026-11-21
---
# The backend reads by feature, then by role

## Context

The owner wants a backend whose code and structure a human can keep
working on with no AI: "the backend must be so readable that a human
with no AI can continue it. Hexagonal with domain, application and
infrastructure must be visible in the tree; Clean Code, Clean
Architecture, Screaming Architecture, SOLID" (#1710).

An audit of the backend, posted as the second comment of #1710, found
that the code inside a file already meets that bar and the structure
around the files does not. Its findings, recounted on trunk for this
ADR:

- **Cut by layer.** The api's top level is `adapters/`,
  `afterResponse/`, `auth/`, `contentGate/`, `failures/`, `http/`,
  `learning/`, `routes/`, `time/` and `town/`: three of the ten name
  the game. One player intent, sending a job, is read in 8
  directories. 22 api files carry `town` in their name, in 6
  directories. 26 of the last 104 `feat` and `fix` commits that touched
  the backend's production files touched 5 directories or more.
- **A folder does not say a role.** `packages/domain/src/town/` is 126
  production files at one level, `learning/` 65, and
  `packages/contracts/src` 83 with no folder at all. `useCases/` holds
  3 of the domain's 37 port-reading files. The domain's ports are in
  `ports/` (13) and in `town/` (8); 12 more interfaces live in the api.
- **A name does not say a role.** 139 files end in `Of.ts`. The suffix
  covers a pure derivation, an api transaction script
  (`answerReviewOf`), a domain step that reads a port
  (`resolvedTownOf`), a wire presenter (`townOverviewOf`) and a row
  mapper (`lessonSlotOf`). 20 of them return a promise, and two of
  those write: `currentTownOf` persists a resolve and `reportOf`
  records that the Report was served.
- **Eight files and seven functions are too big.**
  `DrizzleTownRepository.ts` is 734 lines, `Town.ts` 702, `schema.ts`
  660, `routes/town.ts` 477, of which one function runs from line 73 to
  line 477, and `townOverviewOf.ts` 442.
- **The dependency rule stops at the package boundary.** Inside
  `apps/api`, 35 import lines in 24 files outside `adapters/` reach
  into it, the composition root not counted: the eight auth use cases
  are typed against `Argon2Passwords`, `CryptoSessionTokens` and the
  Postgres `Transaction`; `mutateTown`, called from 20 places, takes
  its types from `adapters/postgres/`. `postgresTransaction.ts`
  constructs 15 adapters outside the composition root. Three pairs of
  folders import each other: `learning/` and `town/`, `contentGate/`
  and `adapters/json/`, `http/` and `auth/`.
- **No map.** The package `CLAUDE.md` files say "the code is the map";
  the rules sit under `.claude/rules/` and give the laws without the
  layout. The repo has no `ARCHITECTURE.md`.

What already holds and is not reopened here: the packages and their
arrows (ADR 001, ADR 004), with every leak check of `architecture.md`
empty; lazy evaluation (ADR 005); Drizzle on Postgres (ADR 006); the
Vercel entry (ADR 031); no comments; injected time; `Result` and the
sealed `DomainError`; one primary export per file; tests as sentences;
the domain's `*Of`, `derive*`, `is*` vocabulary for pure functions.

### How the numbers were taken

Every number in this ADR was taken on trunk at `781147ee`, and the pull
request that files the ADR lists each one with its command and its
output. Three definitions hold throughout:

- **The backend** is `apps/api/src`, `packages/domain/src` and
  `packages/contracts/src`.
- **A production file** is a `.ts` file of the backend that is not
  `*.test.ts`, not `*.testSupport.ts` and not under a `testing/`
  folder: 208 in the api, 269 in the domain, 83 in the contracts, 560
  in all. 17 of the api's 208 are Vitest suites named
  `adapters/*Contract.ts`; they count as production until the step
  that moves each one names it `*Contract.testSupport.ts`.
- **A size** is what the rule that will enforce it counts. A file's
  lines and a function's lines are Biome's, read from a run of
  `style/noExcessiveLinesPerFile` and
  `complexity/noExcessiveLinesPerFunction` in the pinned 2.5.14, never
  a script's estimate. The audit's own script counted 11 functions over
  50 lines; Biome counts 7.

## Decision

### 1. Feature first, then the three layers by name

The first folder under `src/` names a thing the game does. The second
names a layer, with the owner's three words written out:

| Layer | Where it lives |
|---|---|
| Domain | `packages/domain/src/<feature>/`: entities, value objects, pure rules, and the use cases and ports of ADR 004 |
| Application | `apps/api/src/<feature>/application/`: what one request does around a domain use case, and the account |
| Infrastructure | `apps/api/src/<feature>/infrastructure/{http,postgres,memory,json,smtp,system}/`: one folder per technology |

`apps/api/src/platform/` holds what no feature owns, in the same two
folders: `platform/application/` and
`platform/infrastructure/{http,postgres,system,vercel}/`.

A reader who opens any feature of the api sees `application/` beside
`infrastructure/`, and the domain one package away: the hexagon is in
the tree at every feature, not in a document. The price is one path
segment: `apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts`.

### 2. The features

| Feature | What it is | domain | api | contracts |
|---|---|---|---|---|
| `account` | players, sessions, account tokens, mail, the scaffold choice and the chrome phase | no | yes | yes |
| `town` | the holding: stocks, accrual, founding, resolve, the overview | yes | yes | yes |
| `town/building` | building work and the waiting list | yes | yes | yes |
| `town/hiring` | hiring orders and hires | yes | yes | yes |
| `town/jobs` | jobs, clean-ups, waste, the region map | yes | yes | yes |
| `town/school` | the lesson slot and the lessons a school runs | yes | yes | yes |
| `town/guidance` | the next step, the goal, tips | yes | yes | yes |
| `town/news` | town events and the news feed | yes | yes | yes |
| `learning` | reviews, hints, frames, retention, the curriculum's shape | yes | yes | yes |
| `placement` | the placement offer and its bands | yes | yes | yes |
| `holdout` | holdout checks and released lessons | yes | yes | yes |
| `report` | the Report: due reviews and the news since it was closed | no | yes | yes |
| `content` | the JSON catalogs and the content gate | no | yes | yes |
| `memory` | FSRS | yes | no | no |
| `season` | the season calendar | yes | no | no |
| `platform` | what holds no game word: the HTTP kernel, the Postgres kernel, the system adapters, the failure sink | no | yes | `Wire.ts`, `ApiError*.ts`, `HealthResponse.ts` |

A feature has the same name in every package that holds it, so a
reader who knows the word knows the paths.

The domain keeps five folders that are not features and are not
renamed: `player/` (the id every feature keys by), `time/`, `hash/`
and `grid/` (values with no game word), and `ports/` (`Clock`,
`IdGenerator`, `RandomSource`). They are the domain's kernel: every
feature may import them, and they import no feature.

A feature is cut into sub-areas, as `town` is, only when one of its
folders would pass the folder limit of section 6. A sub-area follows
the same grammar as a feature. `learning` (65 production files in the
domain) is cut the same way by its own tickets, file by file, from
this proposal: `reviews`, `frames`, `retention`, `curriculum`,
`scaffold`. A ticket may keep or merge a proposed sub-area and says
why.

#### The feature graph is the api's

Inside `apps/api/src` the features form a graph with no cycle, written
here and checked:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

A feature of the api imports only from a feature to its left. The
order is the api's own fact: every write runs inside the town's
transaction (`mutateTown`, 20 call sites), so `learning`, `placement`
and `holdout` call the town, and the town, once the lines below end,
calls none of them.

These are the lines against the graph on trunk, and how each one ends:

- **`http/` and `auth/`.** `http/sessionCookie.ts` and
  `http/requirePlayer.ts` import `auth/` (4 lines): they are the
  account's HTTP and move to `account/infrastructure/http/`. Five auth
  use cases import the type `Refusal` from `http/`: it is what an api
  use case refuses with, and it moves to `platform/application/`.
- **`account` reading `learning`.** `routes/auth.ts`, `routes/player.ts`
  and `routes/playerBodyOf.ts` import `learning/playerChromePhaseOf`
  and `learning/scaffoldBodyOf`. The chrome phase and the scaffold are
  what the player's body carries: `playerChromePhaseOf`, its port
  `ChromeProgressReader`, `scaffoldOf` and `scaffoldBodyOf` move to
  `account`, the leftmost feature that reads them.
- **`town` reading `learning`** (5 lines). `LessonLibrary` moves to
  `content`. `nextDueAtOf`, a pure rule over cards, moves to the
  domain. `schoolOverviewOf` and `openTextOf` present what the town's
  endpoints answer and import nothing of `learning/` but
  `LessonLibrary`: they move to `town`. `reportOf` leaves with the
  `report` feature.
- **`contentGate/` and `adapters/json/`.** The reading helpers both
  need (`frameWordsOf`, `readingOf`, `readingTermsOf`, `isUnitLesson`)
  move beside the JSON catalog, so the gate depends on the catalog and
  never the reverse.
- **One database.** A table lives with the adapter that inserts its
  rows, in that adapter's feature. 22 of the 24 tables are written by
  one adapter; the other two take an update of one column from a
  second (`players` from `DrizzleReportClosings`, `towns` from
  `DrizzleGuidanceDismissals`). So `cards` lives in `learning` with
  `DrizzleCardRepository`, though use cases of the town and of learning
  both save cards through the port; and `bandStarts`, `heldOutWords`,
  `holdoutChecks` and `holdoutCheckWords` live in `holdout` with
  `DrizzleBandStarts`, which stores a band start with its held-out
  words and its checks.

  Two adapters to the left of those tables read them. The town's
  screen read model does, through `aggregatedCards.ts`,
  `aggregatedBandStarts.ts` and `aggregatedPlacementScores.ts`, which
  nothing but `DrizzleTownRepository.ts` imports. And
  `DrizzleChromeProgress.ts`, which goes to the account, reads `cards`,
  `earnedSkills`, `townLessonSlots` and `towns`.

  So the graph has one written exemption, and it applies only inside
  `<feature>/infrastructure/postgres/`. A file there may import, from
  any feature's `infrastructure/postgres/`, the files that describe
  the schema: `*Tables.ts` and the row mappers `*FromRow.ts` and
  `*Columns.ts`. The row mappers are in it because the read model
  already needs them: `aggregatedCards.ts` maps a card row with
  `heldCardOf` of `storedMemoryCards.ts`, and
  `aggregatedBandStarts.ts` a check row with `holdoutCheckOf`. Neither
  file carries its role's name yet: the step that moves each renames
  it, `storedMemoryCards.ts` with the learning adapters (A8) and
  `holdoutCheckOf.ts` with the holdout's (A6).

  An exempted row mapper is a leaf, so the exemption opens no second
  path across the graph: a `*FromRow.ts` or `*Columns.ts` file imports
  only `@mygame/domain`, `drizzle-orm` and `*Tables.ts`, as the four
  on trunk do (`storedMemoryCards`, `holdoutCheckOf`, `lessonSlotOf`,
  `storedScaffoldColumns`). A file there may import nothing else from
  a feature to its right, and no file outside
  `infrastructure/postgres/` has the exemption. The features share one
  database, and a read model joins across it. A `*Tables.ts` file
  itself imports only to its left; every foreign key on trunk points
  at `players` or `towns`.

These are the lines the folder-to-folder imports and the adapters'
imports show on trunk. Each feature's override is what proves the rest
as its step lands.

The domain and the contracts are not ordered by this graph, and no
move of files could order them. In the domain the town reads what was
learned: 39 import lines in 14 files of `town/` name `learning/`, 4
name `holdout/` and 2 name `placement/`. And learning names the town
back: `Lesson` names the town's `ResourceKind`, two rules name
`TownSkill`, and `answerReview` earns the town's skill (10 import
lines). In the contracts `TownOverview` imports `LessonState`,
`ReleasedLessonState`, `DueHoldoutCheckState` and `PlacementBand`,
while `LessonState` imports `ResourceKind`. That is the product, not a
defect of the tree: a retained word earns the skill that raises a town
resource. What is checked in those two packages is the file: Biome's
`suspicious/noImportCycles` finds no cycle on trunk, and it stays at
none.

### 3. The folder grammar

`packages/domain/src/<feature>/`:

```
Town.ts  Stocks.ts  SiteAddress.ts     PascalCase: an entity, a value object or a type
accrueTown.ts  jobPayOf.ts  isLessonFinishedBy.ts  camelCase: a pure, synchronous function
useCases/     one file per thing a player or the clock can ask: reads ports, returns a Promise of Result
services/     a port-reading step shared by two or more use cases; never exported from index.ts
ports/        the interfaces the outside implements
testing/      the feature's in-memory ports and fixtures
<subArea>/    the same grammar again
```

Everything at a feature's root is pure. The top-level `useCases/` and
`testing/` folders dissolve into the features. The top-level `ports/`
keeps only `Clock`, `IdGenerator` and `RandomSource`, which belong to
no feature, and their fakes sit beside them in `ports/testing/`:
`firstItemsRandom.ts` and `sequentialIds.ts`. `Clock` has no shared
fake and gains none: a test that freezes time writes the one-line
literal `{ now: () => instant }`, as 37 test files do today.
A port more than one feature reads goes to the feature that holds its
adapter in the api, so a port and its adapter carry one feature name:
`BandStartRepository`, read by `holdout`, `town`, `placement` and
`answerReview`, goes to `holdout/ports/`, as `DrizzleBandStarts` goes
to `holdout` in the api. The domain has no feature graph (below), so
no rule places it to the left of anything.
`DomainError.ts`, `Result.ts` and `index.ts` stay at the root.
`town/projection-cases.json` stays where it is: Android's
`core/projection/build.gradle.kts` reads that path.

`apps/api/src/`:

```
index.ts  listen.ts  app.ts  composeServer.ts  composeStores.ts    the composition root
<feature>/
  application/                use cases the api owns
  application/ports/          the ports only the api needs
  infrastructure/http/        one file per endpoint, the route list, the presenters
  infrastructure/postgres/    Drizzle adapters, the feature's tables, row mappers
  infrastructure/memory/      in-memory adapters and the port's contract suite
  infrastructure/json/        the JSON catalogs (content)
  infrastructure/smtp/        the mailer (account)
  infrastructure/system/      the password hasher and the session tokens (account)
platform/
  application/                Refusal
  application/ports/          the ports no feature owns: Transaction, FailureSink, AfterResponse
  infrastructure/http/        the HTTP kernel
  infrastructure/postgres/    connect, migrate, the transaction
  infrastructure/system/      SystemClock, CryptoIdGenerator, CryptoRandomSource
  infrastructure/vercel/      VercelAfterResponse
```

An adapter lives in the feature whose port it implements.
`Argon2Passwords` and `CryptoSessionTokens` implement the account's
ports, so they live in `account/infrastructure/system/`, not in
`platform`.

`content/gate/` is the one feature folder that is neither
`application/` nor `infrastructure/`: it holds the content gate, the
checks the shipped content passes, one file per check in
`gate/checks/` and the readings they share beside them, and it is a
role of its own because no request, port or adapter reaches it, only
the gate's tests over what `infrastructure/json/` reads.

Only `platform/` may hold, at its root, a pure function that both its
`application/` and its `infrastructure/` read (`thrownCauseOf.ts`); a
feature folder may not.

Persistence follows the aggregate and HTTP follows the intent: a
sub-area of `town` has its own `infrastructure/http/` and
`application/`, and every table and adapter of the town aggregate is in
`town/infrastructure/postgres/`.

The files at the root of `apps/api/src` are the composition root and
the entries, and the only place that writes `new` before an adapter.
`composeStores.ts` takes the 15 constructions out of
`postgresTransaction.ts`.

`packages/contracts/src/<feature>/` holds the feature's schemas, one
per file as today, with no layer folder: the package is one layer.
`index.ts` stays the single entry.

### 4. Where a use case and a port go

Two questions, in this order:

1. Does it decide a game rule, or coordinate more than one domain
   port? It is a domain use case:
   `packages/domain/src/<feature>/useCases/`. ADR 004 stands.
2. Does it only place a domain use case inside a transaction, gather
   what one response needs, or belong to the account (auth is not a
   domain concern, `architecture.md`)? It is an api use case:
   `apps/api/src/<feature>/application/`.

A pass-through still earns no file (ADR 004): the route calls the
store.

A port follows its user. A port a domain use case reads is in the
domain. A port only the api's application reads (`Accounts`,
`AccountTokens`, `Mailer`, `ReportClosings`, `SeenTips`,
`GuidanceDismissals`, the read models `TownReader`, `TownNewsReader`
and `ChromeProgressReader`) is in `<feature>/application/ports/`, in
the leftmost feature that reads it. This amends the sentence "Ports …
Defined in `packages/domain`, implemented in `apps/api`" of
`architecture.md`.

`application/` never imports `infrastructure/`. Three inversions
follow:

- `Transaction<Stores>` becomes a port in
  `platform/application/ports/`, generic in the stores it hands out.
  Each feature declares the stores it uses (`AccountStores`,
  `TownStores`) as an explicit list of ports, never a `Pick` of an
  adapter's type.
- `PasswordHasher` and `SessionTokens` become ports in
  `account/application/ports/`; `Argon2Passwords` and
  `CryptoSessionTokens` implement them.
- The screen read model `townWithSchoolOf` becomes its own port and its
  own adapter, apart from `TownRepository`: reading a screen and saving
  an aggregate change for different reasons.

`application/` never imports `@mygame/contracts`, Hono, Drizzle or zod.
A use case answers domain values; a presenter in `infrastructure/http/`
turns them into the wire type.

### 5. The file-name grammar

A reader tells the role from the name and the folder, with no file
open.

| Role | Folder | Name | Example |
|---|---|---|---|
| Entity, value object, type | domain feature root | noun, PascalCase | `Town.ts`, `SiteAddress.ts` |
| Pure rule | domain feature root | `derive*`, `*Of`, `*At`, `is*`, `has*`, `refuse*` | `jobPayOf.ts`, `isLessonRetained.ts` |
| Domain use case | `useCases/` | verb phrase | `sendJob.ts` |
| Domain service | `services/` | verb phrase | `resolveStoredTown.ts` (today `resolvedTownOf`) |
| Port | `ports/` | noun + role | `TownRepository.ts`, `PasswordHasher.ts` |
| Api use case | `application/` | verb phrase, never a domain export's name | `resolveCurrentTown.ts` (today `currentTownOf`), `serveReport.ts` (today `reportOf`) |
| Endpoint | `infrastructure/http/` | use case + `Route` | `sendJobRoute.ts` |
| Route list | `infrastructure/http/` | area + `Routes` | `jobsRoutes.ts` |
| Presenter | `infrastructure/http/` | `present` + wire noun | `presentTownOverview.ts` (today `townOverviewOf`), `presentTownJob.ts` (today `jobStateOf`) |
| Adapter | `infrastructure/<technology>/` | technology + port | `DrizzleTownRepository.ts` |
| Tables | `infrastructure/postgres/` | feature + `Tables` | `townTables.ts` |
| Row mapper | `infrastructure/postgres/` | noun + `FromRow`, noun + `Columns` | `lessonSlotFromRow.ts` (today `lessonSlotOf`), `storedScaffoldColumns.ts` |
| Contract suite | `infrastructure/memory/` | port + `Contract.testSupport.ts` | `townRepositoryContract.testSupport.ts` (today `adapters/townRepositoryContract.ts`) |
| Test | beside its subject | subject + `.test.ts` | `sendJobRoute.test.ts` |

Three rules make the table checkable:

- **`*Of` is a pure, synchronous derivation and nothing else.** A
  function that returns a promise is named by a verb, and no file under
  `application/`, `useCases/` or `services/` ends in `Of.ts`. This
  restates `typescript-style.md` ("a function that reads a port is a
  use case and is named as one") as a file-name rule.
- **A function that writes is not named as a reading.**
- **One endpoint, one file**, holding its OpenAPI declaration and its
  handler. `<area>Routes.ts` only lists them, in the order the
  declarations are registered today, so `openapi.json` does not change.
  The block written ten times in `routes/town.ts` (parse, `mutateTown`,
  use case, read, answer) is written once in
  `town/infrastructure/http/`.

`typescript-style.md` gains these rows in "Naming by layer", and its
row "Hono route module" and its example `adapters/` leave with the
folders they name.

### 6. The limits a check enforces

| Limit | Value | Enforced by | Over it on trunk |
|---|---|---|---|
| Lines in a production file | 250 | Biome `style/noExcessiveLinesPerFile` | 7, and `packages/domain/src/index.ts` (326), and the suite `adapters/townRepositoryContract.ts` (390) |
| Lines in a function | 50 | Biome `complexity/noExcessiveLinesPerFunction` | 7, and 5 of the suites named `*Contract.ts` |
| Cognitive complexity | 15, as today | Biome `complexity/noExcessiveCognitiveComplexity` | 0 |
| Production files in one folder, not counting sub-folders | 30 | `scripts/mygame-structure-check` | 5: domain `town` 126, the contracts' root 83, domain `learning` 65, api `contentGate` 32, `adapters/postgres` 31 |
| Lines in a test file | 600 | Biome, by override | 8 |
| Import cycles between files | none | Biome `suspicious/noImportCycles` | 0 |

The two caps of "Readability standards", exports per file and methods
per class or interface, complete the list.

The seven files over 250 lines are `DrizzleTownRepository.ts` (734),
`Town.ts` (702), `schema.ts` (660), `routes/town.ts` (477),
`townOverviewOf.ts` (442), `useCases/answerReview.ts` (301) and
`routes/townDeclarations.ts` (285). The seven functions over 50 lines
are the five route factories (`townRoutes` 326, `holdoutCheckRoutes`
83, `placementRoutes` 78, `authRoutes` 74, `learningRoutes` 62) and
two exhaustive `switch`es, `eventOf` (53) and `townNewsItemOf` (52).

A test file is `*.test.ts`, `*.testSupport.ts`, or a file under a
domain `testing/` folder. "About 30 lines" in `typescript-style.md`
stays the target a reviewer asks for; 50 is the wall the gate builds.

Two standing exemptions, written as Biome overrides with no end date:
each package's `src/index.ts`, which is a list, for the file limit; and
test files for the function limit, since a `describe` callback is not a
function a reader holds in the head.

An exhaustive `switch` gets no exemption. `townNewsItemOf` and
`eventOf` are split along the event union's sub-areas (building,
school, hiring, jobs), one short `switch` each, the outer one still
exhaustive.

Until its step lands, a file over a limit is named in one baseline: a
Biome override that turns that rule off for it, or, for a limit the
structure check enforces, a line `<check> <path>` of
`scripts/mygame-structure-check.baseline`, a file beside the script and
never inside it. The step that fixes the file deletes its line, and the
check fails on a line whose file no longer fails. The last step of the
migration lands with every baseline empty. A baseline is a list, not
code, so it is not a shim under `architecture.md`.

### 7. The checks

Each check has a name, the one the script prints and the baseline
file uses, and each is expected empty. They run in
`scripts/mygame-structure-check`, which the `gate` script calls after
`biome check`, and they are listed in `architecture.md` beside the
leak check.

```
# application_imports_infrastructure
rg -n "from '(\.\./)+(\w+/)*infrastructure/" apps/api/src -g '**/application/**' -g '!*.test.ts'
# application_knows_wire: no contracts, Hono, Drizzle or zod in the application
rg -n "from '(@mygame/contracts|@?hono|drizzle|zod)" apps/api/src -g '**/application/**' -g '!*.test.ts'
# persistence_knows_http
rg -n "from '@?hono" apps/api/src -g '**/infrastructure/{postgres,memory,json,smtp,system}/**' -g '!*.test.ts'
# http_knows_database
rg -n "from 'drizzle" apps/api/src -g '**/infrastructure/http/**' -g '!*.test.ts'
# adapter_built_outside_root: only the composition root constructs an adapter
rg -n "new (Drizzle|Smtp|Argon2|Crypto|System|Vercel)\w*\(" apps/api/src -g '!*.test.ts' -g '!*.testSupport.ts' -g '!/apps/api/src/*.ts'
# reading_named_of_is_async: `*Of` is never asynchronous
rg -l "Promise<|\basync\b" apps/api/src packages/domain/src -g '*Of.ts' -g '!*.test.ts'
# use_case_named_of: a use case or a service is never named `*Of`
fd -g '*Of.ts' -E '*.test.ts' . apps/api/src packages/domain/src | rg '/(application|useCases|services)/'
# domain_promise_outside_its_roles: only a use case, a service, a port or a fake names a promise
rg -l "Promise<|\basync\b" packages/domain/src -g '!**/useCases/**' -g '!**/services/**' -g '!**/ports/**' -g '!**/testing/**' -g '!*.test.ts'
# use_case_imports_use_case: from its own folder (`./x`) or another's
rg -n "from '(\./|(\.\./)+(\w+/)*useCases/)" packages/domain/src -g '**/useCases/**' -g '!*.test.ts'
# service_is_public
rg -n "/services/" packages/domain/src/index.ts
# folder_over_limit: no folder passes 30 production files
{ printf '%s\n' apps/api/src packages/domain/src packages/contracts/src; fd -t d . apps/api/src packages/domain/src packages/contracts/src; } | while read -r d; do n=$(fd -t f -e ts -d 1 -E '*.test.ts' -E '*.testSupport.ts' . "$d" | wc -l); [ "$n" -gt 30 ] && echo "$n $d"; done
```

`file_over_export_cap` and `type_over_method_cap` are the two commands
of section 9.

Run on trunk with today's folders, `adapter_built_outside_root` lists
the 15 constructions in `postgresTransaction.ts`,
`reading_named_of_is_async` 20 files,
`domain_promise_outside_its_roles` 41 and `folder_over_limit` 5
folders; `use_case_imports_use_case` is empty over today's `useCases/`,
and the others have no target folder yet.
`adapter_built_outside_root` leaves out `Json*` and `Memory*` on
purpose: a JSON catalog is built by its own static `fromDirectory`, and
an in-memory adapter by a test or by its own factory.

`feature_graph`, the graph of section 2, is one
`style/noRestrictedImports` override per feature of the api in
`biome.json`: the override over `apps/api/src/account/**` forbids
`**/town/**`, `**/learning/**`, `**/placement/**`, `**/holdout/**` and
`**/report/**`, and so on down the line, with the schema exemption of
section 2 written into each. The domain and the contracts get no such
override. The same rule as a line a reader or a ticket can run, here
for the account:

```
rg -n "from '(\.\./)+(\w+/)*(town|learning|placement|holdout|report)/" apps/api/src/account -g '!*.test.ts' | rg -v "^[^:]*/infrastructure/postgres/[^:]*:.*/infrastructure/postgres/\w+(Tables|FromRow|Columns)'"
```

A ticket that proves the graph with the first half alone would refuse
`DrizzleChromeProgress`, which sits in the account and imports the
tables of `learning` and `town`.

`map`, as the script reports it: every folder directly under
`apps/api/src` and `packages/domain/src` is a row of the folder table
of `ARCHITECTURE.md`, and every row of the table is a folder under one
of them. It has no baseline.

```
diff <(fd -t d -d 1 . apps/api/src packages/domain/src -x basename | sort -u) <(rg -o '^\| `(\w+)` \|' -r '$1' ARCHITECTURE.md | sort -u)
```

It passes on nothing until `ARCHITECTURE.md` exists, and it is hard
from the commit that adds the file. While the tree is mixed the table
therefore has a row for every folder that still stands, old ones
included: `adapters`, `routes`, `auth`, `contentGate`, `useCases` and
`testing` each keep a row that says where their files are going, and
the step that empties a folder deletes its row with it. The table is
then the migration's progress at every commit, and at A10 it holds
only the folders of section 2.

The existing leak checks and `pnpm gate` stay as they are.

### 8. The human map is one file: `ARCHITECTURE.md`

One file at the repo root, at most 150 lines, covering the TypeScript
backend. It lands with the first step that gives it a row (A1), not
with this ADR. It holds what the tree cannot say by itself:

1. The packages and their arrows.
2. The folder table: the features of section 2 and the domain's five
   kernel folders, one row and one sentence for each folder directly
   under `apps/api/src` or `packages/domain/src`, and until A10 one
   row for each old folder that still stands.
3. The folder grammar and the file-name grammar of sections 3 and 5.
4. One request followed end to end with real paths: `POST
   /town/jobs`, from
   `apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts` to the
   domain's `town/jobs/useCases/sendJob.ts` to
   `apps/api/src/town/infrastructure/postgres/DrizzleTownRepository.ts`
   and back through `presentTownOverview.ts`.
5. "Where does a new thing go": the two questions of section 4, and
   the files a new endpoint adds, in order.
6. The checks of section 7, by name, and what each one guards.

It holds no inventory of files. The tree is the inventory, and the
grammar is what makes the tree readable; a list of files is the part
of a map that rots.

No rule is amended for it. The no-comments rule binds code, and it
stays: a role is said by the folder and the name, which a comment
would only repeat. Per-feature `README.md` files are refused: sixteen
files that narrate their module are sixteen files that drift, and the
package `CLAUDE.md` files already refuse to narrate for that reason.
The `useCases/` folder of a feature, read as a list, is that feature's
table of contents, and its tests are its spec.

Each fact keeps one home. `ARCHITECTURE.md` owns the layout.
`.claude/rules/architecture.md` owns the laws (the dependency
direction, errors, time, lazy evaluation, the checks) and links to the
map instead of describing folders. The package `CLAUDE.md` files keep
commands and traps and replace "the code is the map" with a link.
`CONTEXT.md` stays the glossary. The map check of section 7 fails the
gate when the table and the folders part (the `map` check).

### 9. Readability standards

The bar the owner named, as the standards a reviewer holds a change
to. Each one has one home, a rule file that states it. This section
names that home and restates nothing; where it adds a rule, the rule
is written here once and `typescript-style.md` or `architecture.md`
takes it in step 0.

A check is named beside a standard only for the part of it a machine
can see. Most of these checks are proxies: they catch the common way
of breaking the standard, and the rest stays with the reviewer. The
table says which.

| Standard | Stated in | Checked by | What the check does not see |
|---|---|---|---|
| Intention-revealing names (*Clean Code*, ch. 2) | `naming.md`: "A name is a sentence fragment a reader understands without opening the file", and its Rejected list | nothing | all of it: review |
| One word per concept (ch. 2) | `typescript-style.md`, Naming by layer, with the role rows of section 5: a use case is a verb, and `Route`, `Routes`, `present*`, `*FromRow`, `*Columns`, `*Tables`, `*Repository` each name one role | `reading_named_of_is_async`, `use_case_named_of` | every word but `Of`: a presenter not named `present*` passes |
| No name hides a write (command-query separation) | section 5: `*Of` is a pure, synchronous derivation; a function that writes is not named as a reading | `reading_named_of_is_async`, `domain_promise_outside_its_roles`: a write is a port call, and a port call is a promise | a reading-shaped name that is not `*Of`, in the api |
| Small functions that do one thing (ch. 3) | `principles.md`, Flat control flow; `typescript-style.md`, Idioms ("about 30 lines") | Biome: 50 lines a function, cognitive complexity 15, `noNestedTernary`, `noUselessElse` | "one thing": a short function can still do two |
| Small classes with one reason to change (ch. 10) | `principles.md`, Single responsibility | 250 lines a file, `file_over_export_cap`, `type_over_method_cap` | the reasons: the checks measure size |
| The dependency rule (*Clean Architecture*, ch. 22) | `architecture.md`, Layers and the dependency direction | its leak checks between packages; inside the api `application_imports_infrastructure`, `application_knows_wire`, `persistence_knows_http`, `http_knows_database`, `adapter_built_outside_root`, `feature_graph` | nothing between packages; inside the api, a dependency passed as a value of a concrete type |
| Screaming Architecture (ch. 21) | sections 2 and 3, then `ARCHITECTURE.md` | `map`, `folder_over_limit` | whether a folder's name is the right word |

`principles.md` gives each SOLID principle a test a reviewer runs, in
"SOLID, with its tests". This ADR names the nearest check that runs
without the reviewer, and says how near it is:

- **Single responsibility**: the file limit and the two caps. A proxy:
  they bound size, and the test ("name what it does without and") is
  still the reviewer's.
- **Open/closed**: an exhaustive `switch` with no `default`, which
  `tsc` refuses when a case is missing (`typescript-style.md`, Types).
  A proxy: it proves no case is forgotten, not that a sixth building
  touches few files.
- **Liskov**: the port's contract suite, run against every adapter of
  the port (`<port>Contract.testSupport.ts`). This one is the test
  itself.
- **Interface segregation**: `type_over_method_cap`. A proxy: a ceiling
  on width, not proof that every method has a caller.
- **Dependency inversion**: the leak checks, which are the test itself
  between packages; `application_imports_infrastructure` and
  `adapter_built_outside_root` carry it inside the api.

#### No god file, no god class: two caps

The 250 and 50 lines of section 6 stop a file or a function from
growing long. Two caps stop it from growing wide. Both are counted by
the structure check from the text Biome formats, and neither binds a
test file.

**At most 5 exports in a production file.** `typescript-style.md`
asks for one primary thing per file; the cap is the wall behind it:
the primary thing and the few types that travel with it. It does not
bind a package's `src/index.ts` or a `*Tables.ts` file, which are
lists by nature and bounded by the file limit. On trunk 546 of the 558
production files that export anything export five names or fewer, and
10 files pass the cap (`file_over_export_cap`):

```
rg -c '^export ' apps/api/src packages/domain/src packages/contracts/src -g '*.ts' -g '!*.test.ts' -g '!*.testSupport.ts' -g '!**/testing/**' -g '!index.ts' -g '!*Tables.ts' | awk -F: '$2 > 5'
```

`schema.ts` (36), `TownSettings.ts` (9), `Lesson.ts` (8),
`responseDeclarations.ts` (7), and `nextStepOf.ts`, `BuildingWork.ts`,
`BuildingLevel.ts`, `HoldoutCheck.ts`, `cardWordFormOf.ts` and
`Accounts.ts` (6 each).

**At most 7 methods in a class or an interface.** A method is a member
that takes arguments: a method, a method signature, or a property
whose value is a function. The constructor and the accessors (`get`,
`set`) are not counted: an accessor reads a field. On trunk 78 of the
84 classes and interfaces of production files hold five methods or
fewer, the largest that reads as one concern holds seven
(`DrizzlePlacements`), and 4 pass the cap (`type_over_method_cap`):

```
fd -e ts -E '*.test.ts' -E '*.testSupport.ts' -E testing . apps/api/src packages/domain/src packages/contracts/src -X awk '
  /^(export )?(abstract )?(class|interface) / { type = $0; n = 0; next }
  type == "" { next }
  /^}/ { if (n > 7) print n, FILENAME; type = ""; next }
  /^  (static )?(get|set) / || /^  (private |protected )?constructor\(/ { next }
  /^  ([a-z#]+ )*[A-Za-z_][A-Za-z0-9_]*\??(<[^(]*>)?(: | = (async )?)?\(/ { n++ }'
```

- `Town` (21): two factories, 17 transitions and derivations for
  building work, hiring and jobs, two private steps. It is cut along
  the sub-areas its folder is cut by. Its ticket decides the shape and
  names every caller it changes: the transitions are called from 13
  production files of the domain beside `Town.ts` and from one line of
  the api (`town.hiresAt` in `townOverviewOf.ts`). Moving the validation out
  of `Town.ts` does not bring the class under the cap, nor the file
  under 250 lines: the class alone is 367.
- `JsonLessonCatalog` (14): one class behind every content port. It is
  cut by the port each part serves, over one parsed shelf.
- `Accounts` and `DrizzleAccounts` (11 each): players, credentials,
  sessions and the player row lock in one port. They are cut into one
  port per concern.

A file over a cap on trunk has its line in
`scripts/mygame-structure-check.baseline` until the step that moves
it, as section 6 says of every limit.

## The migration

Every step is one pull request that moves files with `git mv`,
rewrites every importer in the same pull request, and deletes the
folder it empties. No file exists in two places, nothing re-exports an
old path, no flag picks a path: nothing here is a shim under
`architecture.md`. A step that changes a path a doc names changes the
doc (`verification.md`, the `.claude/**` and docs rows).

Three proofs hold at every step, on top of `pnpm gate`:

- `apps/api/openapi.json` is byte-identical: no wire change.
- `pnpm --filter @mygame/api db:generate --name probe` writes no file:
  no schema change.
- No assertion in a test changes. A test file may move, split or
  change an import; the pull request says which.

Renames ride with the move of their file, never ahead of it, and a
file moves once, to its last home.

### Why the tracks are independent

The api imports the domain and the contracts only through their
entries: `rg -n "from '@mygame/(domain|contracts|catalog)/src" apps
packages` is empty. A move inside `packages/domain/src` changes
`index.ts` paths and nothing in the api; the same holds for the
contracts. Three tracks therefore run side by side from the first day.

### Step 0, the rails

- This ADR, accepted.
- `scripts/mygame-structure-check` with its baseline file and its
  `scripts/test-mygame-*`, wired into `gate`; checks whose target
  folders do not exist yet pass on nothing.
- The Biome limits of section 6 and the caps of section 9, each with
  its baseline.
- The amendments to `architecture.md`, `typescript-style.md`,
  `naming.md` and `principles.md`.
- One test support that resolves a path from the api package's root:
  done, as `apiPackagePath.testSupport.ts` at the root of
  `apps/api/src` (#1713). It is now the one test or test-support file
  that reads `import.meta.url`; before it, a test moved one folder
  deeper would have read a directory that does not exist. Five
  production files still find a path from their own depth
  (`index.ts`, `listen.ts`, `writeOpenApiDocument.ts`,
  `adapters/postgres/migratePostgres.ts`,
  `contentGate/gateContentOf.ts`) and are rewritten by the step that
  moves each; the first three do not move.

### Track A, the api

Serial first, because these three touch every importer:

- **A1. `platform/`.** `http/`, `failures/`, `afterResponse/`,
  `time/`, `adapters/system/`, `adapters/vercel/`, and the Postgres
  kernel (`connectPostgres`, `migratePostgres`, `postgresTransaction`,
  `jsonAggregateOf`, `violatedUniqueConstraint`). Four of those files
  are the account's and never enter `platform`: `http/sessionCookie.ts`
  and `http/requirePlayer.ts` move in this step, straight to
  `account/infrastructure/http/`, so that `http/` is emptied;
  `Argon2Passwords` and `CryptoSessionTokens` stay in
  `adapters/system/` for A2. `ARCHITECTURE.md` lands here with the
  grammar and one row for every folder that stands.
- **A2. The inversions of section 4.** `Transaction<Stores>`,
  `composeStores.ts`, and the ports `PasswordHasher` and
  `SessionTokens` in `account/application/ports/`. This step moves
  `Argon2Passwords` and `CryptoSessionTokens` from `adapters/system/`
  to `account/infrastructure/system/`, where they implement those
  ports, and `adapters/system/` is gone. `application_imports_infrastructure`
  and `application_knows_wire` can fail from here.
- **A3. `schema.ts` becomes one `<feature>Tables.ts` per feature**, in
  each feature's `infrastructure/postgres/`, each table with the
  adapter that inserts its rows (section 2); `drizzle.config.ts` takes
  the glob
  `./src/**/infrastructure/postgres/*Tables.ts`. The `db:generate`
  probe is this step's whole proof.

Then a wave of four peers, on disjoint files:

- **A4 `account`**: `auth/`, `routes/auth*`, `routes/player*`, the
  accounts, tokens and mailer adapters, and what section 2 moves to
  the account: the chrome phase with its port and adapters, and the
  scaffold.
- **A5 `content`**: `adapters/json/` and `contentGate/`, the cycle
  between them ended, and `LessonLibrary`.
- **A6 `placement` and `holdout`**: their routes, adapters and
  presenters.
- **A7 `report`**: `town/reportOf`, `ReportClosings`, its routes and
  adapters.

These four still import `town/mutateTown` at its old path; A9 rewrites
them when it moves the file. They meet only in the import lines of
`app.ts`, `composeServer.ts` and `composeStores.ts`, so they merge one
at a time through `scripts/mygame-merge` and each rebases onto the
last.

Then, serial again, because `learning` and `town` hold the cycle:

- **A8 `learning`**: the cycle of section 2 ended, then the move.
- **A9 `town`**, three pull requests by one peer:
  persistence (`DrizzleTownRepository` split into the repository, the
  read model with its three `aggregated*` files, and the row mappers);
  HTTP (one endpoint per file per sub-area, `town.test.ts` split the
  same way); presenters (`townOverviewOf` split by section of the
  screen).
- **A10. Close**: `routes/`, `adapters/`, `auth/` and `contentGate/`
  no longer exist; every baseline is empty; every check fails hard; the
  map's table is complete. A10 waits on D1, D2 and C1 as well as on A9,
  since the baselines hold domain and contracts files until those
  tracks end.

### Track D, the domain, beside all of Track A

- **D1 `town`**, one peer, one pull request per sub-area in this
  order: `jobs`, `hiring`, `school`, `building`, `guidance`, `news`,
  then the root's `useCases/`, `services/`, `ports/` and `testing/`,
  then `Town.ts`: the 258 lines of module-level functions ahead of the
  class (`:78` to `:335`, the stored-state validation `refuseInvalid*`
  among them) leave the file, and the class is cut as section 9 says.
- **D2 `learning`, then `placement`, then `holdout`**, a second peer:
  the root `useCases/`, `ports/` and `testing/` dissolve into them.

D1 and D2 meet in `index.ts` and wherever a file of the town names
`learning`, `placement` or `holdout`, or one of theirs names the town,
which is every sub-area of the town but `jobs` and `hiring`:

- `school`: `startSchoolLesson` (also `placement`, 2 lines),
  `settledLessonSlot`, `admitSchoolLesson`, `settledSchoolOf` (also
  `holdout`, 1 line), `stopSchoolLesson`, `schoolLessonsOf`,
  `saveLessonSlot`, `LessonSlot`.
- `guidance`: `nextStepOf`, 10 import lines from `learning` and 3 from
  `holdout`, 13 in all.
- `building`: `startBuildingWork`, `openedLevelOf`, `wordShortfallOf`.
- `news`: `TownEvent`. The root: `TownSkill`.
- Back from D2's side: `Lesson`, `chromePhaseOf` and `retainedWordsOf`
  name the town by type, and `answerReview` imports it in 10 lines.

A D1 pull request that moves one of those files and a D2 pull request
that moves what it imports rewrite the same import line, so the two
tracks merge one at a time and the second rebases.

### Track C, the contracts, any time

- **C1**, one peer: the 83 schemas move under the feature names of
  section 2. Only `index.ts` paths change.

### Peers at once

Step 0 alone. Then D1, D2 and C1 beside A1 to A3: four. During the
wave A4 to A7: up to seven, fewer if D or C have finished. A8 to A10
with whatever of Track D remains: two or three. The owner's machine
rule (`CLAUDE.md`, Machine safety) caps the number below these when it
must; the order does not change.

## Considered options

### A. Feature first, then the layers (chosen)

The tree answers "what does this game do" at the first level and
"which layer is this" at the second. A feature is one name in three
packages, down from eight directories. The cost is the migration: most
of the 560 production files of the backend move, each of them once.

### B. Layer first: `domain`, `application`, `infrastructure`

The owner's three layers as the first cut: `packages/domain`,
`apps/api/src/application/<feature>/`,
`apps/api/src/infrastructure/<technology>/<feature>/`.

- For: the dependency rule is one glance at three folders; every
  hexagonal text draws it this way; the migration is smaller, since
  `adapters/` and `routes/` are already close to it.
- Against: it is today's structure with better names. Sending a job
  stays in one folder per layer and per technology, and the domain.
  The top level says "this is hexagonal", which is the complaint
  Screaming Architecture was written about, and the first finding of
  the audit stays open.

Refused as the first cut, kept as the second: the three words are in
the tree, one level down, at every feature.

### C. Feature first, technology folders directly under the feature

The first draft of this ADR: `town/postgres/DrizzleTownRepository.ts`
beside `town/application/`, the technology's name standing for the
infrastructure layer.

- For: one path segment fewer, and a check can still name the
  technology folders in one line.
- Against: a reader has to know that `postgres`, `memory`, `http`,
  `json` and `smtp` are all one layer; the tree does not say so. The
  owner asked that the layers be visible, and a layer that is a set of
  five folder names is not.

Refused by the owner. The wrapper is the literal word.

### D. Three strict layers: use cases leave the domain package

`packages/domain` keeps entities and pure rules only; its 37
port-reading files and every port join the 23 orchestration functions
the api already holds, in `application/`.

- For: one home for a use case, no second question in section 4; it
  is the textbook ring diagram.
- Against: it reverses ADR 004. The use cases and their tests cross a
  package boundary; the tests that run in milliseconds on in-memory
  ports move into the package whose tests need Postgres; the ports
  the pure rules name by type follow them or split. It buys one fewer
  rule to remember at the price of the fastest part of the suite.

Refused. Section 4's two questions are the cost of keeping ADR 004.

### E. Keep the folders, fix the names and the sizes

Rename the `*Of` files by role, split the large files, add the limits;
move nothing.

- For: a tenth of the churn; findings 3 and 4 of the audit close.
- Against: findings 1, 2 and 5 stay. `domain/town` is still 126 flat
  files with better names, and a feature is still eight places.

Refused as the end, but it is what each step of option A does to the
files it moves.

### One feature graph for the three packages

The first draft drew the graph of section 2 once, for the domain, the
api and the contracts. Refused on the code: the domain's `town` reads
`learning` in 39 import lines, the reverse of the api's order, and
`learning` names the town back. A single order would need a home to
the left of both for the words they share (`ResourceKind`, the skill a
lesson earns), which is a change to the model, not a move of files,
and no ticket of this migration makes it.

### The map

- **Per-feature `README.md`**: closest to the code, and sixteen
  narrations to keep true. Refused.
- **Only the package `CLAUDE.md` files**: already there, named for a
  tool, and they forbid narration by their own last line. Refused as
  the map, kept for commands and traps.
- **A header comment per file stating its role**: needs the
  no-comments rule amended, and says what the folder and the name
  will already say. Refused.
- **One `ARCHITECTURE.md`, checked against the tree**: chosen.

## Consequences

- A human finds a thing by walking: the feature, then the layer, then
  the verb.
- The api's top level reads as the game: `account`, `town`,
  `learning`, `placement`, `holdout`, `report`, `content`, and one
  `platform`.
- Adding an endpoint adds a known set of files in one feature: the
  contract schema, the domain use case when there is a rule, the
  route, and a presenter when the answer is new.
- There are more folders and deeper paths:
  `apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts` sits
  four folders under `src`. The path reads as a sentence, which is the
  trade.
- `routes/town.ts` becomes seventeen endpoint files and their route
  lists. A reader sees one endpoint whole and no longer sees all
  seventeen at once; the route list file is where that view lives.
- Three ports appear with one implementation each (`PasswordHasher`,
  `SessionTokens`, `Transaction`). `principles.md` ranks the
  architecture rules above YAGNI; the dependency rule is the reason
  they exist.
- The two caps ask for more than moves. `Town`, `Accounts` and
  `JsonLessonCatalog` are cut, and the domain files that call a `Town`
  transition change with it.
- The domain's features stay unordered among themselves. A reader of
  `town/school` opens `learning`, and a reader of `answerReview` opens
  `town`; section 2 says why, and no check pretends otherwise.
- `git blame` crosses a rename for every moved file; `git log
  --follow` reads through it. Moves and edits are separate commits
  where a file both moves and changes.
- Every doc that names a moved path is edited by the step that moves
  it: `apps/api/CLAUDE.md` (`src/town/mutateTown.ts`,
  `src/adapters/postgres/schema.ts`, `src/failures/thrownCauseOf.ts`,
  `src/truncatePlayerTables.testSupport.ts`), `packages/domain/CLAUDE.md`
  (`src/testing/`, `testing/firstItemsRandom.ts`),
  `.claude/rules/verification.md` (the `schema.ts` row),
  `.claude/rules/architecture.md`. An ADR keeps the paths of its day.
- Android is untouched: `projection-cases.json` keeps its path and
  `openapi.json` does not change.
- The gate grows by one script and a few Biome rules, all of them
  static; no test, build or container is added.
- While the migration runs the tree is mixed. The baselines and the
  map's table say at every commit which features have moved.

## References

- The backend readability audit: the second comment of issue #1710,
  read at `febbf268`. Its findings are cited by number; its counts
  were retaken on trunk for this ADR.
- ADR 001, ADR 004: the packages and the pure domain, kept.
- ADR 005, ADR 006, ADR 031: lazy evaluation, Drizzle, the Vercel
  entry, kept.
- ADR 040: the definition of a shim that the migration is held to.
- `.claude/rules/architecture.md`, `typescript-style.md`, `naming.md`,
  `principles.md`, `testing.md`, `verification.md`.
- Robert C. Martin, *Clean Architecture*, chapters 21 (Screaming
  Architecture), 22 (The Clean Architecture) and 14 (Component
  Coupling, the Acyclic Dependencies Principle); *Clean Code*,
  chapters 2 (Meaningful Names), 3 (Functions) and 10 (Classes).
