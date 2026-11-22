---
status: proposed
date: 2026-11-21
---
# A domain use case is a class: its ports in the constructor, one `execute`

## Context

ADR 052 put the hexagon in the tree: a feature, then `useCases/`,
`services/`, `ports/` in the domain and `application/`,
`infrastructure/` in the api. The owner, reading the backend with no
AI, still finds one role that does not look like its part (#1803): a
port is an `interface`, an adapter is a `class` that implements it,
and a use case is a bare function that takes a `dependencies` object.
The owner pointed at the shape Codely teaches, `CourseCreator` of
`CodelyTV/typescript-ddd-example`, read at `94717b07`:

```ts
export class CourseCreator {
  constructor(private repository: CourseRepository, private eventBus: EventBus) {}

  async run(params: { id: CourseId; name: CourseName; duration: CourseDuration }): Promise<void> {
    const course = Course.create(params.id, params.name, params.duration);
    await this.repository.save(course);
    await this.eventBus.publish(course.pullDomainEvents());
  }
}
```

What trunk holds, counted at `cc7c60a0`:

- **26 use cases, one shape.** The eight `useCases/` folders of
  `packages/domain/src` hold 26 production files. Each exports one
  `export const <verb> = async (input, dependencies):
  Promise<Result<T, DomainError>>`: the ask first, the ports second,
  in all 26. 25 export their own `<Verb>Dependencies` type;
  `readPlacement` reads the `PlacementOfferDependencies` of the
  service it calls.
- **From 2 ports to 12.** `skipHoldoutCheck` reads two
  (`bandStarts`, `clock`), `sendJob` five, `settleSchoolLesson` eight,
  `startSchoolLesson` eleven, and `answerReview` is handed twelve
  names at its call site (`submitReviewAnswer.ts:54`).
- **10 hand the whole set on.** `beginHoldoutCheck`, `answerReview`,
  `answerPlacement`, `beginPlacement`, `readPlacement`,
  `skipPlacement`, `quoteCleanUp`, `settleSchoolLesson`,
  `startSchoolLesson` and `stopSchoolLesson` pass their `dependencies`
  object to a service or to a step of their own file, typed by a
  dependencies type (`admitPlacementOffer(playerId, dependencies)`).
- **30 call sites in 27 files, all in the api**: 18 files under
  `infrastructure/http/` and 9 under `application/`. No use case calls
  another and no domain function calls one
  (`use_case_imports_use_case` is empty). The web calls none.
- **A use case is given ports that live for one unit of work.**
  `composeStores.ts:24` builds the 17 stores once per transaction,
  from that transaction's session (`towns: new
  DrizzleTownRepository(transaction, 'lockedForUpdate')`, `:31`), and
  26 of the 30 call sites read their stores from there. `mutateTown`
  fixes one instant per mutation and hands it as the clock
  (`mutateTown.ts:35-36`, `const mutationClock: Clock = { now: () =>
  mutatedAt }`). Three call sites hand a port made for the call:
  `quoteJobNow.ts:32-35` and `quoteCleanUpNow.ts:34-38` (`towns: {
  townOf: async () => stored }`, `clock: { now: () => readAt }`), and
  the dry run of `resolveCurrentTown.ts:71-76` (`alreadyRead`,
  `discardingNews`, `readClock`). One call site of the 30,
  `respondRegionMap.ts:26`, reads only adapters that live as long as
  the process.
- **The tests already inject.** 28 test files sit beside the 26 use
  cases. Each builds the `dependencies` object from the in-memory
  ports of its feature's `testing/` folder (`inMemoryTowns`,
  `inMemoryRegionMap`, `inMemoryTownNews`) and a fixed clock. One test
  outside a `useCases/` folder calls two use cases
  (`holdout/releasedLessonsOf.test.ts`), one fixture is typed by a
  dependencies type (`answerReviewFixtures.ts:32`), and one api test
  calls two inside `server.inTransaction` (`composeServer.test.ts:251`
  and `:297`).
- **The rules disagree about the shape.** `architecture.md:61`: "Use
  cases are one exported function or one class with one `execute`".
  `typescript-style.md:29`: "a function that reads a port is a use
  case and is named as one". `principles.md:16`: "A plain function
  beats a class with one method". No class with an `execute` exists:
  `rg '\.(run|execute)\(' apps/api/src packages/domain/src -g
  '!*.test.ts'` is empty.

What is not reopened: the packages and the pure domain (ADR 001, ADR
004), lazy evaluation (ADR 005), the tree and the checks of ADR 052,
`Result` and the sealed `DomainError`, the injected `Clock`, manual
composition in `composeServer.ts` and `composeStores.ts`.

## Decision

### 1. The shape

A domain use case is a class. Its constructor takes the ports, its one
method takes the ask.

```ts
export type SendJobDependencies = {
  readonly towns: TownRepository
  readonly map: RegionMapReader
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export class SendJob {
  constructor(private readonly dependencies: SendJobDependencies) {}

  async execute(order: JobOrder): Promise<Result<Town, DomainError>> {
    const { towns, map, news, catalog, clock } = this.dependencies
    const dispatched = await dispatchJob(order, { towns, map, catalog }, clock.now())
    if (!dispatched.ok) {
      return dispatched
    }
    const { town, events } = dispatched.value
    const saved = await saveChangedTown({ town, events }, towns, news)
    if (!saved.ok) {
      return saved
    }
    return ok(town)
  }
}
```

Today, `packages/domain/src/town/jobs/useCases/sendJob.ts:13-36`:

```ts
export type SendJobDependencies = {
  readonly towns: TownRepository
  readonly map: RegionMapReader
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const sendJob = async (
  order: JobOrder,
  { towns, map, news, catalog, clock }: SendJobDependencies,
): Promise<Result<Town, DomainError>> => {
  const dispatched = await dispatchJob(order, { towns, map, catalog }, clock.now())
  if (!dispatched.ok) {
    return dispatched
  }
  const { town, events } = dispatched.value
  const saved = await saveChangedTown({ town, events }, towns, news)
  if (!saved.ok) {
    return saved
  }
  return ok(town)
}
```

The rules of the shape:

- **The constructor takes one parameter, `dependencies`**, typed by
  the file's `<Verb>Dependencies`, written as a parameter property,
  `private readonly`, the form the adapters already use
  (`DrizzleTownRepository.ts:68-71`). The constructor has no body.
- **The dependencies type lists every port by name**, as today. It is
  the declaration a reader looks for: what this use case needs from
  the outside.
- **`execute` takes one parameter, the ask**: the `<Verb>Command` or
  `<Verb>Query` type of the file, or the domain value the ask already
  is (`JobOrder`, `PlayerId`). It is `async` and declares
  `Promise<Result<T, DomainError>>`. It never throws.
- **`execute` opens by naming the ports it reads**: `const { towns,
  map, news, catalog, clock } = this.dependencies`. The rest of the
  body is the function's body of today, unchanged.
- **The class holds the constructor and `execute`, nothing else.** No
  second method, public or private, no field beside `dependencies`, no
  `static`, no `extends`, no `implements`. A step of the use case
  stays what it is today: a function of the same file that takes what
  it reads as parameters (`answerReview.ts` holds six,
  `startBuildingWork.ts` five), a service, or a pure rule.
- **`execute` is called on its object**, never passed as a reference:
  a detached method loses `this`.

The constructor takes one object and not Codely's list of positional
parameters. Section "Considered options", B, gives the count that
decides it.

### 2. `execute`, not `run`

- It is the word the rules already wrote. `architecture.md:61` named
  the method of a use-case class `execute` before any existed.
- `run` is a word of the game. A lesson and a building work run:
  "it never changes while the work waits or runs" and "a running
  lesson" (`CONTEXT.md`, Duration and Next step), `kind:
  'lessonRunning'` (`town/guidance/NextStep.ts:13`), `isRunning`
  (`learning/curriculum/readableWordsOf.ts:10`).
  `stopSchoolLesson.run(command)` would say `run` of the use case
  that ends a running lesson. `execute` means nothing in the town.
- Neither word is called in production today, so after the migration
  `rg '\.execute\(' apps/api/src` lists the places a domain use case
  is executed and nothing else.

The cost is four letters and one difference from Codely's file.

### 3. The name: the verb phrase, in PascalCase

The class keeps the use case's verb phrase and takes a capital:
`sendJob` becomes `SendJob`, in `useCases/SendJob.ts`, tested by
`SendJob.test.ts`. `typescript-style.md:68` already asks for it:
"PascalCase for files that export a type, class or component".

Codely names by agent noun, `CourseCreator`. It is refused here:

- **The agent noun is the port grammar.** A port is "noun + role"
  (`typescript-style.md`, Naming by layer), and nine ports end in an
  agent noun: `RegionMapReader`, `TownReader`, `TownNewsReader`,
  `CardReader`, `CleanUpReader`, `ChromeProgressReader`,
  `PasswordHasher`, `IdGenerator`, `Mailer`. The agent noun of
  `readRegionMap` is `RegionMapReader`, which is the port that use
  case reads (`town/jobs/ports/RegionMapReader.ts:10`). A reader could
  no longer tell a use case from a port by its name.
- **The verbs do not all have one.** `beginPlacement` gives
  `PlacementBeginner`, `skipHoldoutCheck` `HoldoutCheckSkipper`,
  `showDueReviews` `DueReviewsShower`, `callJobBack` no noun at all.
- **The verb is already the name everywhere else.** The endpoint is
  "use case + `Route`" (`sendJobRoute.ts`), the contract schema
  `SendJobSchema`, and a `useCases/` folder "read as a list, is that
  feature's table of contents" (ADR 052, section 8).

One thing shares the new name. Eight use cases take the name of the
contract type of their request, the schema's noun in
`@mygame/contracts`: `SendJob`, `SendCleanUp`, `CallJobBack`,
`FoundTown`, `StartBuildingWork`, `StopBuildingWork`,
`PlaceHiringOrder`, `StopHiringOrder`. They name the same ask in two
packages, as a feature has one name in three (ADR 052, section 2). No
production file of the api imports one of those eight types, since a
route parses with the schema; a file that ever imported both would
not compile, so the clash cannot pass unseen.

A `UseCase` suffix (`SendJobUseCase`) is refused: it adds seven
letters to 26 names to say what the folder, `new` and `.execute`
already say.

### 4. Built where its ports are, executed there

A use-case object lives for one unit of work. The code that holds the
ports of that unit builds it and executes it in the same statement.
`apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts:53-65`
today:

```ts
        async (stores, clock) => {
          const town = await sendJob(
            { playerId, ...request.data },
            {
              towns: stores.towns,
              map: stores.regionMap,
              news: stores.townNews,
              catalog: dependencies.townCatalog,
              clock,
            },
          )
          return town.ok ? ok(clock.now()) : town
        },
```

and after:

```ts
        async (stores, clock) => {
          const town = await new SendJob({
            towns: stores.towns,
            map: stores.regionMap,
            news: stores.townNews,
            catalog: dependencies.townCatalog,
            clock,
          }).execute({ playerId, ...request.data })
          return town.ok ? ok(clock.now()) : town
        },
```

- **`composeServer.ts` and `composeStores.ts` do not change.** They
  construct adapters, and stay the only files that do
  (`adapter_built_outside_root`). A use case is not an adapter: it is
  domain code given ports.
- **Codely's container builds `CourseCreator` once for the process.**
  That lifetime does not exist here for 29 of the 30 call sites: the
  stores are born with the transaction, the clock with the mutation,
  and three ports with the call (Context). An object built in
  `composeServer.ts` would hold the lock-free `towns` of
  `composeServer.ts:154`, not the row-locked one of its transaction.
- **A function that only executes a use case receives the object.**
  `foundTownOnFreeSite` executes one use case up to three times and
  takes a `FoundTownDependencies` today (`foundTownOnFreeSite.ts:24-27`).
  After, `foundTownRoute.ts` builds `new FoundTown({ … })` inside its
  transaction and `foundTownOnFreeSite` takes the `FoundTown`.
- **`respondRegionMap.ts:26` follows the same rule**, though its ports
  would outlive the request. One rule for 30 call sites is worth one
  object built per map read.

Api use cases, the functions under
`apps/api/src/<feature>/application/` (36 files outside `ports/`
export one on trunk), are outside this ADR and stay functions. Their dependencies do
live as long as the process, so the question for them is a different
one, whether `composeServer.ts` builds them and a route receives them,
and it is answered by its own ADR with its own count or not at all.
Until then the two kinds are told apart by their folder, as they are
today.

### 5. What stays a function

- **A pure rule.** The 94 exported `*Of` functions of the domain, and
  `derive*`, `is*`, `has*`, `refuse*`, `*At`: no port that does I/O,
  nothing to hold, nothing to build. A catalog passed as a parameter
  (`jobPayOf`) stays a parameter.
- **A domain service.** The 11 files under `services/` read ports and
  stay functions that take those ports as parameters
  (`dispatchJob(order, { towns, map, catalog }, now)`,
  `saveChangedTown({ town, events }, towns, news)`). A service is a
  step, not a door: only use cases call it and `index.ts` never
  exports it (`service_is_public`). As a class it would need a second
  place that builds it, the use case's constructor or the caller of
  the use case, and that is the graph a container exists to resolve.
- **A draw.** `bandStartDrawn`, `holdoutCheckSampleDrawn` and
  `placementSamplesDrawn` take a `RandomSource` and stay as they are.
- **Entities and value objects.** The nine classes of the domain
  (`Town`, `TownBuildingWork`, `TownHiring`, `TownJobs`, `TownName`,
  `TownAddress`, `Instant`, `Duration`, `MemoryCard`) and every `type`
  beside them are not touched.
- **Everything in the api.** Routes, responders, presenters and api
  use cases.

So the class marks one thing: the door of the domain, what the
outside builds and asks. A reader who sees `new` followed by a verb
is at a use case.

### 6. Tests

A test builds the use case as the api does, from the in-memory ports
of its feature's `testing/` folder and a fixed clock.
`sendJob.test.ts:70-77` today:

```ts
  const towns = inMemoryTowns([town, neighborTown], inMemoryEarnedSkills([]))
  const sent = await sendJob(command(change), {
    towns,
    map: inMemoryRegionMap([town, neighborTown]),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock(at),
  })
```

and after, in `SendJob.test.ts`:

```ts
  const towns = inMemoryTowns([town, neighborTown], inMemoryEarnedSkills([]))
  const sent = await new SendJob({
    towns,
    map: inMemoryRegionMap([town, neighborTown]),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock(at),
  }).execute(command(change))
```

- A type taken from the function is taken from the method:
  `Awaited<ReturnType<typeof sendJob>>` (`sendJob.test.ts:67`)
  becomes `Awaited<ReturnType<SendJob['execute']>>`, and
  `Parameters<typeof stopBuildingWork>[1]` becomes
  `StopBuildingWorkDependencies`.
- The fakes do not change, nor does where they are read from: a domain
  test imports them from `testing/` by a relative path, and the api's
  contract suites through `@mygame/domain/testing`.
- No test is added or deleted. `testing.md` already asks for the happy
  path and one test per failure branch of every use case; the tests
  that say so today say so after.

The after of sections 1, 4 and 6 was applied to trunk as written and
then discarded: `pnpm --filter @mygame/domain test` on `SendJob.test.ts`
and `quoteJob.test.ts` passed its 20 tests, `pnpm -r typecheck` and
`scripts/mygame-structure-check` exited 0, and Biome's formatter
produced the code shown.

### 7. The caps and the check

- **The 5 exports** hold without a change. The function leaves and the
  class arrives, one for one: `SendJob.ts` exports two names as
  `sendJob.ts` does, and `requestHint.ts`, at the cap with five, stays
  at five.
- **The 7 methods** are never approached. `type_over_method_cap` does
  not count a constructor, so a use-case class counts one.
- **One new check** makes the shape a wall, as ADR 052 does for every
  rule of its tree. `use_case_shape` fails on a production file of a
  `useCases/` folder that exports no class, and on a class there that
  lacks `async execute(` or holds any other member:

```
rg --files-without-match '^export class \w+ \{$' packages/domain/src -g '**/useCases/*.ts' -g '!*.test.ts'
fd -e ts -E '*.test.ts' . packages/domain/src | rg '/useCases/' | xargs awk '
  /^export class / { inside = 1; found = 0; next }
  !inside { next }
  /^}/ { if (!found) print FILENAME ": no execute"; inside = 0; next }
  /^  constructor\(/ { next }
  /^  async execute\(/ { found++; next }
  /^  ([a-z#]+ )*[A-Za-z_#][A-Za-z0-9_]*\??(<[^(]*>)?(: | = (async )?)?\(/ { print FILENAME ": " $0 }'
```

  Run on trunk with `SendJob.ts` written as in section 1, the first
  command lists the 25 other files and the second prints nothing; with
  a private method added and `execute` renamed, the second prints
  both lines and `no execute`.

The existing checks read a folder or a file name, never the word
`function`, and keep working: `use_case_named_of`,
`domain_promise_outside_its_roles`, `use_case_imports_use_case`.
Biome's 50 lines bind `execute` as they bind the function today; the
longest use-case file is `answerReview.ts`, 209 lines of the 250.

### 8. The rule edits

Named here, applied by step 0 of the migration, not by the pull
request that files this ADR.

| File | Today | After |
|---|---|---|
| `.claude/rules/typescript-style.md:29` | "Pure functions in `packages/domain`; a function that reads a port is a use case and is named as one." | "Pure functions in `packages/domain`. A domain use case is a class in `useCases/`: one `dependencies` parameter in its constructor, one method, `execute` (ADR 053). A port-reading step that use cases share is a function in `services/`." |
| `.claude/rules/typescript-style.md:48` | "Domain use case, verb phrase, `startBuildingWork`, `settleSchoolLesson`" | "Domain use case, verb phrase in PascalCase, a class, `StartBuildingWork`, `SettleSchoolLesson`" |
| `.claude/rules/typescript-style.md`, the Test row | `startBuildingWork.test.ts` | `StartBuildingWork.test.ts` |
| `.claude/rules/architecture.md:61` | "Use cases are one exported function or one class with one `execute`. A use case takes its ports as parameters and returns `Result`." | "A domain use case is one class with a constructor and one `execute` (ADR 053). It takes its ports in the constructor and returns `Result`." The sentences on importing another use case and on admission stay. |
| `.claude/rules/architecture.md`, the check list | 17 names | `use_case_shape` added |
| `.claude/rules/principles.md:16` | "A plain function beats a class with one method." | "A plain function beats a class with one method, except a domain use case, which is a class by ADR 053." |
| `ARCHITECTURE.md:52` | "`useCases/` one file per thing a player or the clock can ask: reads ports, returns a Promise of Result" | "`useCases/` one class per thing a player or the clock can ask: its ports in the constructor, `execute` returns a Promise of Result" |
| `ARCHITECTURE.md:89` | "Domain use case, `useCases/`, verb phrase, `sendJob.ts`" | "Domain use case, `useCases/`, verb phrase in PascalCase, a class, `SendJob.ts`" |
| `ARCHITECTURE.md`, The checks | the list of section 7 of ADR 052 | `use_case_shape` added beside `use_case_named_of` |
| `scripts/mygame-structure-check`, its test and its baseline | no check of a use case's shape, an empty baseline | `use_case_shape`, its cases in `scripts/test-mygame-structure-check`, and 26 baseline lines |

This ADR amends two rows of ADR 052 without editing it: the
`useCases/` line of section 3 and the "Domain use case" row of section
5. A path a rule or a doc names (`ARCHITECTURE.md:15` and `:118`,
`docs/agents/peer.md:29`) is edited by the step that moves that file.

## The migration

Nine pull requests. Each of the eight after step 0 takes one
`useCases/` folder and holds two commits, the move apart from the
change:

1. **The move.** `git mv sendJob.ts SendJob.ts` and its test, and the
   path in every importer. The file still exports the function. `git
   mv` records a rename that changes only the case on macOS's
   case-insensitive volume, and `forceConsistentCasingInFileNames`
   (`tsconfig.base.json:16`) refuses an import left in the old case.
2. **The change.** The function becomes the class; every call site,
   every test and the line of `packages/domain/src/index.ts` change in
   the same commit; the folder's lines leave the baseline.

No alias, no re-export, no function left that wraps the class (ADR
040's shim). `packages/domain/src/index.ts` is edited by all eight,
and Biome sorts its lines by path, so a renamed line moves: the eight
merge one at a time, each rebased on the one before.

| Step | Ticket | Use cases | Call sites it rewrites | Also |
|---|---|---|---|---|
| 0 | The rails | none | none | the rule edits of section 8, `use_case_shape`, the 26 baseline lines |
| 1 | `placement` | `AnswerPlacement`, `BeginPlacement`, `ReadPlacement`, `SkipPlacement` | 6, in 4 routes | the smallest surface, no `application/`: it proves the shape |
| 2 | `holdout` | `AnswerHoldoutCheck`, `BeginHoldoutCheck`, `ReadHoldoutChecks`, `SkipHoldoutCheck` | 5: 4 routes, `mutateHoldoutCheck.ts` | |
| 3 | `learning/reviews` | `AnswerReview`, `RequestHint`, `ShowDueReviews` | 3, in `learning/application/` | `answerReviewFixtures.ts` and the three test files of `answerReview` |
| 4 | `town` (root) | `FoundTown`, `ResolveTown` | 3: `foundTownOnFreeSite.ts`, `resolveCurrentTown.ts` twice | `foundTownRoute.ts` builds the object, and so does `foundTownOnFreeSite.test.ts:116`, which hands a `FoundTownDependencies` today; `composeServer.test.ts:251`; the `resolveTown` calls of `stopHiringOrder.test.ts` and `sendCleanUp.test.ts` |
| 5 | `town/building` | `StartBuildingWork`, `StopBuildingWork` | 2 routes | `composeServer.test.ts:297`; `docs/agents/peer.md:29` |
| 6 | `town/hiring` | `PlaceHiringOrder`, `StopHiringOrder` | 2 routes | |
| 7 | `town/jobs` | `CallJobBack`, `QuoteCleanUp`, `QuoteJob`, `ReadRegionMap`, `SendCleanUp`, `SendJob` | 6: 3 routes, `respondRegionMap.ts`, `quoteJobNow.ts`, `quoteCleanUpNow.ts` | `ARCHITECTURE.md:15` and `:118` |
| 8 | `town/school` | `SettleSchoolLesson`, `StartSchoolLesson`, `StopSchoolLesson` | 3: 2 routes, `mutateTown.ts:37` | `holdout/releasedLessonsOf.test.ts`; the baseline is empty again |

The order runs from the fewest callers to the one every town mutation
passes through. Step 4 rewrites one test in each of the folders of
steps 6 and 7, so it merges before them. No step changes a wire shape, a table or a line of
copy: `openapi.json`, the migrations and Android stay as they are.
Each step owes `pnpm --filter @mygame/domain test`, `pnpm --filter
@mygame/api test` and the gate (`verification.md`).

## Considered options

### A. A class, one `dependencies` object, built at the call site (chosen)

The ports are named where they are declared and where they are given;
the body of every use case moves unchanged; nothing is added to the
composition root.

### B. Codely's constructor: one positional parameter per port

```ts
export class SendJob {
  constructor(
    private readonly towns: TownRepository,
    private readonly map: RegionMapReader,
    private readonly news: TownNews,
    private readonly catalog: TownCatalog,
    private readonly clock: Clock,
  ) {}
```

- For: it is the file the owner pointed at, and the ports read in the
  constructor's own lines with no type above it.
- Against: `CourseCreator` takes two collaborators. Here the widest
  takes twelve, and its call would read `new AnswerReview(stores.cards,
  stores.pendingReviews, stores.reviewLog, lessons, lessons,
  stores.bandStarts, clock, memoryTerms, …)`: a reader cannot say
  which port the second `lessons` fills. Today the call says `lessons,
  bands: lessons`, because one adapter serves two ports. The 30 call
  sites and the 30 test files that name each port would stop naming
  them. The 10 use cases that hand their whole set to a service would
  rebuild an object from `this.` fields at each handoff, so the
  migration would rewrite bodies and no longer be a move.

Refused. The owner may reverse it at review: sections 2 to 8 hold
either way, and only the constructor line and the call sites differ.

### C. Built once in the composition root, handed to the route

`composeServer.ts` would build every use case and a route would
receive `sendJob: SendJob`, as Codely's container hands
`CourseCreator` to its handler.

- For: the route no longer knows which store fills which port.
- Against: the ports do not exist when `composeServer.ts` runs
  (section 4). Building the use cases per transaction instead needs a
  second composition function taking `(stores, clock)`, a type listing
  the use cases of each feature, and that function injected into
  `mutateTown`, which alone knows the mutation's instant: three new
  things, to build every use case of a transaction and execute one
  or two. The
  three call sites that make a port for the call could not use it.
  23 use cases have one call site and three have two or three, so
  the wiring it would gather is hardly written twice today.

Refused.

### D. Stores that find their transaction

An ambient transaction (`AsyncLocalStorage`) would let a store built
once join the transaction in progress, and so let option C build use
cases for the process.

- Against: it replaces the explicit `stores` a reader follows from
  `inTransaction` to the adapter with state no signature shows, to
  serve a shape. `principles.md` ranks correctness above the
  architecture rules, and the row lock of `mutateTown` is correctness.

Refused.

### E. Keep the function

- For: `principles.md:16`; 26 files, 30 call sites and 30 test files
  stay as they are; the tests already inject every port.
- Against: the owner's reading (#1803). The hexagon's three parts do
  not look like three parts, and a use case and a service are told
  apart only by their folder.

Refused by #1803. What the class does not buy is said in Consequences.

## What is not adopted from Codely

- **The aggregate that records events.** `Course extends
  AggregateRoot` records a `CourseCreatedDomainEvent` and the use case
  publishes `course.pullDomainEvents()`. Here a transition answers its
  events as a value (`const { town, events } = dispatched.value`) and
  `saveChangedTown` stores them in `TownNews` inside the transaction
  that saved the town. Nothing is pulled and nothing is published.
- **A class for every value.** Codely wraps each primitive
  (`CourseId`, `CourseName`, `CourseDuration`) and maps with
  `fromPrimitives` and `toPrimitives`. The domain keeps a class where
  an invariant needs a constructor (`TownName`, `TownAddress`,
  `Instant`, `Duration`) and a `type` elsewhere (`PlayerId` is a
  `string`). Lazy evaluation (ADR 005) derives state on read with pure
  functions over readonly data, and those functions stay functions.
- **The buses.** Codely's `CoursePutController` dispatches a
  `CreateCourseCommand` on a command bus, which finds
  `CreateCourseCommandHandler`, which calls `CourseCreator`. Here a route calls the use case. `principles.md`
  rejects "event buses without two concrete users", and no event has
  a second user: Town News is written by the change that caused it.
- **The container.** Codely declares its graph in YAML
  (`dependency-injection/Courses/application.yaml`) resolved at run
  time by `node-dependency-injection`. Here `composeServer.ts` and
  `composeStores.ts` are the graph, in TypeScript, checked by the
  compiler and by `adapter_built_outside_root`.
- **The lifetime, the positional constructor, the agent noun, `run`,
  a thrown error and a folder per use case.** Sections 4, 1, 3 and 2;
  `execute` returns a `Result`; a use case is one file.

## Consequences

- The three parts of the hexagon read as three constructs: a port is
  an `interface`, an adapter a `class` that implements it, a domain
  use case a `class` that is given ports. A use case and a service no
  longer look alike.
- A call says what it gives and what it asks in two places: `new
  SendJob({ … })` and `.execute(order)`.
- The class buys no behavior, no test seam and no decoupling the
  function lacked: the ports were already injected and already faked.
  It is a change of form for the reader, at the price of 26 files, 30
  call sites and 30 test files rewritten once.
- A use case allocates one object per execution. It holds one
  reference.
- `principles.md` gains its one exception to "a plain function beats
  a class with one method". The exception is closed by a check:
  nothing else in the domain becomes a class by this ADR.
- Eight class names equal eight contract type names. The compiler
  refuses a file that imports both under one name.
- The use case differs from Codely's in four visible ways (one
  `dependencies` object, `execute`, the verb for a name, built per
  unit of work), each with its reason in this file.
- Api use cases stay functions, so the word "use case" names two
  shapes until their own ADR. The folder tells them apart.
- While the migration runs the tree is mixed, and the baseline says at
  every commit which folders have not moved.

## References

- Issue #1803.
- `CodelyTV/typescript-ddd-example` at `94717b07`:
  `src/Contexts/Mooc/Courses/application/Create/CourseCreator.ts` and
  `CreateCourseCommandHandler.ts`, `Courses/domain/Course.ts`,
  `src/apps/mooc/backend/controllers/CoursePutController.ts`,
  `src/apps/mooc/backend/dependency-injection/Courses/application.yaml`.
- ADR 004: the pure domain and its use cases, kept.
- ADR 005: lazy evaluation, kept.
- ADR 040: the definition of a shim the migration is held to.
- ADR 052: the tree, the file-name grammar, the caps, the checks and
  the baseline; two of its rows amended here.
- `.claude/rules/architecture.md`, `typescript-style.md`,
  `principles.md`, `testing.md`, `verification.md`.
