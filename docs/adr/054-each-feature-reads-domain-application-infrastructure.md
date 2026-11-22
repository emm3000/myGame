---
status: proposed
date: 2026-11-22
---
# Each feature reads domain, application, infrastructure

## Context

ADR 052 put the hexagon in the tree by feature, then by role, and ADR
053 proposed that a domain use case be a class. The owner, reading the
result with no AI, asks for the layout the two repositories he learned
the hexagon from use, recognizable at a glance (#1805): a feature, then
the three words `domain/`, `application/`, `infrastructure/`.

Both were read through `gh api` for this ADR:

- `CodelyTV/typescript-ddd-example` at `94717b07`:
  `src/Contexts/Mooc/Courses/` holds `domain/` (`Course.ts`,
  `CourseName.ts`, `CourseRepository.ts` beside the aggregate it
  stores), `application/` (`Create/CourseCreator.ts`,
  `SearchAll/CoursesFinder.ts`) and `infrastructure/persistence/`
  (`TypeOrmCourseRepository.ts`). The controllers are classes outside
  the context (`src/apps/mooc/backend/controllers/CoursePutController.ts`).
- `AlbertHernandez/hexagonal-architecture-typescript-service-template`
  at `55eef46c`: `src/users/` holds `domain/` (`user.ts`,
  `user-repository.ts`), `application/` (`welcome-message-sender.ts`)
  and `infrastructure/` (`rest-api/user-controller.ts`,
  `user-repository/in-memory-user-repository.ts`, `dependencies.ts`),
  and `src/shared/` holds what no feature owns in the same layers.

Neither tree holds a file whose path names a transaction or a unit of
work: `CourseCreator` saves through one repository and publishes, and
`WelcomeMessageSender` reads one. Section 4 is therefore this
codebase's own design, with no reference to copy.

What trunk holds, counted at `a618fd95`:

- **Role folders, not layer folders.** `packages/domain/src` holds 8
  `useCases/` folders, 5 `services/`, 10 `ports/` and 10 `testing/`.
  The files at a feature's root are its entities, values and pure
  rules, in no folder that says so.
- **"Application" means two things.** The 26 use cases of the domain
  sit in `useCases/`. The api holds 12 `application/` folders with 41
  production files outside `ports/` and 23 files in 6
  `application/ports/` folders. Of the 41, 24 are asynchronous, 7 are
  the `gather*` functions and 10 are types and pure rules.
- **The transaction is opened by the api.** `Transaction<Stores>` is a
  function type in `apps/api/src/platform/application/ports/`,
  implemented by the factory `postgresTransaction`. It is called in 9
  places: 5 account use cases, `serveReport.ts:73`, `mutateTown.ts:28`
  and 2 routes (`foundTownRoute.ts:60`, `readHoldoutChecksRoute.ts:40`).
  `mutateTown` is called in 11: 4 placement routes,
  `serveDueReviewsRoute.ts:39`, `submitReviewAnswer.ts:50`,
  `requestReviewHint.ts:17`, `mutateHoldoutCheck.ts:33`,
  `resolveCurrentTown.ts:46`, `respondGuidanceChange.ts:18` and
  `respondTownChange.ts:18`, which 9 routes of the town call.
- **So a domain use case never sees its own transaction.** It is
  handed the stores of a transaction somebody else opened, and what
  that somebody adds around it (the player's lock, the school lesson
  settled, the town read back for the response) is written in the api.
  `beginPlacementRoute.ts:45-74` runs two domain use cases and reads
  the account inside one closure, in a file under `infrastructure/http/`.
- **A use case object has nothing to live on.** ADR 053, section 4,
  builds `new SendJob({ … })` at each call site because "the stores are
  born with the transaction". No use case can be built once and handed
  to a controller, which is the shape of both references.
- **44 endpoint files, all functions.** Each `*Route.ts` exports its
  OpenAPI declaration and one function `(routes, dependencies) => void`,
  listed by 12 `*Routes.ts` files. No file under an
  `infrastructure/http/` folder exports a class. Both references write
  the endpoint as a controller class (`CoursePutController`,
  `UserController`).
- **The tests rebuild the app.** 72 `createApp(` calls in 46 test and
  test-support files; 42 of them, written on one line, replace an
  adapter of the composed server (`createApp({ ...server, clock })` 16
  times, `{ ...server, clock, mailer }` 11). Four test doubles wrap
  the transaction itself
  (`pausingFirstTransaction` in `townRoutes.testSupport.ts` and
  `learningRoutes.testSupport.ts`, one in `holdoutCheckRoutes.test.ts`,
  `heldTransaction` in `requestPasswordResetRoute.test.ts`).

What is not reopened: the packages and their arrows (ADR 001), the
pure domain package (ADR 004), lazy evaluation (ADR 005), Drizzle (ADR
006), `Result` and the sealed `DomainError`, the injected `Clock`, the
features and sub-areas of ADR 052 (section 2), the api's feature
graph, the limits and caps of ADR 052 (sections 6 and 9), the contracts
package, and the class shape of ADR 053 (sections 1 and 2): one
`dependencies` object in the constructor, one `execute`.

### How the numbers were taken

Every count is a command run on trunk at `a618fd95`; the pull request
that files this ADR lists each with its output. A production file is
ADR 052's: a `.ts` file that is not `*.test.ts`, not
`*.testSupport.ts` and not under a `testing/` folder. Every "today"
block is trunk code, cited by path and line. Every "after" block is
the code of a prototype applied to trunk and then discarded; section
11 says what it covered and what it printed.

## Decision

### 1. Feature first, then the three layers, each in one place

| Layer | Folder | Where it lives | What it holds |
|---|---|---|---|
| Domain | `<feature>/domain/` | `packages/domain/src` | entities, value objects, types, pure rules, and the port interfaces, each beside what it stores or reads |
| Application | `<feature>/application/` | `packages/domain/src` | the use cases, one class per file, and the steps they share |
| Infrastructure | `<feature>/infrastructure/` | `apps/api/src` | `http/`, `persistence/`, `json/`, `catalog/`, `smtp/`, `system/`, `vercel/` |

A layer has one home. `packages/domain` holds the domain and the
application of every feature and stays pure: no `node:` import, no
framework, no package of the workspace (the leak check of
`architecture.md`, unchanged). `apps/api/src` holds the infrastructure
of every feature and the composition root, and nothing else: no folder
there is named `application` or `domain`.

So one sentence replaces the two questions of ADR 052, section 4: a
thing that decides or coordinates is in `packages/domain`, under
`domain/` when it is pure and under `application/` when it reads a
port; a thing that talks to HTTP, Postgres, a file or a mail server is
in `apps/api`, under `infrastructure/`.

The package keeps its name. `@mygame/domain` now names the hexagon's
inside, both layers, and is imported in every file of the api and the
web; renaming it is not a move of this ADR.

A sub-area follows the same grammar as its feature, as in ADR 052:
`packages/domain/src/town/jobs/domain/JobOrder.ts`,
`packages/domain/src/town/jobs/application/SendJob.ts`,
`apps/api/src/town/jobs/infrastructure/http/SendJobController.ts`.

### 2. The folder grammar

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

- **No `ports/` folder.** A port is a file of `domain/`, named "noun +
  role" as today (`TownRepository.ts`, `RegionMapReader.ts`), next to
  the type it stores, as `CourseRepository.ts` sits next to
  `Course.ts`. All 21 files of the domain's `ports/` folders export an
  `interface` today. The 23 files of the api's `application/ports/`
  join them in their feature's `domain/`: 15 interfaces and 8 types
  (the store lists `TownStores`, `AccountStores` and `LearnerStores`,
  `ReadOnlyTowns`, `CardReader`, `LessonLibrary`, `StoredScaffold`,
  and `Transaction`, which section 4 replaces).
- **No `useCases/` and no `services/` folder.** Both are
  `application/`. The case of the file name tells the two apart, as it
  already tells an entity from a pure rule at a feature's root: a
  PascalCase file is a use case, a camelCase file is a step. Section 3
  defines each.
- **`testing/` stays**, beside the two layers, and stays the one home
  of a fake. It gains the 7 `Memory*` adapters of the api's
  `infrastructure/memory/` folders (`MemoryAccountTokens`,
  `MemoryChromeProgressReader`, `MemoryMailer`, `MemoryReportClosings`,
  `MemoryGuidanceDismissals`, `MemorySeenTips`,
  `MemoryTownNewsReader`): their ports move to the domain package, and
  a fake lives with its port. `@mygame/domain/testing` stays the entry
  the api's tests read them through.
- **The kernel.** The top-level `ports/` folder becomes
  `platform/domain/`: `Clock`, `IdGenerator`, `RandomSource`, and the
  ports the api's `platform/application/ports/` held, `UnitOfWork`
  (section 4), `FailureSink`, `AfterResponse` and `AfterResponseDrain`,
  with `Refusal` and `thrownCauseOf`. Their adapters already live in
  the api's `platform/infrastructure/`, so the port and its adapter
  carry one feature name (ADR 052, section 3). `ports/testing/` becomes
  `platform/testing/`. `player/`, `time/`, `hash/` and `grid/` stay as
  they are: values with no port and no use case, one layer by nature.
  `DomainError.ts`, `Result.ts`, `index.ts` and `testing.ts` stay at
  the root.

`apps/api/src/`:

```
index.ts  listen.ts  app.ts  composeServer.ts  composeStores.ts  composeUseCases.ts    the composition root
<feature>/infrastructure/
  http/           one controller per endpoint, the route list, responders, presenters, the views they gather
  persistence/    Drizzle adapters, the feature's tables, row mappers, each port's contract suite
  json/           the JSON catalogs (content)
  catalog/        the copy of a mail (account)
  smtp/           the mailer (account)
  system/         the password hasher and the session tokens (account), the clock and ids (platform)
  vercel/         the deferred work (platform)
content/gate/     the content gate, as in ADR 052
```

- **`postgres/` becomes `persistence/`, and `memory/` dissolves.** A
  `memory/` folder holds two things today: the 7 `Memory*` adapters,
  which go to the domain package's `testing/`, and the contract suites
  with the tests that run them, which go beside the adapter they
  prove. The town's `persistence/` is the largest: 29 production files
  today, under the 30 of `folder_over_limit`; a contract suite is a
  `*.testSupport.ts` file and does not count.
- **`infrastructure/` stays in the path** though it is the only layer
  folder left in the api. The owner asked for the three words in the
  tree; a reader who opens a feature in the api sees which of the
  three he is in.

Every folder of the target was counted against the 30 files of
`folder_over_limit`. Two are near it: `town/jobs/domain/` holds 30 (27
root files and 3 ports), and `town/domain/` 29 (20, 4 ports and
`TownStores`, `TownReader`, `TownNewsReader`, `ReadOnlyTowns`,
`TownReading`). `GuidanceDismissals` and `SeenTips` go to
`town/guidance/domain/`, whose words they name. The ticket that moves
either folder may cut a sub-area and says why.

### 3. A use case is the class an adapter asks; a step is a function

ADR 053 kept: the class, its one `dependencies` parameter, `execute`,
the verb phrase in PascalCase, `Result`, no second method.

What changes is which functions are use cases. Today the thing a route
asks is split in two: a closure or an api function that opens the
transaction, and inside it one or more domain functions. With the
transaction opened in the application (section 4), the two become one:

- **A use case is what an adapter asks.** One class per thing an
  endpoint or the clock asks, in `<feature>/application/`. Its
  `dependencies` hold only what lives as long as the app: the unit of
  work, a lock-free reader, a catalog, the clock, the id and random
  sources. `execute` opens the unit of work it needs and reads its
  stores from it.
- **A step is what a use case calls.** A function in `application/`
  that takes the ports it reads as parameters, as the 11 `services/`
  do today (`dispatchJob(order, { towns, map, catalog }, now)`). A
  step that opens a unit of work says so by taking `unitOfWork` in its
  dependencies (`mutateTown`); every other step runs inside the unit
  its caller opened. A step is never exported from `index.ts`, and a
  use case never imports another use case.
- **A function earns its own step file** when two use cases call it,
  or when folding it into `execute` would pass a limit of ADR 052
  (250 lines a file, 50 a function). Otherwise its body is `execute`.
- **The class takes the name its endpoint carries.** The endpoint file
  is "use case + `Route`" today (ADR 052, section 5) and "use case +
  `Controller`" after (section 6): `sendJobRoute.ts` asks `SendJob`
  and becomes `SendJobController.ts`, `submitReviewAnswerRoute.ts`
  asks `SubmitReviewAnswer`, `quoteJobRoute.ts` asks `QuoteJob`. A
  step that would share its use case's name is renamed by its ticket:
  a volume that ignores case cannot hold `ReadPlacement.ts` beside
  `readPlacement.ts`.

The 26 domain use cases and the 24 asynchronous functions of the api's
`application/` become 36 classes and their steps:

| Feature | Classes | Steps that stay functions |
|---|---|---|
| `account` | `SignUp`, `SignIn`, `VerifyEmail`, `ResendVerificationMail`, `RequestPasswordReset`, `ResetPassword`, `ReadChromePhase` | `issueAccountToken`, `openSession`, `sendVerificationMail`, `readScaffold` |
| `town` | `FoundTown`, `ResolveCurrentTown` | `mutateTown`, `changeTown`, `readTownReading`, `resolveTown`, the current-town resolve `ResolveTownNews` and `ServeReport` share, and the 3 `services/` |
| `town/jobs` | `SendJob`, `SendCleanUp`, `CallJobBack`, `QuoteJob`, `QuoteCleanUp`, `ReadRegionMap` | the 4 `services/` |
| `town/building` | `StartBuildingWork`, `StopBuildingWork` | |
| `town/hiring` | `PlaceHiringOrder`, `StopHiringOrder` | |
| `town/school` | `StartSchoolLesson`, `StopSchoolLesson` | `settleSchoolLesson`, and the 2 `services/` |
| `town/guidance` | `DismissGuidance`, `MarkTipSeen` | |
| `town/news` | `ResolveTownNews` | |
| `learning/reviews` | `SubmitReviewAnswer`, `RequestReviewHint`, `ServeDueReviews` | `answerReview`, `readLearner`, the due-reviews reading `ServeReport` shares |
| `placement` | `AnswerPlacement`, `BeginPlacement`, `ReadPlacement`, `SkipPlacement` | `admitPlacementOffer`, the offer reading the four share |
| `holdout` | `AnswerHoldoutCheck`, `BeginHoldoutCheck`, `ReadHoldoutChecks`, `SkipHoldoutCheck` | `mutateHoldoutCheck`, `resolveDueBandStart`, the checks reading the four share |
| `report` | `ServeReport` | |

- 21 of the 26 domain use cases give their name to a class: the 17 a
  route calls inside a closure today, `readRegionMap`, and `foundTown`,
  `quoteJob` and `quoteCleanUp`, which absorb the api function that
  wraps each (`foundTownOnFreeSite`, `quoteJobNow`, `quoteCleanUpNow`).
- 5 become steps of a class that carries the api's name: `answerReview`
  (209 lines, with three test files) under `SubmitReviewAnswer`,
  `requestHint` under `RequestReviewHint`, `showDueReviews` under
  `ServeDueReviews`, `resolveTown` under `ResolveCurrentTown`, and
  `settleSchoolLesson`, which only `mutateTown.ts:37` calls.
- 13 classes come from the api's functions, and 2 from closures two
  routes write inline (`dismissGuidanceRoute.ts`, `markTipSeenRoute.ts`).

The table is this ADR's proposal. A ticket may fold a step or keep one
under the rule above, and says why.

### 4. The unit of work is a port, and the use case opens it

Today, `apps/api/src/platform/application/ports/Transaction.ts:3-5`:

```ts
export type Transaction<Stores> = <T, E>(
  work: (stores: Stores) => Promise<Result<T, E>>,
) => Promise<Result<T, E>>
```

After, `packages/domain/src/platform/domain/UnitOfWork.ts`:

```ts
export interface UnitOfWork<Stores> {
  transact<T, E>(work: (stores: Stores) => Promise<Result<T, E>>): Promise<Result<T, E>>
}
```

The port's contract is what `postgresTransaction.ts:12-29` does today,
now said of the port:

- `work` receives stores that live for this unit and no longer: every
  read and write it makes through them is one transaction.
- When `work` answers a refusal, nothing it wrote is kept, and
  `transact` answers that refusal.
- When `work` throws, nothing it wrote is kept, and the throw passes.

**How the use case gets per-transaction repositories.** The adapter
builds them, once per unit, from that unit's session, with the
function the composition root hands it. `composeStores.ts:24-42` does
not change:

```ts
export const composeStores = (transaction: PostgresSession): ComposedStores => ({
  accounts: new DrizzleAccounts(transaction),
  …
  towns: new DrizzleTownRepository(transaction, 'lockedForUpdate'),
  townsWithSchool: new DrizzleTownReader(transaction),
  …
})
```

The factory `postgresTransaction` becomes the adapter class, its body
unchanged, in `platform/infrastructure/persistence/DrizzleUnitOfWork.ts`:

```ts
export class DrizzleUnitOfWork<Stores> implements UnitOfWork<Stores> {
  constructor(
    private readonly database: NodePgDatabase,
    private readonly composeStores: (transaction: PostgresSession) => Stores,
  ) {}

  async transact<T, E>(work: (stores: Stores) => Promise<Result<T, E>>): Promise<Result<T, E>> {
    let refused: Result<T, E> | undefined
    try {
      return await this.database.transaction(async (transaction) => {
        const outcome = await work(this.composeStores(transaction))
        if (!outcome.ok) {
          refused = outcome
          transaction.rollback()
        }
        return outcome
      })
    } catch (failure) {
      if (failure instanceof TransactionRollbackError && refused !== undefined) {
        return refused
      }
      throw failure
    }
  }
}
```

and `composeServer.ts:153` reads `unitOfWork: new
DrizzleUnitOfWork(database, composeStores)`. The port is now an
`interface` and its adapter a `class`, as every other port.

**The stores a feature's work reads** are a type of its `domain/`,
moved from the api as it is: `TownStores` (15 stores,
`town/application/ports/TownStores.ts:20-36`), `AccountStores` (3),
`LearnerStores` (3). `composeStores.ts` still answers
`AccountStores & TownStores`, and a `UnitOfWork` of that is a
`UnitOfWork<TownStores>` to the use case that asks for one.

**The town's mutation moves whole.** `mutateTown` is the rule every
change of a player's world passes through: lock the player, read the
town, fix one instant, settle the school lesson, then change. Today,
`apps/api/src/town/application/mutateTown.ts:23-51`:

```ts
export const mutateTown = <T>(
  playerId: PlayerId,
  mutation: TownMutation<T>,
  { inTransaction, clock, lessons }: MutateTownDependencies,
): Promise<Result<T, DomainError>> =>
  inTransaction(async (stores) => {
    await stores.accounts.lockPlayer(playerId)
    const locked = await stores.towns.townOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const mutatedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const mutationClock: Clock = { now: () => mutatedAt }
    const settled = await settleSchoolLesson(playerId, {
      towns: stores.towns,
      lessonSlots: stores.lessonSlots,
      cards: stores.cards,
      bandStarts: stores.bandStarts,
      lessons,
      bands: lessons,
      news: stores.townNews,
      clock: mutationClock,
    })
    if (!settled.ok) {
      return settled
    }
    return mutation(stores, mutationClock)
  })
```

After, in `packages/domain/src/town/application/mutateTown.ts`, two
lines differ: `{ unitOfWork, clock, lessons }` and
`unitOfWork.transact(async (stores) => {`. The body, the lock order
and the fixed instant are the ones trunk runs. `settleSchoolLesson` is
a step beside it.

One step is written for the nine use cases that change the town and
answer it. It is the first half of `respondTownChange.ts:12-26`, moved
out of the adapter:

```ts
export type TownChange = (stores: TownStores, clock: Clock) => Promise<Result<Instant, DomainError>>

export const changeTown = (
  playerId: PlayerId,
  change: TownChange,
  dependencies: MutateTownDependencies,
): Promise<Result<TownReading, DomainError>> =>
  mutateTown(
    playerId,
    async (stores, clock) => {
      const readAt = await change(stores, clock)
      return readAt.ok ? readTownReading(playerId, readAt.value, stores.townsWithSchool) : readAt
    },
    dependencies,
  )
```

**The use case.** Today,
`packages/domain/src/town/jobs/useCases/sendJob.ts:13-35`, handed the
stores of a transaction it does not see:

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

After, `packages/domain/src/town/jobs/application/SendJob.ts`:

```ts
export type SendJobDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
}

export class SendJob {
  constructor(private readonly dependencies: SendJobDependencies) {}

  async execute(order: JobOrder): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      order.playerId,
      async ({ towns, regionMap, townNews }, clock) => {
        const dispatched = await dispatchJob(
          order,
          { towns, map: regionMap, catalog: townCatalog },
          clock.now(),
        )
        if (!dispatched.ok) {
          return dispatched
        }
        const saved = await saveChangedTown(dispatched.value, towns, townNews)
        return saved.ok ? ok(clock.now()) : saved
      },
      this.dependencies,
    )
  }
}
```

- The dependencies are three ports that outlive the request and one
  catalog: `unitOfWork`, `clock`, `lessons` (what `mutateTown` settles
  the lesson with) and `townCatalog`.
- The repositories are the callback's parameter: `towns`, `regionMap`
  and `townNews` exist from `transact` to the commit.
- A use case that changes the town answers a `TownReading`, the town
  as the change left it, read inside the change's transaction at the
  instant the change answers. That is what every one of the nine
  routes answers today, through `respondTownChange`.
- A dependency key is the composition root's key (`townCatalog`,
  `regionMap`, `townNews`), not a name of the use case's own
  (`catalog`, `map`, `news`). Section 5 is why.

