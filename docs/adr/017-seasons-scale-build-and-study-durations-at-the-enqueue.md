---
status: accepted
date: 2026-09-29
---
# Seasons scale build and study durations at the enqueue

## Context

ADR 016 made the season a global calendar that scales production rates and
left durations alone: its "Production rates only" line defers summer's speed
on building to S9. Before S9 a duration had two sources and one rounding: an
upgrade takes the seconds its content level names, stored on the entry at
the enqueue (ADR 011); a study takes `ceil(duration / (1 + libraryLevel))`,
the content seconds divided by one plus the built library level, fixed at
its start (ADR 012). Both are stored per entry and per study and never
retimed. A season on a duration raises questions the rates never posed: a
rate is derived on every read, a duration is stored once, so which season's
duration does an upgrade enqueued in spring behind a busy slot take when it
starts in summer, and does a work in progress speed up when the season
turns? The obvious designs pull in what the PRD forbids or the earlier ADRs
ruled out: a finish recomputed on every read so the work follows the season
(a stored `finishesAt` that goes stale, N2), a duration read from the
calendar when a waiting entry starts (ADR 011's "nothing retimes an entry
already paid for"), a client that scales the content seconds itself (N1).
The owner grilled the slice on 2026-09-28 (#198), took the recommended
option on every question, and its ten decisions bound the tickets. This ADR
records what S9 shipped: PRs #204, #205 and #206, and the web mark #202
places as Decisions 6 and 7 fix it.

## Decision

- **A build and a study percent per season, in content.**
  `apps/api/content/fief.json` gains `seasons.durationPercent`, a record
  over the four seasons of a strict `{ build, study }`, every cell a whole
  percent from 1, parsed at start-up by `FiefContentSchema` beside
  `multiplierPercent` and handed to the domain in `SeasonCalendar` through
  the `BuildingCatalog` port (ADR 008). A missing season, a missing cell,
  zero or a negative value fails the parse and the api at start-up. The
  shipped cells: `summer.build` 75, `winter.study` 75, every other cell 100.
  Summer stops being the neutral season of ADR 016; winter, which lowers
  food, gains something to do. Rates never read `durationPercent` and
  durations never read `multiplierPercent`: a season's effect on what a fief
  earns and on how long its work takes are two knobs.
- **No season before the epoch.** `durationPercentAt(instant, settings)` in
  `packages/domain/src/season/` answers the `{ build, study }` of the season
  `seasonAt` gives, and `{ build: 100, study: 100 }` before the epoch, as
  every rate is unchanged there (ADR 016).
- **A duration is fixed with the season in force at the instant the use
  case's `Clock` gives**: the enqueue for an upgrade, the start for a study.
  `enqueueBuilding` stores `deriveBuildDurationSeconds(seconds, build)` on
  the entry with the build percent at `clock.now()`, whether the entry takes
  the idle slot or waits behind a busy one; `startStudy` hands
  `Fief.startStudy` the study percent at `clock.now()`, and the `Fief` reads
  no calendar, as it reads no catalog (ADR 012). A read that showed a summer
  duration and an enqueue that lands in autumn get autumn: the server
  decides (N1).
- **A waiting entry keeps the season of its enqueue, never of its later
  start.** ADR 011 fixes an entry's duration at the enqueue so that nothing
  retimes an entry already paid for, and a season is one more thing that
  does not. An upgrade enqueued in summer behind a busy slot keeps its summer
  duration when it starts in autumn; one enqueued in spring keeps its spring
  duration when it starts in summer. A study in progress and an upgrade in
  the slot keep the duration they stored when the season turns; the resolve
  walk (ADR 005, ADR 016) reads no `durationPercent`.
- **One division and one `ceil`, never chained roundings.** A build
  duration is `ceil(seconds * build / 100)`. A study duration is
  `ceil(seconds * study / (100 * (1 + libraryLevel)))`:
  `deriveStudyDurationSeconds` gains the percent as a third argument and
  keeps its single rounding, so the library and the season divide the
  content seconds together, once. 1000 seconds at library 2 in a 75 % winter
  is 250 seconds, where a rounding per factor gives 251. Whole percents over
  one division keep the arithmetic exact for the numbers the content ships,
  as ADR 016 keeps the rates.
- **The wire answers the effective durations and the percents as data.**
  `FiefOverview` keeps answering `nextLevel.durationSeconds` for every
  building and every art, now scaled by `durationPercentAt` at `readAt`, the
  season applied as the built library already is for a study; a read and an
  enqueue at one instant agree. `FiefOverview.season` (ADR 010, ADR 016)
  gains `durationPercent { build, study }` for the season in force, beside
  `multiplierPercent`, and stays `null` before the epoch, so the web can mark
  a section without a table of what each season does (N1, N5). The same call
  at the same instant feeds the percents and every scaled duration, so they
  never disagree. The `{ build, study }` schema lives once, in
  `packages/contracts/src/SeasonDurationPercent.ts`, shared by the content
  and the overview.
- **A mark on the section header the season shortens, no per-card mark.**
  The buildings section header carries the `SeasonMark` chip of ADR 016 when
  `season.durationPercent.build` is not 100, and the arts section header
  when `season.durationPercent.study` is not 100, with the season's icon and
  the effect in words; a section at 100 carries no mark, so spring and
  autumn mark no section and nothing is marked for `season: null`. Each card
  action keeps formatting the duration the overview answers; the client
  computes nothing (N1). No design ticket: the chip, the icons and the
  fief mockup exist from S8 (#198, Decision 7).
- **Lore first.** The two mark phrases, *El verano acorta las obras* on the
  buildings section and *El invierno acorta los estudios* on the arts
  section, are proposed for the author in the seasons section of
  `docs/lore/names.md`, with the season table's notes and a line under
  Seasons in `docs/lore/world.md`; `apps/web/src/copy.ts` mirrors the
  proposal until accepted (ADR 010).
- **No chronicle event, no change to cancels or refunds.** A duration is not
  a cost: a cancel refunds the cost the entry or the study stored, and the
  chronicle keeps its four kinds (ADR 013).
- **No migration.** Durations were already stored per entry and per study
  (ADR 011, ADR 012) and the season is arithmetic over content and an
  instant, so S9 adds no column and no table (N2).

## Considered options

- **The season in force when a waiting entry starts**, read by the resolve
  walk. Rejected by ADR 011: the walk would retime an entry already paid
  for, `scheduleBuildQueue` would need the calendar to answer a waiting
  entry's `finishesAt`, and the duration the player saw at the enqueue
  would be a promise the queue might not keep.
- **A duration that follows the season while the work runs**, split at
  every boundary as accrual is (ADR 016). Rejected: a finish would stop
  being stored data and become a derivation on every read, the countdown on
  every card and every waiting entry's `finishesAt` with it, for at most a
  quarter of a duration; accrual is piecewise because a rate is derived on
  read, a duration is fixed because it is stored (ADR 005, ADR 011).
- **The library and the season each round on their own**: the study
  duration as `ceil(ceil(seconds / (1 + level)) * study / 100)`, or a
  decimal factor of `0.75`. Rejected: chained roundings add a second here
  and there (251 for 250) and `seconds * 0.75` drifts in floating point
  (`packages/domain/CLAUDE.md`, the `deriveResourceRates` gotcha); one
  division over whole percents is exact.
- **The `Fief` reads the calendar** and scales the duration itself in
  `enqueueUpgrade` and `startStudy`. Rejected: the entity reads no catalog
  (ADR 012 hands it the art level line the same way), and the use case is
  where `clock.now()` is already the one instant of the mutation.
- **Deriving the duration percent from the rate percent**, one record for
  both, or a flat number of seconds per season. Rejected: summer changes no
  rate and shortens building, so there is no rate percent to derive it
  from; a flat bonus is nothing on a ten-hour level and everything on a
  two-minute one, where a percent stays meaningful (ADR 012, the arts).
- **Optional cells defaulting to 100.** Rejected by ADR 008: every content
  file fails loud at start-up, as `multiplierPercent` does, and a silent
  100 would hide a typo in a season's name.
- **The client scales the content seconds** from `durationPercent` and a
  raw duration. Rejected by N1: the overview answers the effective
  durations, and `durationPercent` is on the wire to mark a section, not to
  compute one.
- **A per-card mark**, the effect on every building and art card. Rejected:
  every card already reads its shortened duration on its button, and one
  sentence on the section covers them all; the lore names the work in the
  plural for that reason (`docs/lore/names.md`, The seasons).
- **A season on costs, capacities or peasants** in the same slice. Out of
  scope of #198, each a future ADR: a cost is stored and refunded, so a
  season on it changes what a cancel gives back.
- **A chronicle event per season change.** Rejected as ADR 016 rejected it:
  every fief would gain the same event at the same instant.

## Consequences

- PRD S9 is added under Should have, citing this ADR; ADR 016 is amended:
  its "Production rates only" line no longer holds.
- `CONTEXT.md` rewrites **Season**, which now touches durations, and
  **Duration**, fixed once from the content seconds and the percents in
  force.
- `packages/domain` gains `durationPercentAt` and `DurationPercent` in
  `season/`, `deriveBuildDurationSeconds` in `fief/`, a third argument on
  `deriveStudyDurationSeconds` and a fourth on `Fief.startStudy`;
  `enqueueBuilding` and `startStudy` read the calendar through
  `FiefSettings`, the first use cases a season changed. No port and no
  error kind changed; every `FiefSettings` fixture carries
  `durationPercent`, `testing/neutralSeasons.ts` holds 100 in every cell.
- `packages/contracts` gains `SeasonDurationPercentSchema` and
  `durationPercent` on `FiefContentSchema.seasons` and on
  `FiefOverviewSchema.season`; no Spanish enters either (ADR 010).
- **"At least 1 second" holds for positive durations only.**
  `DurationSecondsSchema` admits 0, `ceil` keeps 0 at 0, and no content
  ships a duration of 0; a content level with one would finish at its start
  in every season. A guard on the schema is a decision of its own.
- Content may ship a percent over 100, a season that slows work: the schema
  admits it, the mark would show for it, and the lore names no phrase for
  it (`docs/lore/names.md` says *acorta* for both). The shipped content has
  none.
- A player is rewarded for ordering in the shortening season: an upgrade
  enqueued in summer behind a full queue keeps its summer duration into
  winter, and one enqueued in spring gains nothing when summer comes while
  it waits. That is the price of a stored duration, and the header's
  countdown tells the player when the season turns.
- A read just before a boundary shows the old season's durations; an enqueue
  just after it stores the new season's. The web re-reads at `endsAt` and
  shows what the server stored, never what the card promised (ADR 016).
- A study keeps ADR 012's rule: it takes the built library level and the
  season at its start; a library finished while it runs shortens nothing.
- The api's overview tests before the epoch run at 2026-09-22 and keep their
  durations; every test about a season's duration builds a calendar in
  memory.
- The lore proposals of #199 (the two phrases, the table notes, the world
  line) wait for the author; until accepted, `apps/web/src/copy.ts` mirrors
  the proposal.
- Out of scope of #198, each a future ADR or an amendment of this one: a
  duration that follows the season while the work runs, a season recomputed
  when a queued entry starts, a season on costs, capacities or peasants, a
  per-card mark, a chronicle event per season, the map.

## Amendment (2026-09-28)

S12 (#246) lifts ADR 018's "No season on recruiting in this slice" and its
"A season on recruiting" considered option. The owner grilled it on
2026-09-28 and took the recommended option on every question; this records
what S12 shipped, PR #252, where the code stands over the tickets. The
title and the Context above speak of build and study only, and the file
keeps its name.

- **A train percent per season, in content.** `seasons.durationPercent`
  becomes a strict `{ build, study, train }` per season, every cell a whole
  percent from 1, parsed at start-up as before. The shipped cells:
  `spring.train` 75, every other `train` 100; `summer.build` 75 and
  `winter.study` 75 are unchanged. Spring, which only raised food, gains
  something to do. The cell is named `train`; the `recruit` of ADR 018's
  considered option stays there as history. `SeasonDurationPercentSchema`
  in `packages/contracts` gains `train`, and `durationPercentAt` answers
  `{ build: 100, study: 100, train: 100 }` before the epoch.
- **One division and one `ceil`, never chained roundings.**
  `deriveUnitDurationSeconds` gains the percent as a third argument, as
  `deriveStudyDurationSeconds` did: `ceil(seconds * train / (100 * (1 +
  barracksLevel)))`. 100 seconds at barracks 2 in a 75 % spring is 25
  seconds, where a rounding per factor gives 26.
- **The duration is fixed with the season at the order, for all N units.**
  `placeRecruitOrder` hands `Fief.placeRecruitOrder` the train percent at
  `clock.now()` and the `Fief` reads no calendar, as `startStudy` does. An
  order that spans a season change is never retimed: it keeps the
  `perUnitSeconds` it stored, and the resolve walk (ADR 005, ADR 016) reads
  no `durationPercent`. An order placed in spring keeps its spring duration
  after summer begins.
- **The wire answers the scaled terms and the percent as data.**
  `FiefOverview.recruitTerms[unit].perUnitSeconds` is scaled by
  `durationPercentAt` at the read instant, the barracks level and the
  season together in one call so they agree, and `season.durationPercent`
  gains `train`; `season` stays `null` before the epoch. A read and an
  order at one instant agree; the order stores what the server computes
  (N1).
- **A mark on the army section header, no per-card mark.** As Decision 6 of
  #246 fixes it, and not as shipped (#249 runs beside this amendment): the
  `SeasonMark` chip of ADR 016 on the *Cuartel* header when
  `season.durationPercent.train` is not 100, with the season's icon and the
  effect in words; no mark at 100 or for `season: null`. No design ticket.
- **Lore first.** The phrase, *La primavera acorta la leva* in the register
  of *El verano acorta las obras*, is proposed for the author in the seasons
  section of `docs/lore/names.md` (#247, PR #251). It waits for the author;
  until accepted, `apps/web/src/copy.ts` will mirror the proposal (#249),
  as Decision 7 of #246 fixes it.
- **No event, no change to cancels or refunds, no migration.** The recruit
  cancel already reads the stored `perUnitSeconds` and the cost is not
  scaled; the chronicle keeps its six kinds (ADR 013, ADR 018 as amended);
  `perUnitSeconds` was already stored on the order, so S12 adds no column
  and no table (N2).

Nothing else here changes: rates never read `durationPercent`, a waiting
entry keeps the season of its enqueue, and a duration that follows the
season while the work runs, an order retimed at a season boundary, a season
on unit costs or occupancy, a per-card mark, a chronicle event per season,
a recruit queue, other unit kinds, upkeep or famine, marches and combat stay
out.
