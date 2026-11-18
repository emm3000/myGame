# packages/domain

The game rules as pure TypeScript (ADR 004): entities, value objects, use cases, the port interfaces and `DomainError`. Everything else depends on this package; it depends on nothing.

The rules: `.claude/rules/architecture.md`, `typescript-style.md`, `principles.md`, `testing.md`, `verification.md`. The code is the map: this file holds only the commands and the traps nothing else catches.

## Commands

- `pnpm --filter @mygame/domain typecheck` — `tsc --noEmit` over `src` and the Vitest config.
- `pnpm --filter @mygame/domain test` — Vitest, runs `src/**/*.test.ts`. The in-memory ports and the fixtures the tests pass live in `src/testing/`.
- `pnpm gate` from the repo root before every push.

## Gotchas

- Nothing throws, tests included: a test narrows a `Result` with Vitest's `assert(result.ok)`. The one `throw` in `src` is `testing/firstItemsRandom.ts`, which refuses an oversized sample as the api's `CryptoRandomSource` does.
- Randomness comes only through the `RandomSource` port, never `Math.random()`. `sampleOf(items, count)` takes a count no larger than `items`, so every caller caps it.
- `memory/` is a port of py-fsrs 6.3.2 at commit `9446cb06`, with no fuzz, and keeps its arithmetic: whole days floored, a review interval rounded half to even as Python's `round` (2.5 days is 2, 3.5 is 4), every `e ** x` written `Math.E ** x`, never `Math.exp`.
- `reviewMemoryCard` never checks the due instant: a use case that rates a card first refuses one not yet due, through `admitDueReview`.
- `answerReview` copies the pending review's `shownFrame` and never recomputes the frame: the stage can grow between a read and its answer.
- `answerReview` reads the player's town before it saves the earned skill: a store that loads the skills with the town would otherwise earn the skill twice.
- `Headword` and `WordId` are both `string`, so the compiler catches no mix: `BandStart.heldOutWords` holds headwords (`headwordOf`, the lowercase lemma), never word ids, since the draw spans the whole band and a later content batch gives most of its words their id.
- `deriveResourceRates` multiplies the whole percents and divides once, `rate × product / 100 ** count`: decimal factors and chained divisions drift in floating point (ADR 016).
- A season's percents are read only through `seasonPercentsAt` and `townSeasonAt`, so the percent a read answers is the one its durations and rates use. Nothing else reads `seasons.productionPercent` or `seasons.durationPercent`.
- A new projection rule is a new case in `src/town/projection-cases.json` first: `town/projectionCases.test.ts` and Android's `SharedProjectionCasesTest` read that one file, and a rule with no case there can differ between the two unseen.
- Every `derivePeople` call that judges whether work fits passes `town.staffedHires`, which counts a whole hiring order from the instant it is placed, never the hires delivered so far.
- Building work, a hiring order and a job store their cost, duration and pay when they start. Nothing reads the catalog again for stored work, so a content change never touches it.
- A use case whose change answers events saves through `saveChangedTown`, which saves the town, then records the events in `TownNews`, so they commit with the change that wrote them.

A PR adds a gotcha here only when it is a trap no code, rule or test catches, in one line, and never narrates its module.