**The other shapes** follow the same rule and are not prototyped:

- A use case that mutates without answering the town calls
  `mutateTown` (`AnswerPlacement`, `SubmitReviewAnswer`,
  `DismissGuidance`).
- A use case of the account calls `unitOfWork.transact` on
  `AccountStores`, as `signUp.ts:29` calls `inTransaction` today, and
  answers a `Refusal`. `transact` stays generic in the error for it.
- A use case that reads without a lock holds a lock-free reader in its
  dependencies (`composeServer.ts:154`, `towns: new
  DrizzleTownRepository(database, 'lockFree')`): `QuoteJob` is
  `quoteJobNow.ts:21-37` and `quoteJob` in one `execute`, and
  `ResolveCurrentTown` is `resolveCurrentTown.ts:60-88`, which opens
  the unit only when the dry run finds something due.

`UnitOfWork`, not `TransactionManager`: `naming.md` rejects `Manager`
classes. The method is `transact`, not `run`, a word of the game (ADR
053, section 2), and not `execute`, which names a use case.

### 5. Built once per app, in `composeUseCases.ts`

This supersedes ADR 053, section 4, "Built where its ports are". Its
reason is gone: a use case no longer holds a store, so nothing it holds
is born with a transaction.

A new file of the composition root builds every use case from the
adapters:

