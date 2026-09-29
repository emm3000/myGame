---
status: accepted
date: 2026-09-29
---
# Seasons are a global calendar applied by piecewise accrual

## Context

The lore has held a season since the first draft of `docs/lore/world.md`:
four seasons turn over the world, winter lowers harvests, spring raises
them, autumn favours trade. Nothing shipped before S8 let time change a rate:
ADR 005 stores `(amount, at, ratePerHour, capacity)` and reads
`amount + ratePerHour * hours(at, now)`, one rate for the whole span, and
every rate the fief earns is a pure function of its building and art levels,
its terrain and the content (ADR 008). A season is the first thing that
changes a rate without the player touching the fief, and the obvious
designs pull in what the PRD forbids: a job that turns the season and
rewrites every fief (W7, N2), a stored rate that goes stale at each boundary,
a season the client computes from the wall clock (N1), a `season` table
beside the content. The owner grilled the slice on 2026-09-29 (#182), took the
recommended option on every question, and confirmed the five gaps the
tickets left with their defaults on the same day (the owner's comment on
#182). This ADR records the decisions S8 shipped: PRs #191 to #195, and
#189, the mark on the resource bar.

## Decision

- **One calendar for the whole world, a constant in content.**
  `apps/api/content/fief.json` gains `seasons { epoch, daysPerSeason,
  multiplierPercent }`, parsed at start-up by `FiefContentSchema` and handed
  to the domain in `FiefSettings` through the `BuildingCatalog` port (ADR
  008), the epoch as an `Instant`. The shipped values: epoch Monday
  `2026-10-05T00:00:00Z`, seven real days per season, so a **year** is 28
  days. Spring of year 1 starts at the epoch and the seasons run spring,
  summer, autumn, winter, then spring of the next year. Every fief reads the
  same season at the same instant; there is no per-kingdom or per-fief
  season and no stored season anywhere.
- **A season is a half-open interval.** It runs from its start, included, to
  its `endsAt`, excluded, so a boundary instant belongs to the season it
  starts. `seasonAt(instant, settings)` in `packages/domain/src/season/`
  answers the season in force (`kind`, `year`, `endsAt`) by closed-form
  arithmetic on the milliseconds since the epoch, never by walking seasons.
- **No season before the epoch.** An instant before the epoch has no season:
  `seasonAt` answers none, every rate is unchanged and the wire answers
  `season: null`. Time already played is not made retroactively spring.
- **The multipliers are whole percents in content, applied last and once.**
  `multiplierPercent` is a record over the four seasons of a record over the
  five resources, every cell a whole percent from 1; a missing season, a
  missing resource, zero or a negative value fails the parse and the api at
  start-up (ADR 008). The shipped cells are gentle: winter food `75`, spring
  food `125`, autumn gold `125`, summer neutral, every other cell `100`.
  `deriveResourceRates(buildingLevels, artLevels, terrain, catalog, at)`
  sums base, producers and terrain, collects the whole percents that scale
  each resource, the arts' `100 + ratePercent` first and the season's percent
  last, and scales each rate once, as `rate * (product of its percents) / 100
  ** count`: one division per resource, so the season scales the terrain
  bonus and the arts too and no factor of the form `rate * 0.75` enters
  floating point. Before the epoch no season percent is collected.
- **Accrual is exact and piecewise.** `materializeStocks(fief, catalog,
  now)` splits `[storedAt, now]` at every season boundary it crosses, the
  epoch included, and accrues each segment with `accrue` as it stands at the
  rates `deriveResourceRates` gives for the segment's start: k boundaries
  make k + 1 segments, never one step per hour, and a span inside one season
  is one segment, the same call as before S8. `nextSeasonBoundaryAfter`
  answers the `endsAt` of the season in force, or the epoch before it.
- **Each segment floors, clamps and freezes on its own**, as each finish
  step of the resolve did already: a segment's amount is floored, a stock
  under the capacity fills up to it, a stock at or above the capacity reads
  back unchanged (ADR 005, amendment of 2026-09-25). A span crossing k
  boundaries may therefore read up to k units below the unfloored sum.
- **A boundary and a finish order themselves by instant.** The resolve's
  walk (`resolveUpgrade`) already materializes the stocks to each finish
  instant before applying it, through `materializeStocks`; each of those
  materializations splits at the boundaries it crosses, so an upgrade that
  finishes before a season change accrues at the old season's rates and one
  that finishes after it at the new. No use case changed for S8, and every
  caller of `materializeStocks` (the resolve, the enqueue, both cancels, the
  study start and `Fief.accruedTo`) splits the same way.
- **The wire carries the season as data, or `null`.** `FiefOverview.season`
  (ADR 010) is `null` before the epoch, otherwise a strict `{ kind, year,
  endsAt, multiplierPercent }`: the season `seasonAt` answers for the read's
  `readAt`, its `endsAt` as an ISO instant, and the content's
  `multiplierPercent` for that season, so the web can mark the affected
  resource without a table of what each season does (N1, N5), as
  `arts[art].ratePercent` carries an art's effect. Each `ratePerHour` on the
  same overview is `deriveResourceRates` at the same instant, so the season
  answered and the rates never disagree (M3).
- **The web re-reads at `endsAt` and computes no season.** The fief header
  shows the season's icon, the header line (*Otoño, año 1*) and a countdown
  to `endsAt` for a non-null `season`, and nothing of the season for `null`;
  the resource bar shows the effective rate and marks the one resource whose
  `multiplierPercent` is not `100` with the season's effect in words (#185,
  #189); building cards keep the raw content effect; the map is untouched.
  `useLiveFief` re-reads when the season countdown reaches zero, as it does
  at a finish instant, with every re-read `setTimeout` clamped to 2^31 − 1 ms
  so a longer `daysPerSeason` cannot overflow it; before the epoch the
  60-second re-read picks spring up within a minute (M8). The kind, the year
  and `endsAt` come from the overview; the only calendar knowledge in the
  client is the fixed order of the four labels the countdown names, which
  the lore fixes (`docs/lore/names.md`, The seasons).
- **Four hand-drawn line icons**, a sprout, a sun, a leaf and a snowflake,
  in the Design System beside the clock, no generated image
  (`docs/art/art-bible.md`, UI icons).
- **No chronicle event on a season change.** A season is the world's clock,
  not something that happened to the fief; the chronicle keeps its four
  kinds (ADR 013).
- **No migration.** Rates are derived on read and never stored, the season is
  arithmetic over content and `storedAt`, so S8 adds no column and no table
  (ADR 005, N2).
- **Production rates only.** Build and study durations keep their content
  values in every season; summer speeding building is S9 and amends this ADR
  when it ships.

## Considered options

- **A job that turns the season and rewrites every fief's rates.** Rejected
  by W7, N2 and ADR 005: the api idles with no timer, and the season is a
  function of the instant, so nothing needs turning.
- **One rate for the whole span, the season in force at `storedAt`** (what
  #184 shipped for one wave, until #186). Rejected: a player away across a
  boundary would earn a week of winter at spring's rate or the reverse, and
  the PRD acceptance criterion would no longer hold to a formula anyone can
  write down.
- **One step per hour, or per day, across the span.** Rejected: k boundaries
  need k + 1 segments and nothing finer; a stepped walk costs a read as many
  materializations as hours away for no more exactness.
- **Carry fractions across segments** so a span floors once. Rejected: it
  changes `accrue` and the meaning of every stored amount for at most one
  unit per boundary, four units a month.
- **Multipliers as decimal factors** (`0.75`, `1.25`), or applied one
  division at a time. Rejected: `rate * 0.75`-style factors and chained
  divisions drift in floating point (`packages/domain/CLAUDE.md`, the
  `deriveResourceRates` gotcha); whole percents over one division are exact
  for the numbers the content ships.
- **A retroactive spring**: year 1 starting at the first deploy, or the
  calendar counted from the first sign-up. Rejected: time already played
  would change its amounts on the next read, and every test at an instant
  before the epoch would need a season.
- **A per-kingdom or per-fief season.** Rejected: one calendar is the whole
  point of a shared world, and a per-fief season would need a stored season
  and a migration.
- **The client computes the season** from the wall clock and a copy of the
  calendar. Rejected by N1 and M8: the server decides, the client shows
  `season` and counts down to `endsAt`; a client with the wrong clock would
  show the wrong season.
- **`season { kind, year, endsAt }` alone on the wire**, the grilled shape.
  Extended by the owner on 2026-09-29 with `multiplierPercent`: without it
  the mark would need a web table of what winter does, which duplicates
  content (N1, N5).
- **A season table in Postgres**, seeded by a migration. Rejected by ADR 008:
  the calendar is content, and a table becomes a second source of truth.
- **A chronicle event per season change.** Rejected: every fief would gain
  the same event at the same instant, and the header already says which
  season it is.
- **Seasons on build and study durations in the same slice.** Deferred to S9:
  a duration is fixed at the enqueue (ADR 011) and at the study's start, so
  a season on it needs its own decision about which season's duration an
  upgrade enqueued in spring and finishing in summer takes.

## Consequences

- PRD S8 is added under Should have, citing this ADR; ADR 005 is amended: a
  rate changes over time, so a read accrues segment by segment.
- `CONTEXT.md` defines **Season** and **Year** as mechanics, no longer a
  lore hook, and **Accrual** as piecewise.
- `packages/domain` gains `season/` (`SeasonKind`, `SeasonCalendar`,
  `seasonAt`, `nextSeasonBoundaryAfter`) and one more argument on
  `deriveResourceRates`, the instant its rates are for; every `FiefSettings`
  fixture carries `seasons`, `testing/neutralSeasons.ts` for tests that are
  not about seasons. No port, no error kind, no use case changed.
- `packages/contracts` gains `SeasonKindSchema`, `seasons` on
  `FiefContentSchema` and `season` on `FiefOverviewSchema`; no Spanish
  enters either (ADR 010).
- A read after k boundaries costs k + 1 derivations and materializations,
  each a few multiplications: a month away is four, a year fifty-two, still
  one round trip to the store (N2, N3).
- Whole percents per resource bound what content can express: a season can
  scale a rate, never add to it or set it, and the mark on the bar reads the
  percent as a change from `100`. A season that adds a flat amount, or that
  touches a capacity, is a new decision.
- A player who reads at `endsAt` exactly sees the new season; one who reads
  just before it sees the old one, and the web re-reads when its countdown
  reaches zero.
- Changing `daysPerSeason` or the epoch in content changes the season every
  fief is in on the next read, with no migration and no stored amount
  touched: the amounts already stored were accrued under the old calendar
  and stay; only the spans read after the change split by the new one.
- The api's overview tests before the epoch run at 2026-09-22 and keep their
  expected rates; every test about a season builds a calendar in memory.
- The lore proposals of #183 (*la primavera*, *el verano*, *el otoño*, *el
  invierno*, *año N*, the header line, the countdown line and the mark) wait
  for the author; until accepted, `apps/web/src/copy.ts` mirrors the
  proposal.
- Out of scope of #182, each a future ADR or an amendment of this one: build
  and study durations by season (S9), a chronicle event per season, a season
  on building cards or on the map, generated season images, a named calendar
  or era, a per-kingdom or per-fief season, a job that turns the season (W7).

## Amendment (2026-09-29)

The "Production rates only" line no longer holds. S9 (ADR 017) gives content
a build and a study percent per season beside `multiplierPercent`, summer
shortens building and winter shortens study, and every other cell is 100.
A duration is fixed with the season in force at the enqueue or the study
start, in one division and one `ceil`, and never retimed while the work
waits or runs; the wire's `season` gains `durationPercent { build, study }`
and stays `null` before the epoch. Summer is no longer the neutral season.
Nothing else here changes: the rates still accrue piecewise, and no
duration follows the season while the work runs.