```ts
export type UseCaseDependencies = SendJobDependencies

export type UseCases = {
  readonly sendJob: SendJob
}

export const composeUseCases = (adapters: UseCaseDependencies): UseCases => ({
  sendJob: new SendJob(adapters),
})
```

and `createApp` calls it, `app.ts`:

```ts
export type AppDependencies = Omit<RouteDependencies, keyof UseCases> & UseCaseDependencies

export const createApp = (adapters: AppDependencies): OpenAPIHono => {
  const dependencies: RouteDependencies = { ...adapters, ...composeUseCases(adapters) }
```

- **Inside `createApp`, not inside `composeServer`.** The first
  prototype built `SendJob` in `composeServer.ts` and `tsc` refused
  every test that rebuilds the app: a test that calls `createApp({
  ...server, clock })` handed no use case, and one built beforehand
  would have held the old clock. 42 calls replace an adapter that
  way. Built by `createApp`, the use cases take the clock,
  the mailer or the unit of work the test handed over, and none of the
  72 calls changes.
- **One line per use case.** `new SendJob(adapters)` hands the whole
  set, as `createApp(dependencies)` hands it to every route today, and
  `SendJobDependencies` says which of it the use case reads. That is
  why a dependency key is the composition root's. `composeUseCases.ts`
  is split by feature when it would pass 50 lines a function.
- **`composeServer.ts` and `composeStores.ts` keep constructing the
  adapters**, and stay the only files that do. `composeUseCases.ts` is
  the only file that writes `new` before a use case.

### 6. The endpoint is a controller class, and receives its use case

Today, `apps/api/src/town/jobs/infrastructure/http/sendJobRoute.ts:36-70`:

```ts
export type SendJobRouteDependencies = RequirePlayerDependencies & RespondTownChangeDependencies

export const sendJobRoute = (routes: OpenAPIHono, dependencies: SendJobRouteDependencies): void => {
  routes.openAPIRegistry.registerPath(sendJobDeclaration)
  routes.on(
    sendJobDeclaration.method,
    honoPathOf(sendJobDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = SendJobSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return respondTownChange(
        c,
        playerId,
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
        dependencies,
      )
    },
  )
}
```

After, in `SendJobController.ts` of the same folder, under the same
OpenAPI declaration:

```ts
export type SendJobControllerDependencies = RespondTownReadingDependencies & {
  readonly sendJob: SendJob
}

export class SendJobController {
  constructor(private readonly dependencies: SendJobControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = SendJobSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.sendJob.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
```

and the route list builds it and registers it. Today, `jobsRoutes.ts:14-20`:

```ts
export const jobsRoutes = (routes: OpenAPIHono, dependencies: JobsRouteDependencies): void => {
  sendJobRoute(routes, dependencies)
  quoteJobRoute(routes, dependencies)
  sendCleanUpRoute(routes, dependencies)
  quoteCleanUpRoute(routes, dependencies)
  callJobBackRoute(routes, dependencies)
}
```

After, with the one endpoint the prototype converted:

```ts
export const jobsRoutes = (routes: OpenAPIHono, dependencies: JobsRouteDependencies): void => {
  const signedIn = requirePlayer(dependencies)
  const sendJobController = new SendJobController(dependencies)
  routes.openAPIRegistry.registerPath(sendJobDeclaration)
  routes.on(sendJobDeclaration.method, honoPathOf(sendJobDeclaration), signedIn, (c) =>
    sendJobController.handle(c),
  )
  quoteJobRoute(routes, dependencies)
  sendCleanUpRoute(routes, dependencies)
  quoteCleanUpRoute(routes, dependencies)
  callJobBackRoute(routes, dependencies)
}
```

The controller parses, asks one use case and responds: the three
things `architecture.md` asks of a route. It names no store.

The endpoint is a class by the owner's decision on #1806: a reader who
knows the hexagon recognizes a controller at a glance, as he does in
both references. The first draft of this ADR kept the function; option
G holds it and the reasons it gave.

- **The name is "use case + `Controller`"**, the file named for the
  class: `SendJobController.ts`. Codely names the resource and the
  HTTP verb (`CoursePutController`). Here the endpoint already carries
  its use case's name, so one word changes, `Route` to `Controller`,
  and the controller of `SendJob` is found by name. `naming.md`
  rejects `Helper`, `Util` and `Manager` classes; `Controller` names a
  role of the hexagon, as `Repository` does. `Routes` stays the word
  of the list (`jobsRoutes.ts`).
- **One `dependencies` object in the constructor**, as the use case
  (ADR 053, section 1): the use case it asks and what its responder
  reads. `SendJobControllerDependencies` no longer holds
  `RequirePlayerDependencies`: the guard is the list's.
- **One public method, `handle(c)`**, which takes Hono's `Context` and
  answers a `Response`. Not `run`, Codely's word, which ADR 053
  (section 2) refused as a word of the game, and not `execute`, which
  names a use case. `Context<SignedInPlayer>` says in the signature
  that the controller reads `c.var.playerId`, which `requirePlayer`
  sets.
- **The file keeps its OpenAPI declaration.** "One endpoint, one file"
  (ADR 052, section 5) stands: the declaration and the controller
  that answers it.
- **The route list builds the controller and mounts it.**
  `<area>Routes.ts` is called by `createApp`, so a controller holds
  the use cases and the adapters of that app, and none of the 72
  `createApp(` calls changes. It is mounted with an arrow, `(c) =>
  sendJobController.handle(c)`, as Codely's `courses.route.ts` mounts
  `coursePutController.run(req, res)`: a method handed over bare loses
  its `this`, which is why AlbertHernandez's router writes
  `.bind(userController)`. No file but a route list writes `new`
  before a controller.
- **The session guard stays a middleware**, a function. `requirePlayer`
  is built once in the list and passed to `routes.on`; today each of
  36 endpoint files builds its own.
- **An endpoint that asks no use case of its own is a controller
  too.** `signInRoute.ts` and `nativeSignInRoute.ts` ask the same
  one, and `healthRoute.ts` asks none: 44 controllers, 36 use cases.
  Where `architecture.md` lets a route call a repository, the
  controller takes that port in `dependencies`.
- **No `Controller` interface.** Codely's `Controller.ts` declares
  `run` for its container to resolve; here nothing takes a controller
  it does not name.

A route list grows by five lines an endpoint. `accountRoutes.ts`
lists 11, which passes the 50 lines of a function: its ticket splits
the list or writes the two statements once in
`platform/infrastructure/http/`. Neither was prototyped.

`respondTownChange.ts` is deleted when the last of the nine endpoints
stops calling it: its first half is `changeTown`, its second is
`respondTownReading`, which does not change.

### 7. `gather*View` moves to the HTTP adapter

The seven `gather*` functions of the api's `application/` (838 lines:
`gatherTownView`, `gatherBuildingsView`, `gatherWorkView`,
`gatherGuidanceView`, `gatherSchoolView`, `gatherLessonWordsView`,
`gatherReviewVerdict`) move to the `infrastructure/http/` folder of
their feature or sub-area, beside the presenter that reads their view.
They do not become query use cases. The evidence:

- **None reads a port that waits.** All seven are synchronous
  (`rg -l "Promise<|\basync\b"` lists none of them). Each takes a
  reading already made and catalogs already in memory, and calls pure
  rules of the domain (`accrueTown`, `deriveResourceRates`,
  `deriveStorageCapacity`). A use case exists to open a unit of work
  and coordinate ports; these have neither.
- **The adapter is their only reader.** `gatherTownView` is called
  once, by `respondTownReading.ts:24`, and the other five town
  gatherers only beneath it. Six presenter files import the view types
  (`presentTownOverview.ts:5`, `presentTownWork.ts:4`,
  `presentTownBuildings.ts:6`, `presentTownSchool.ts:5-6`,
  `presentTownGuidance.ts:4`, `presentReviewVerdict.ts:3`).
  `gatherReviewVerdict` is called once, by `submitReviewAnswer.ts:111`,
  after its transaction has closed.
- **They change when the screen changes.** A view is "what one
  response needs" (ADR 052, section 4): `TownView` is the town
  overview's fields, `ReviewVerdictView` the verdict's. That is the
  presenter's reason to change.
- **As query use cases they would cost every command.** The nine use
  cases that change the town answer the overview. Each would take the
  view's dependencies (`lessons`, `memoryTerms`) and answer a view, and
  each of its tests would build a lesson library to send a job.

So the application answers readings (`TownReading`, and the
`ReviewOutcome` that `recordReviewAnswer` builds at
`submitReviewAnswer.ts:91-98`), and `respondTownReading` keeps its two
lines, gather then present. The query use case of the town is
`ResolveCurrentTown`, and it answers the same `TownReading`.

The files keep their names, and `gatherSchoolView.test.ts` moves with
its subject. Merging a gatherer into its presenter is a later
question.

### 8. What each file of the api's `application/` becomes

| Today | Files | After |
|---|---|---|
| Asynchronous function an endpoint asks | 16 | 13 become a use-case class and 3 fold into one (section 3) |
| Asynchronous function only the application calls, or a route calls inside a closure | 8: `mutateTown`, `readTownReading`, `mutateHoldoutCheck`, `readScaffold`, `readLearner`, `issueAccountToken`, `openSession`, `sendVerificationMail` | a step |
| `gather*` | 7 | `infrastructure/http/` (section 7) |
| Type or pure rule | 8: `TownReading`, `MailRecipient`, `SignedIn`, `Refusal`, `accountTokenExpiryFrom`, `sessionExpiryFrom`, `isRedeemableAgain`, and `LearningDependencies`, which dissolves into the dependencies of the classes that read it | `<feature>/domain/` |
| `tokenDigest` | 1 | `account/infrastructure/persistence/`: its 7 call sites are in `DrizzleAccountTokens`, `DrizzleSessions` and `MemoryAccountTokens`, and no use case calls it |
| `pickFixedCopy` | 1 | `account/infrastructure/catalog/`, behind a port (below) |
| Port or store list in `application/ports/` | 23 | `<feature>/domain/` |

**The account is a feature like the others.** Its ports, its seven use
cases and their steps move to `packages/domain/src/account/`. This
amends the sentence of `architecture.md` "the account's use cases are
api use cases"; the session check `requirePlayer` stays a middleware
of `account/infrastructure/http/`. Three import lines stand between
the account and a pure package, and each ends in the account's ticket:

- `tokenDigest.ts:1` imports `node:crypto`. It is infrastructure
  already, read only by adapters, and goes to `persistence/`.
  `MemoryAccountTokens` calls it twice (`:37`, `:46`) and cannot once
  it is a fake of the domain package: it keys by the token itself, a
  change its contract suite proves, made in the api before the move.
- `pickFixedCopy.ts:1` imports `@mygame/catalog`, and two use cases
  call it to write a mail's subject and text
  (`sendVerificationMail.ts:15`, `requestPasswordReset.ts:52`). The
  domain package imports nothing, so the copy comes through a port:
  `MailCopy` in `account/domain/` answers the subject and the text of
  the verification mail and of the reset mail, for a scaffold and a
  link, and `CatalogMailCopy` in `account/infrastructure/catalog/` is
  `pickFixedCopy` behind it. It lands in the api before the move.
  `Mailer` does not change: it takes `{ to, subject, text }`,
  `MemoryMailer` records it, and no test changes. 9 test files read a
  sent mail (`tokenOf` parses the link out of `mail.text`,
  `accountRoutes.testSupport.ts:136`; the reset mails are picked by
  `mail.subject`, `:206`), and the mailer's contract suite has the
  case "delivers the subject and the text as given". The first draft
  moved the copy into `SmtpMailer` and made `Mailer` take the mail's
  meaning: that rewrote those lines and that case, against the
  migration's third proof. `MailCopy` was not prototyped.
- `requestPasswordReset.ts:5` imports `thrownCauseOf`, a pure function
  that moves to `platform/domain/` with the kernel.

`RequestPasswordReset` answers nothing and defers its work through
`AfterResponse`, as today; its `execute` is the one that declares
`Promise<void>`.

### 9. What stays a function, and the entities

- A pure rule, a draw and a step: sections 2 and 3, and ADR 053,
  section 5, whose "domain service" is this ADR's step.
- A route list, a middleware, a responder, a presenter, a gatherer, a
  row mapper. The use case and the controller are the two classes
  with one method.
- A fake: `inMemory*` stays a factory function.
- **Entities stay as they are.** The classes of the domain (`Town`,
  `TownName`, `Instant`, `Duration`, `MemoryCard` and the others) and
  every `type` with the functions around it are not touched. Whether
  an entity that is a `type` today should be a class is a separate
  question, for its own ADR, with its own count.

### 10. Tests

A test of a use case builds the class as `composeUseCases.ts` does,
over the fakes of `testing/`. Today, `sendJob.test.ts:70-77`:

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

After, in `SendJob.test.ts`:

```ts
  const towns = inMemoryTowns([town, neighborTown], inMemoryEarnedSkills([]))
  const sent = await new SendJob({
    unitOfWork: inMemoryUnitOfWork(
      inMemoryTownStores({ towns, regionMap: inMemoryRegionMap([town, neighborTown]) }),
    ),
    townCatalog: catalog,
    lessons: noLessons,
    clock: frozenClock(at),
  }).execute(command(change))
```

- **Three new fakes.** `inMemoryUnitOfWork(stores)` in
  `platform/testing/`, whose `transact` calls the work on the stores
  it was given. `inMemoryTownStores(held)` in `town/testing/`, the 15
  stores with an empty fake for each one the test does not hold. And
  `inMemoryTownReader`, which `TownReader` lacks today: it lands with
  a contract suite run against `DrizzleTownReader`.
- **The fake unit of work does not roll back.** A refused work leaves
  what it wrote in the fakes, as a refused function does today. That a
  refusal keeps nothing is proved where it is true, on Postgres
  (`postgresTransaction.test.ts` and the route tests).
- **The test now passes through `mutateTown`**: the lock, the fixed
  instant, the lesson settled. The 16 cases of `sendJob.test.ts` pass
  unchanged in what they assert.
- **A fact asserted does not change; the path to it may.** `SendJob`
  answers a `TownReading`, so `sent.value.jobSlot` becomes
  `sent.value.town.jobSlot` (`sendJob.test.ts:85-86`). The pull
  request lists each such line.
- **A step's test does not change at all.** `answerReview` stays a
  function, and its three test files call it with the fakes as today.
- The api's route tests do not change: they compose the real server
  and ask over HTTP. The 18 named for one endpoint
  (`signUpRoute.test.ts`) are renamed with their subject
  (`SignUpController.test.ts`); the 9 named for a list
  (`jobsRoutes.test.ts`) keep their name.

### 11. The prototype

Applied to trunk at `a618fd95` and discarded; nothing of it is in the
pull request. It covered:

- the port and its adapter (section 4), with all 9 `inTransaction(`
  calls and the 53 mentions of the word in 23 files rewritten, and the
  four test doubles turned into objects;
- `Accounts`, `StoredScaffold`, `TownStores`, `TownReader`,
  `TownNewsReader`, `GuidanceDismissals`, `SeenTips`, `TownReading`,
  `readTownReading` and `mutateTown` moved from the api to the domain
  package; one script rewrote the 71 api files that named the
  transaction or one of those ten;
- `changeTown`, `SendJob`, its test and `quoteJob.test.ts`, the three
  fakes, `composeUseCases.ts` and `app.ts` as shown, and
  `sendJobRoute.ts` asking `dependencies.sendJob`, still a function.

It did not rename the folders of files it left alone (`useCases/`,
`ports/`, `postgres/`), and `inMemoryTownReader` answered empty cards.
What it printed:

| Command | Result |
|---|---|
| `pnpm -r typecheck` | exit 0, five packages |
| `pnpm --filter @mygame/domain test` | 94 files, 654 tests passed |
| `pnpm --filter @mygame/api test`, on its own Postgres 18.6 and Mailpit | 130 files, 1266 tests passed, `openApi.test.ts` among them: `openapi.json` did not change |
| `pnpm biome check .` | 60 `organizeImports`, 1 format and 1 unused import, all from the scripted rewrite; no import cycle, no `feature_graph` hit |
| `scripts/mygame-structure-check` | 9 lines of `domain_promise_outside_its_roles`, the files in the new `domain/` and `application/` folders; section 12 rewrites that check |

Before the prototype, on trunk: `jobsRoutes.test.ts` 36 passed and
the domain's `town/jobs/useCases` 71 passed. After: the same 71, and
`jobsRoutes.test.ts` among the 130 files that passed.

The controller of section 6 was a second prototype, on the first one
applied again and discarded the same way: `sendJobRoute.ts` became
`SendJobController.ts`, and `jobsRoutes.ts` built it and mounted it,
as shown. What it printed:

| Command | Result |
|---|---|
| `pnpm --filter @mygame/api typecheck` | exit 0 |
| `pnpm biome check` on `SendJobController.ts` and `jobsRoutes.ts` | exit 0, no fix applied |
| `pnpm --filter @mygame/api test src/town/jobs/infrastructure/http/jobsRoutes.test.ts src/openApi.test.ts`, on its own Postgres 18.6 and Mailpit | 2 files, 43 tests passed: the class answers what the function answered, and `openapi.json` did not change |

The other 43 endpoints, the split of `accountRoutes.ts` and `MailCopy`
were not prototyped.

### 12. The checks

Named here. Each keeps ADR 052's rule: a name, a command, expected
empty, a line in the baseline until its step.

| Check | Today | After |
|---|---|---|
| `api_holds_layer` (new) | | no folder named `application` or `domain` under `apps/api/src`: `fd -t d '^(application\|domain)$' apps/api/src` |
| `role_folder` (new) | | no `useCases`, `services` or `ports` folder in the domain package, no `postgres` or `memory` folder in the api: `fd -t d '^(useCases\|services\|ports)$' packages/domain/src; fd -t d '^(postgres\|memory)$' apps/api/src` |
| `file_outside_layer` (new) | | every `.ts` file of a feature of the domain package sits in a `domain/`, `application/` or `testing/` folder; the kernel folders `player`, `time`, `hash`, `grid` and the root files are exempt |
| `route_file` (new) | | no endpoint is a function file: `fd 'Route(\.test)?\.ts$' apps/api/src` |
| `application_imports_infrastructure`, `application_knows_wire` | read `apps/api/src/**/application/**` | retired at the close: the application is in the domain package, and the leak check of `architecture.md` already refuses Hono, Drizzle, zod and `node:` there |
| `persistence_knows_http` | `infrastructure/{postgres,memory,json,smtp,system}` | `infrastructure/{persistence,catalog,json,smtp,system}` |
| `use_case_named_of` | `/(application\|useCases\|services)/` | `/application/` |
| `domain_promise_outside_its_roles` | no `Promise<` or `async` outside `useCases/`, `services/`, `ports/`, `testing/` | outside `application/` and `testing/`: no `async`, and `Promise<` only in a file that exports an `interface` |
| `use_case_imports_use_case` | a file of `useCases/` imports no `useCases/` file | a file of `application/` imports no PascalCase file of an `application/` folder |
| `service_is_public` | `/services/` in `index.ts` | `step_is_public`: `rg -n "/application/[a-z]" packages/domain/src/index.ts` |
| `use_case_shape` (ADR 053, section 7) | `**/useCases/*.ts` | `**/application/[A-Z]*.ts`: each exports one class with a constructor and `async execute(` |
| `controller_shape` (new) | | `**/infrastructure/http/*Controller.ts`: each exports one class with a constructor and `async handle(` |
| `use_case_built_outside_root` (new) | | no file under `apps/api/src/*/` writes `new` before a class of `application/` |
| `controller_built_outside_route_list` (new) | | `rg -n "new \w+Controller\(" apps/api/src -g '!*Routes.ts' -g '!*.test.ts'` |
| `adapter_built_outside_root`, `production_imports_fakes`, `folder_over_limit`, the two caps, `map` | | unchanged |
| `feature_graph` (`biome.json`) | 8 overrides name `infrastructure/postgres/` in their `includes` and in the schema exemption | the same 8, naming `infrastructure/persistence/` |

When each is edited:

- **Step 0** adds the new checks, each with its baseline, and widens
  the four that read the domain's role folders, so that they read both
  grammars while the tree holds both: `use_case_named_of`,
  `domain_promise_outside_its_roles`, `use_case_imports_use_case` and
  `service_is_public` name `application/` beside `useCases/` and
  `services/`.
- **`domain_promise_outside_its_roles` is widened in step 0, before
  step 2** puts the first promise of the domain outside a role folder:
  `UnitOfWork.ts`, `AfterResponse.ts` and `AfterResponseDrain.ts` in
  `platform/domain/`, each an `interface`. (`Refusal` and `FailureSink`,
  which move with them, name no promise.) From step 0 it reads:
  outside `useCases/`, `services/`, `application/` and `testing/`, no
  `async`, and `Promise<` only in a file that exports an `interface`.
  It passes on trunk with no baseline line: all 21 files of the
  domain's `ports/` folders export an `interface`, none is `async`,
  and today's check already finds no promise outside the role folders.
  Of the 8 files of the api's `application/ports/` that export no
  `interface`, only `Transaction.ts` names a promise, and step 2
  brings it to the domain as the interface `UnitOfWork`, never as the
  type.
- **The step that renames a folder edits the glob that names it**, in
  the same pull request: step 1 for the 8 Biome overrides and for
  `persistence_knows_http`, which gains `persistence` and `catalog`
  and keeps `memory` while a `memory/` folder stands.
- **Step 16** narrows the four to the After column, drops `memory`
  from `persistence_knows_http`, and deletes the two retired checks
  with the last `application/` folder of the api.

Step 0 writes the baselines from trunk: `role_folder` 36 folders (8
`useCases`, 5 `services`, 10 `ports`, 7 `postgres`, 6 `memory`),
`api_holds_layer` 12, `route_file` 62 (the 44 endpoint files and the
18 tests named for one), and `file_outside_layer` one line for each
folder of the domain package that holds a file directly.
`use_case_shape`, `controller_shape` and `step_is_public` find no
file to read until step 2 writes the first controller and step 5 the
first use-case class.

The application files that leave the api leave its feature graph: the
domain package has none (ADR 052, section 2). `noImportCycles` still
binds them, and on trunk one line of a use case or service crosses a
feature, `answerReview.ts:16` reading the town's `saveChangedTown`,
which runs with the graph.

### 13. The rule and doc edits

Named here, not applied. A sentence that states a rule lands in step
0, with one transitional line beside it: "a feature that has not
moved keeps ADR 052's folders and is listed in the baseline", which
step 16 deletes. A line that names a path, a file or an example lands
in the step that creates what it names, so that every path a rule
names exists at every merge (`verification.md`, the `.claude/**` row).

| File | Edit | Step |
|---|---|---|
| `.claude/rules/architecture.md` | "laid out by feature then by role (ADR 052…)" becomes "by feature then by layer (ADR 054)", with the sentence of section 1 and the transitional line. The check list takes the names of section 12. "Use cases are one exported function or one class with one `execute`…" becomes "A use case is one class in `application/` with a constructor and one `execute`; it opens the unit of work it needs and returns `Result`. A step it shares is a function beside it." "A port follows its user…" becomes "A port is an interface in the `domain/` folder of its feature." In `apps/api`: "A controller is thin: parse with the contract schema, execute the use case, map the `Result`." | 0 |
| `.claude/rules/architecture.md` | "the account's use cases are api use cases" leaves | 5 |
| `.claude/rules/architecture.md` | "`application/` imports no `infrastructure/`, no wire type and no HTTP or database library" leaves with the last `application/` folder of the api, and the two retired checks leave the list | 16 |
| `.claude/rules/typescript-style.md` | Idioms: "a function that reads a port is a use case and is named as one" becomes "a function that reads a port is a step of `application/`; a use case is a class there (ADR 054)". File names: "the first folder is a feature, the second a role" becomes "the second a layer", with the transitional line | 0 |
| `.claude/rules/typescript-style.md` | Naming by layer gains "Controller, use case + `Controller`, a class, `HealthController`". Modules: "a domain kernel folder such as `ports`" names `platform` | 2 |
| `.claude/rules/typescript-style.md` | Naming by layer gains "Use case, verb phrase in PascalCase, a class, `SignUp`" and "Step, verb phrase, `openSession`" | 5 |
| `.claude/rules/typescript-style.md` | Modules: the subpath example `#town/useCases/sendJob` follows the file | 7 |
| `.claude/rules/typescript-style.md` | The Responder row's example `respondTownChange` becomes `respondTownReading`, with the file's deletion | 10 |
| `.claude/rules/typescript-style.md` | The rows "Domain use case", "Api use case" and "Endpoint" leave, and the Test row's example becomes `SendJob.test.ts` | 16 |
| `.claude/rules/principles.md` | KISS: "A plain function beats a class with one method, except a use case and a controller, which are classes by ADR 054." | 0 |
| `.claude/rules/verification.md` | The row `apps/api/src/*/infrastructure/postgres/*Tables.ts` names `persistence/` | 1 |
| `ARCHITECTURE.md` | The folder table: each step rewrites the rows of the feature it moves, and `map` holds it to that; `account`, `content`, `report` and `platform` gain a domain column in their steps, and the `ports` row leaves in step 2 | each |
| `ARCHITECTURE.md` | "One request, end to end" is rewritten on `POST /town/jobs` with the paths of sections 4 to 6 | 7 |
| `ARCHITECTURE.md` | The two grammars become sections 2 and 3 of this ADR. "Where a new thing goes" becomes the sentence of section 1 and the list a new endpoint adds: its use case, its line of `composeUseCases.ts`, its controller, its lines of the route list | 16 |
| `scripts/mygame-structure-check`, its test, its baseline | Section 12, at the steps it names | 0, 1, 16 |
| `biome.json` | The 8 `feature_graph` overrides (section 12) | 1 |
| `apps/api/drizzle.config.ts` | `./src/**/infrastructure/persistence/*Tables.ts` | 1 |
| `apps/api/CLAUDE.md`, `packages/domain/CLAUDE.md`, `docs/agents/peer.md:29` | Each path they name, in the step that moves the file: `infrastructure/postgres/` in step 1, `inTransaction` and `src/platform/thrownCauseOf.ts` in step 2, `src/town/application/mutateTown.ts` in step 6 | each |

### 14. What this supersedes

| ADR | Section | Fate |
|---|---|---|
| 052 | 1, the layer table | superseded by section 1 |
| 052 | 2, the features, the feature graph, the schema exemption | kept; the exemption names `persistence/` |
| 052 | 3, the folder grammar | superseded by section 2 |
| 052 | 4, where a use case and a port go | superseded by sections 1, 3 and 4; "a pass-through earns no file" kept |
| 052 | 5, the file-name grammar | the Name column and the three rules are kept; the rows "Domain use case", "Domain service", "Port", "Api use case", "Endpoint" and "Contract suite" are replaced by sections 2, 3 and 6. The Folder cells go stale with the folders: "Entity, value object, type" and "Pure rule" read `domain/`, "Tables" and "Row mapper" `infrastructure/persistence/`, "Adapter" names `persistence/` and `catalog/` among its technologies, and the Test row's example follows its subject. In the first rule, "no file under `application/`, `useCases/` or `services/` ends in `Of.ts`" reads `application/`. "One endpoint, one file" holds the declaration and the controller |
| 052 | 6 and 9, the limits and the caps | kept |
| 052 | 7, the checks | amended by section 12 |
| 052 | 8, `ARCHITECTURE.md` | kept; its content follows section 13 |
| 053 | 1 and 2, the shape and `execute` | kept, absorbed here |
| 053 | 3, the name | kept; the class takes its endpoint's name, and the folder is `application/` |
| 053 | 4, built where its ports are | superseded by section 5 |
| 053 | 5, what stays a function | kept; a "domain service" is a step; "everything in the api" no longer holds use cases |
| 053 | 6, tests | superseded by section 10 |
| 053 | 7 and 8, the check and the rule edits | superseded by sections 12 and 13 |
| 053 | the migration | superseded by the one below; no ticket of ADR 053 is filed |

ADR 053 stays proposed and is closed by this ADR's acceptance.

## The migration

Every step is one ticket. Where a step both moves and changes, the
move and the change are separate pull requests, the move first, and
each passes `pnpm gate` alone.

- **A move pull request holds the files whose content stays**:
  entities, values and pure rules to `domain/`, ports to `domain/`,
  `services/` to `application/`, fakes to `testing/`, contract suites
  to `persistence/`. It moves them with `git mv`, rewrites every
  importer and deletes the folders it empties.
- **A change pull request holds what changes shape.** A use case
  arrives at its new path in the pull request that makes it a class:
  `useCases/sendJob.ts` becomes `application/SendJob.ts`, the api's
  `signUp.ts` becomes the domain's `SignUp.ts`. With it come the steps
  only it calls, its line of `composeUseCases.ts`, and its controller
  (`sendJobRoute.ts` becomes `SendJobController.ts`). One rename and
  one rewrite a file, in one diff: a function left under
  `application/` between two pull requests would be an exported step,
  which `step_is_public` refuses.
- **A file moves only when every importer may follow it.** The domain
  package cannot import the api, so a port the api holds moves no
  later than the first file of the domain that names it. And a file
  of the api's `application/` cannot import `infrastructure/`
  (`application_imports_infrastructure`, which binds until step 16),
  so a gatherer moves to `http/` only once no file of `application/`
  calls it.

No file exists in two places, nothing re-exports an old path, no
function is left that wraps a class (ADR 040's shim).

Four proofs hold at every pull request, on top of the gate:

- `apps/api/openapi.json` is byte-identical.
- `pnpm --filter @mygame/api db:generate --name probe` writes no file.
- No fact a test asserts changes. A pull request lists each test line
  whose path to the value changed (section 10) and each test moved or
  renamed.
- The baseline shrinks. It grows only by the `step_is_public` lines
  named below.

| Step | Ticket | Moves | Changes |
|---|---|---|---|
| 0 | The rails | none | the checks of section 12 with their baselines, the rule edits section 13 gives to step 0, the ADR accepted |
| 1 | `persistence/` | the 7 `infrastructure/postgres/` folders become `infrastructure/persistence/`; with them the `drizzle.config.ts` glob, the 8 Biome overrides, the glob of `persistence_knows_http` and the row of `verification.md` | none: the `db:generate` probe is its whole proof |
| 2 | `platform` | the domain's `ports/` and `ports/testing/` to `platform/domain/` and `platform/testing/`; from the api's `platform/application/`, `FailureSink`, `AfterResponse`, `AfterResponseDrain` and `Refusal`, and `thrownCauseOf`, to `platform/domain/`. `Transaction.ts` stays where it is | `Transaction` arrives in the domain as the interface `UnitOfWork`; `postgresTransaction` becomes `DrizzleUnitOfWork`, `inTransaction` `unitOfWork` in 23 files, the four test doubles; `inMemoryUnitOfWork`; `healthRoute.ts` becomes `HealthController.ts`, the first controller |
| 3 | `content` | `LessonLibrary` to `content/domain/` | none |
| 4 | `memory`, `season` | their files to `memory/domain/` and `season/domain/` | none |
| 5 | `account` | the files of `application/ports/`, the types and the pure rules to `account/domain/`; the 3 `Memory*` to `account/testing/`; the contract suites of `memory/` beside the adapters they prove | before the move, in the api: `MailCopy` and `CatalogMailCopy` replace `pickFixedCopy`, `MemoryAccountTokens` keys by the token, `tokenDigest` goes to `persistence/` (section 8). After it: the 7 classes of section 3 with their steps, `composeUseCases.ts`, the 11 controllers |
| 6 | `town`, the root | the root's files and `ports/` to `town/domain/`, `services/` to `town/application/`. From the api: the 6 files of `town/application/ports/`, of which `TownStores`, `TownReader`, `TownNewsReader` and `ReadOnlyTowns` go to `town/domain/` and `GuidanceDismissals` and `SeenTips` to `town/guidance/domain/`; `TownReading`; `mutateTown` and `readTownReading` to `town/application/`; the 3 `Memory*` of `town/infrastructure/memory/` to `testing/` and its contract suites to `persistence/`; `gatherTownView` to `town/infrastructure/http/` | `changeTown`, `inMemoryTownStores`, `inMemoryTownReader` with its contract suite; `FoundTown` and `ResolveCurrentTown`, which take in `foundTownOnFreeSite.ts` and `resolveCurrentTown.ts`; the 3 controllers |
| 7 | `town/jobs` | its root files and `ports/` to `domain/`, its `services/` to `application/` | the 6 classes; `respondRegionMap.ts`, `quoteJobNow.ts` and `quoteCleanUpNow.ts` fold into theirs; the 7 controllers |
| 8 | `town/building` | the same; `gatherBuildingsView` and `gatherWorkView` to its `http/` | 2 classes, 2 controllers |
| 9 | `town/hiring` | the same | 2 classes, 2 controllers |
| 10 | `town/school` | the same; `gatherSchoolView` with its test and `gatherLessonWordsView` to its `http/` | 2 classes, 2 controllers; `settleSchoolLesson` becomes a step; `respondTownChange.ts` is deleted, the last of its nine callers gone |
| 11 | `town/guidance`, `town/news`, `town/resources` | the same; `gatherGuidanceView` to its `http/` | `DismissGuidance`, `MarkTipSeen`, `ResolveTownNews`; 3 controllers; `respondGuidanceChange.ts` answers what the class answers |
| 12 | `placement` | its files; the contract suites of its `memory/` | 4 classes, 4 controllers, the offer reading renamed |
| 13 | `holdout` | its files; the contract suites of its `memory/` | 4 classes, 4 controllers; `mutateHoldoutCheck` becomes a step, the checks reading is renamed |
| 14 | `learning` | its sub-areas to `domain/` and `application/`; `CardReader`, `LearnerStores`; the contract suites of its `memory/` | the 3 classes of `reviews`, 3 controllers; `gatherReviewVerdict` to `learning/infrastructure/http/`; `LearningDependencies` is deleted |
| 15 | `report` | `ReportClosings`, `MemoryReportClosings`, the contract suite of its `memory/` | `ServeReport`, 2 controllers |
| 16 | Close | none | every baseline empty; `step_is_public` empty; the four widened checks narrowed and the two retired ones deleted (section 12); the transitional line of the rules deleted; `ARCHITECTURE.md` final |

Why this order:

- **1 before all**: it renames a folder seven features hold, once, so
  that drizzle's glob and the 8 Biome overrides never name both
  `postgres` and `persistence`. A `memory/` folder leaves with its
  feature: merged whole into `persistence/` in step 1, the town's
  would hold 32 production files, past the 30 of `folder_over_limit`.
- **2 before any class**: a use case needs the port to open.
- **5 before 6**: `TownStores` names `Accounts` and `TownReader` names
  `StoredScaffold`, so the account's ports are in the domain package
  before the town's arrive.
- **`GuidanceDismissals` and `SeenTips` in step 6, not 11**:
  `TownStores` names both, and the domain package cannot import them
  from the api. Their fakes go with them.
- **6 before 7 to 15**: every one of them calls `mutateTown`.
- **The town's gatherers move in move pull requests**: once
  `gatherTownView` is in `http/` (step 6), every caller of the other
  five is in `http/` too (`gatherTownView.ts:102-138`,
  `gatherSchoolView.ts:90`). **`gatherReviewVerdict` moves in step
  14's change**: its only caller is `submitReviewAnswer.ts:111`, in
  the api's `application/` until that pull request makes it
  `SubmitReviewAnswer`.
- **12 and 13 before 14**: the placement's and the holdout's endpoints
  read `LearningDependencies`, a type of the api's
  `learning/application/`. Once their controllers take a use case,
  nothing outside learning reads it, and step 14 deletes it.
- **14 before 15**: `ServeReport` shares the due-reviews step.
- **3 and 4 any time after 0.**

While later steps wait, files of the api still call a step that has
already moved: `readScaffold` from step 5 (7 import lines under
`infrastructure/http/`), `mutateTown`, `changeTown`, `readTownReading`
and the current-town resolve from step 6, the due-reviews reading from
step 14. The pull request that moves one exports it from `index.ts`
and adds its line of `step_is_public` to the baseline, the one way
the baseline grows. Each later step deletes the call sites it
rewrites, and step 16 deletes the last export. A baseline line is a
list entry, not code (ADR 052, section 6).

Every step edits `packages/domain/src/index.ts`, and from step 5 on
`composeUseCases.ts` and its type. They merge one at a time, each
rebased on the one before. No step changes a wire shape, a table or a
line of copy: `openapi.json`, the migrations and Android stay as they
are. Each step owes `pnpm --filter @mygame/domain test`, `pnpm
--filter @mygame/api test` on the session's own Postgres, and the gate
(`verification.md`).

## Considered options

### A. Three layers, one home each, the use case opens the unit of work (chosen)

Sections 1 to 7.

### B. Keep the transaction in the api, rename the folders only

`useCases/` becomes `application/`, the root `domain/`, and the api
keeps its `application/` for the orchestration.

- For: no use case changes, no test changes, a tenth of the churn.
- Against: "application" still names two folders in two packages with
  two meanings, which is what #1805 asks to end; a use case still has
  nothing to live on, so ADR 053's class is built at 30 call sites and
  a route still names every store.

Refused by #1805.

### C. Stores that find their transaction

An ambient transaction (`AsyncLocalStorage`) would let a repository
built once join the transaction in progress, so a use case could hold
`towns` in its constructor as `CourseCreator` holds its repository.

- For: the constructor reads like Codely's; no callback.
- Against: ADR 053 refused it (option D) and the reason holds. The
  explicit `stores` a reader follows from `transact` to the adapter
  become state no signature shows, and `mutateTown`'s lock order is
  correctness, which `principles.md` ranks first. The domain package
  cannot import `node:async_hooks`.

Refused.

### D. A command changes, a query reads: two use cases an endpoint

`SendJob` would answer the `Town` it saved, as ADR 053 has it, and the
controller would then ask `ResolveCurrentTown` for the overview.

- For: `SendJob` keeps its return type and its test's assertions; no
  `changeTown`, no `inMemoryTownReader`.
- Against: the overview is no longer read in the change's transaction.
  Today `respondTownChange.ts:18-25` reads it under the player's lock
  at the mutation's instant; after, a change that committed could
  answer a failure of the read, and a client that retries a `POST`
  that already happened may apply it twice. The move would change
  behavior, and the migration's first proof is that it does not.

Refused. The owner may reverse it: only `changeTown`, the return type
of nine classes and their controllers differ.

### E. The account's three layers inside the api

`apps/api/src/account/{domain,application,infrastructure}`, as
`src/users/` of AlbertHernandez's template, because auth is not a game
rule.

- For: no `MailCopy` port; the web never loads the account's ports.
- Against: the layers would have two homes again, with a `domain/`
  folder in the api beside a package named domain, and section 1's
  sentence would need an exception. `TownStores` and `LearnerStores`
  name `Accounts` (the player's lock, the scaffold), so the domain
  package would need narrow ports of its own for both.

Refused. The price is one port added (section 8).

### F. `gather*View` as query use cases

Section 7 gives the evidence against.

### G. The endpoint stays a function

The first draft of this ADR: `sendJobRoute(routes, dependencies)`
keeps its shape and its name and reads `dependencies.sendJob`.

- For: it already receives its use case, which is what the
  constructor buys in both references. A route file is a
  registration, called once at startup, and holds nothing afterwards.
  `principles.md` says "a plain function beats a class with one
  method". A function has no `this` to lose. 44 files and 18 tests
  keep their name.
- Against: the owner reads the backend with no AI, from the two
  references he learned the hexagon in, and both write the endpoint
  as a controller class. A function named `*Route` is this codebase's
  own shape, and he has to be told it is the controller.

Refused by the owner on #1806: the hexagon's shape, recognizable at a
glance, is the purpose of this ADR. The price is section 6's: a second
exception to `principles.md`, 62 files renamed, five lines an endpoint
in the route lists.

### H. `application/services/` for the steps

- For: a folder says the role, as `services/` does today.
- Against: a fifth level
  (`town/jobs/application/services/dispatchJob.ts`), and the case of
  the file name already says it, by the rule the feature root uses
  today for an entity and a pure rule.

Refused.

## What is not adopted from the references

- **Tests in a separate tree.** Both keep `tests/` beside `src/`. A
  test here stays beside its subject (`testing.md`).
- **Fakes under `infrastructure/` or `__mocks__`.** Codely keeps
  `CourseRepositoryMock.ts` in `tests/…/__mocks__`, AlbertHernandez an
  in-memory repository in `infrastructure/`. The domain package cannot
  import the api, and its use-case tests need the fakes: `testing/`.
- **A folder per use case.** Codely's `application/Create/` holds the
  service, its command and its handler. A use case here is one file.
- **The container, the buses, the aggregate that records events, a
  class for every value, the agent noun, `run`, a thrown error**: ADR
  053, "What is not adopted from Codely", stands.
- **Controllers outside the feature, named for the HTTP verb, behind a
  `Controller` interface.** Codely keeps them in
  `src/apps/mooc/backend/controllers/`. Here a controller sits in its
  feature's `infrastructure/http/`, as AlbertHernandez's
  `rest-api/user-controller.ts` does, and takes its use case's name
  (section 6).
- **`shared/`.** The kernel keeps the name `platform`, which the api
  already uses for the adapters of the same ports.

## Consequences

- A reader opens any feature and finds the three words, each in one
  place: `domain/` and `application/` in the domain package,
  `infrastructure/` in the api.
- A use case shows its whole transaction: what it locks, what it
  reads, what it saves, in one `execute`. A controller shows none of
  it.
- "Application" names one thing. The two questions of ADR 052, section
  4, and the `application/ports/` folders are gone.
- A use case is built once per app and handed to its controller, as in
  both references. ADR 053's 30 call-site constructions never happen.
- The endpoint is a class: 44 `*Route.ts` files and 18 of their tests
  are renamed, `principles.md` gains a second exception to "a plain
  function beats a class with one method", and a route list grows from
  one line an endpoint to five. `accountRoutes.ts` has to be split or
  given a function that mounts.
- 36 classes, not 26: the door is what an adapter asks, and 5 of
  today's domain use cases are steps behind a door.
- The test of a use case that changes the town runs the lock, the
  settle and the read-back, which it used to skip, over a fake of each
  of the 15 stores. It proves more and its arrange is longer;
  `inMemoryTownStores` is where that length lives.
- The in-memory unit of work does not roll back. What a refusal
  leaves behind is proved on Postgres only, as today.
- The account enters the pure package, at the price of one new port,
  `MailCopy`, for the copy the catalog writes. `architecture.md` loses
  "auth is never a domain concern" for the use cases; the session
  middleware keeps it.
- The HTTP adapter gains 838 lines of pure view assembly. It reads
  domain rules and writes no rule of its own; a reviewer holds it to
  that.
- `packages/domain` holds two layers under a name that says one.
- The application leaves the api's feature graph. Only
  `noImportCycles` binds it there.
- The migration moves most of the backend a second time, 17 steps
  after ADR 052's, and they merge one at a time. `git log --follow`
  reads through two renames.
- Android is untouched: `projection-cases.json` keeps its path and
  `openapi.json` does not change.

## References

- Issue #1805 and pull request #1806, where the owner decided the
  controller class; issue #1803 and ADR 053; issue #1710 and ADR 052.
- `CodelyTV/typescript-ddd-example` at `94717b07`:
  `src/Contexts/Mooc/Courses/**`, `src/Contexts/Shared/domain/**`,
  `src/apps/mooc/backend/controllers/Controller.ts` and
  `CoursePutController.ts`, `src/apps/mooc/backend/routes/courses.route.ts`.
- `AlbertHernandez/hexagonal-architecture-typescript-service-template`
  at `55eef46c`: `src/users/**`, `src/shared/**`.
- ADR 001, ADR 004: the packages and the pure domain, kept.
- ADR 005: lazy evaluation, kept; `mutateTown` is where a mutation
  materializes the instant.
- ADR 040: the definition of a shim the migration is held to.
- `.claude/rules/architecture.md`, `typescript-style.md`,
  `naming.md`, `principles.md`, `testing.md`, `verification.md`.
