---
status: accepted
date: 2026-10-01
---
# Seasons scale the road and the forage at dispatch

## Context

ADR 016 made the season a global calendar that scales production rates,
and ADR 017 let it scale the three durations a fief orders, build, study
and train, each fixed with the season in force at the order and never
retimed. The marches stood outside it: ADR 019 timed the road by the map
and fixed the forage loot at dispatch with "No season touches the road or
the forage", ADR 020 kept every season off combat, and ADR 021 scaled the
road by the slowest kind sent and listed "no season on the road" among
what did not change. The calendar turned over the fief and stopped at its
gate: a march read the same in every season, and autumn, which only
raised gold, gave a lord nothing to act on. S17 lets the season reach a
march in two things, its road and its forage loot. The obvious designs
pull in what the earlier ADRs ruled out: a road retimed when the season
turns while the men walk, when a stored duration is never retimed (ADR
011, ADR 017); a loot recomputed at the arrival, or accrued piecewise
over the stay, when ADR 019 fixed the loot at dispatch so the form
previews it and the resolve credits what is stored; a recall that reads
the calendar, so the partial loot would follow the season of the recall
and not of the march; a second table of percents for the forage, when N5
keeps every term in content and the harvest already has one; the
season's name stored on the march, which a content edit would revalue
while the men are away; a reset of the marches in flight, when a schema
change is a migration. The owner grilled and confirmed the slice on
2026-10-01 (#365), and its seven decisions bound the tickets; the
ticketing wrote seven defaults into #365 and three more into the tickets,
listed in the wave plan on #365, and the owner accepted each. This ADR
records what S17 shipped, PRs #373 to #376, and the lore proposals of
#366 (PR #372); where the code stands over a ticket it records the code:
the restore refuses a stored loot percent that #368 left to the database
alone.

## Decision

- **A season changes the road and the forage loot of a march, and
  nothing else of it** (Decision 1 of #365). The stay, the battle, the
  attack loot, the camps, the phases, the rules of the recall, the units
  away and the chronicle are those of ADR 019, ADR 020 and ADR 021.
- **A road percent per season, in content** (Decision 4; ADR 008, N5).
  `seasons.durationPercent` in `apps/api/content/fief.json` becomes a
  strict `{ build, study, train, road }` per season, every cell a whole
  percent from 1. `SeasonDurationPercentSchema`
  (`packages/contracts/src/SeasonDurationPercent.ts`), still the one
  schema `FiefContent` and `FiefOverview` share, gains `road`, so a
  missing `road` or a 0 fails the api at start-up. Shipped: `autumn.road`
  75 and every other `road` 100. Autumn, which only raised gold, gains
  something to do. `DurationPercent` in `packages/domain` gains `road`,
  and `durationPercentAt` answers `road: 100` before the epoch.
- **The forage follows the harvest, with no new content** (Decision 3).
  Each resource of a forage loot is scaled by the season's
  `multiplierPercent` for that resource, the same percent that scales the
  fief's rate of it (ADR 016). `multiplierPercentAt(instant, settings)`
  in `packages/domain/src/season/` answers the record of the season in
  force, and 100 for every resource before the epoch. With the shipped
  content, spring food 125, winter food 75 and autumn gold 125, a forage
  brings a quarter more food in spring and a quarter less in winter; gold
  is never foraged, so autumn adds nothing to a forage, and food is
  yielded on the lowlands alone, so a forage on the uplands or the ridges
  brings the same in every season.
- **Both are fixed at dispatch, with the season in force at the one
  instant the use case takes from the `Clock`, and never retimed**
  (Decision 2), as ADR 017 fixes a build, a study and a recruit order.
  `dispatchMarch` and `dispatchAttack` call `clock.now()` once and hand
  `Fief.dispatchMarch` and `Fief.dispatchAttack` a `MarchSeason {
  roadPercent, lootPercent }` from `marchSeasonAt(now, settings)`: the
  `road` of `durationPercentAt` and the record of `multiplierPercentAt`,
  read at that instant. The `Fief` reads no calendar for a march, as it
  reads none for a study or a recruit order. An instant on a boundary
  belongs to the season it starts (ADR 016). The road is stored as
  `oneWaySeconds` and the loot as `loot`, as before, so
  `marchInstantsOf`, the phases and the resolve read what is stored with
  no change of code, and a march that spans a season boundary keeps its
  road, its return and its loot: 12 infantry sent to the lowlands a
  minute before summer ends walk 600 seconds out and 600 back in autumn,
  home 8 400 seconds after they left with the 72 wood and 72 food of
  their two hours.
- **The road is one `ceil` over the kind and the season** (Default).
  `marchOneWaySeconds(from, to, units, terms, seasonRoadPercent)` answers
  `ceil(base × kindRoadPercent × seasonRoadPercent / 10 000)`: `base` the
  road of ADR 019, `kindRoadPercent` the `roadPercentOf` of ADR 021, the
  slowest kind sent, and one rounding over the product, as ADR 016 and
  ADR 017 round. With the shipped content, from 3:12 to 4:12, 600 seconds
  of base road: 12 infantry walk 600 seconds each way and 450 in autumn,
  6 riders 300 and 225. To 2:7, 900 seconds: 12 infantry and 6 riders 900
  and 675 in autumn, 6 riders alone 450 and 338 (337.5 up). A fixture
  `secondsPerPlot` of 61 over one plot, riders alone, in autumn: 23
  seconds, where a rounding per factor gives 24.
- **The forage loot is one `floor`, inside the carry share** (Default).
  `forageLootOfMilliseconds` answers, for each resource the terrain
  yields, `min(floor(heads × rate × milliseconds × percent / (3 600 000
  × 100)), floor(carryOf(units) / yielded))`, `percent` the resource's
  entry of the `LootPercent` it is handed; `forageLootOf` calls it with
  the stay in milliseconds, so dispatch and recall still share one rule
  (ADR 019 as amended). The season scales the gathering, never the
  carry: the share still binds, and gold stays 0 whatever its percent.
  With the shipped content on the lowlands: 12 infantry for two hours
  bring 72 wood and 72 food in summer and autumn, 72 and 90 in spring, 72
  and 54 in winter; 10 infantry for eight hours bring 240 and 240 in
  spring, the 300 of food held to the 240 share of a carry of 480, and
  240 wood and 180 food in winter.
- **An attack takes the season on its road and nowhere else** (Decision
  5). `Fief.dispatchAttack` times the road through the same
  `Fief.oneWaySecondsTo`, so autumn shortens the road to a camp and back,
  and the battle, fought at the arrival (ADR 020), comes sooner. `battleOf`,
  `attackLootOf` and `campStrengthAt` read no season, and #369 left
  `packages/domain/src/camp/` untouched. 10 infantry against a tier 1
  camp at 6 lose 4 and bring 96 of each of three resources in spring, in
  autumn and in winter alike: autumn's gold percent does not reach the
  hoard.
- **The march stores a loot percent per resource, never the season's
  name** (Decision 6, Default). `AwayMarch.lootPercent` is a
  `LootPercent`, a whole percent per `ResourceKind`, on both orders. It
  keeps the shape of `multiplierPercent`, gold included though gold is
  never foraged, and an attack stores the percents though no attack loot
  reads them. `Fief.recallMarch` hands `march.lootPercent` to
  `forageLootOfMilliseconds` over the whole milliseconds foraged, so the
  partial loot of a recall is scaled by the percents of the dispatch,
  whatever season the recall falls in, and the `recallMarch` use case
  reads no calendar. 12 infantry sent to the lowlands 300 seconds before
  spring ends and recalled 1 800 seconds into the stay, in summer, bring
  18 wood and 22 food (22.5 down); one infantry that left in spring,
  recalled 50 minutes into the stay, brings 2 wood and 3 food (3.125
  down, where a floor per factor gives 2). A recalled march walks back by
  the `oneWaySeconds` it stored (ADR 019 as amended), so a road fixed in
  autumn is as short on the way home in winter.
- **A stored loot percent is a whole number from 1, refused on restore.**
  `Fief.restore` refuses `InvalidLootPercent { resource, percent }`, a
  new member of `DomainError`, naming the first resource whose percent is
  fractional or below 1, after every other check of a stored march. #368
  shipped the field with the database check alone; its review asked for
  the refusal, and #369, the first ticket to read the field, added it
  under the rule that invariants are enforced in factory functions
  (`.claude/rules/architecture.md`). The refusal has no wire kind:
  `apps/api/src/http/answerRefusal.ts` answers it 500 with an empty body,
  as it answers `InvalidUnitCount`. The orchestrator amended #369's "no
  `apps` diff" criterion for that one line, since the record over the
  refusal kinds is exhaustive and the new member does not compile without
  it, and for the migration test's refusal run over the five resources
  (PR #376).
- **Persistence: five columns, migration 0020, alone in its wave** (ADR
  006). `0020_march_loot_percents` gives `fief_marches` the integer
  `loot_percent_wood`, `loot_percent_stone`, `loot_percent_iron`,
  `loot_percent_gold` and `loot_percent_food`, each `NOT NULL` under
  `fief_marches_loot_percent_<resource>_positive` (from 1). Each is added
  with `DEFAULT 100` and the default is then dropped, as 0019 did for
  `cavalry_count`, so every march stored before reads 100 with no data
  step and `save` writes all five. It adds no enum value, no table and no
  event column, and the march is still one row of the one joined read
  (N2). The road needs no column: `one_way_seconds` has held it since
  0014. The migration landed before the rule: #368 stored 100 on every
  dispatch and #369 then wrote the season's percents, so no interim
  adapter dropped a percent.
- **A march in flight at the migration, and any march sent before the
  epoch, reads 100** (Default). The shipped calendar starts on 2026-10-05
  and autumn of year 1 on 2026-10-19 (ADR 016); before the epoch
  `marchSeasonAt` answers 100 for the road and for every resource, so a
  march sent then walks and forages as ADR 019 and ADR 021 left it.
- **The wire answers the two percents the forms preview, and nothing new
  on the march** (Decision 7; ADR 010). `FiefOverview.season`
  already answered `multiplierPercent` (ADR 016), so the wire change is
  one cell: `season.durationPercent.road` (#367). `season` stays `null`
  before the epoch. `FiefOverview.march` answers the stored
  `oneWaySeconds` and `loot`, as before; `lootPercent` is not on the
  wire, no request schema changed and `ApiErrorKindSchema` gained no
  kind.
- **Screens: the map's two forms preview the season and mark the line it
  changes** (Decision 7; PR #375). `oneWaySecondsOf` scales the road by
  `season.durationPercent.road` in the one `ceil` above, 100 for `season:
  null`; the forage form and the attack form share it, and *Vuelta en*
  follows the shortened road. `marchFormOf` scales each foraged resource
  by `season.multiplierPercent` in the one `floor` above, inside the
  carry share; the attack form's battle and loot read no season.
  `PreviewLine` takes optional `marks` and `PreviewLines` draws the
  `SeasonMark` chip of ADR 016 beside the line; a line without marks
  renders as before. No design ticket (Default): the chip and the
  seasons' icons exist since S8. The road mark, *El otoño acorta el
  camino*, sits beside *Camino de ida:* on both forms while `road` is
  not 100; *Vuelta en* carries no mark of its own (Default). The loot
  mark sits beside *Botín:* on the forage form alone, one for each
  resource the terrain yields whose percent is not 100, worded as the
  resource bar's mark, *Primavera: +25 % de comida*; a resource the
  terrain does not yield is never marked (Default), so the uplands and
  the ridges show none in any season, and autumn's gold marks no form.
  Nothing is marked for `season: null`. `marchFormOf` and `attackFormOf`
  decide the marks and the Design System stays presentational. The sent
  state, the army section's march card and the chronicle carry no mark:
  Decision 7 names the forms. The preview is display, and the dispatch
  decides (N1).
- **The chronicle is unchanged** (Default; ADR 013). Its eight kinds
  stand, and `marchReturned` carries the loot as credited, with no season
  and no percent.
- **Lore first** (ADR 010, Default). The season on the road and the
  forage, the reason autumn shortens the road, the road mark, the loot
  mark and their spoken forms are proposals for the author in
  `docs/lore/world.md` (Seasons) and `docs/lore/names.md` (The seasons,
  The marches), written by #366 (PR #372) and not yet accepted;
  `apps/web/src/copy.ts` mirrors the two marks until then.
- **Nothing else changes: no winter that lengthens the road, no season
  on combat, no season on the stay, no PvP.** Every shipped `road` cell
  is 100 or below. The battle, the attack loot and the camps read no
  season. The stay is the whole hours the lord picks, 1 to
  `maxStayHours`, in every season. Every march that meets another lord
  stays in W1.

## Considered options

- **Winter lengthening the road, a season on combat, a season on the
  stay hours, PvP.** Out of scope of #365, each a future ADR or an
  amendment of this one. The schema admits a `road` above 100 (see the
  Consequences), but the slice ships none and the lore names no phrase
  for one.
- **The season in force at the arrival for the loot, or at the leave for
  the road back.** Rejected by Decision 2, as ADR 017 rejected the season
  in force when a waiting entry starts: `returnsAt` and the loot would
  stop being what the dispatch stored, the form could not preview them,
  and the resolve or `marchInstantsOf` would need the calendar to close a
  march.
- **A road that follows the season while the men walk, or a forage
  accrued piecewise over the stay**, split at every boundary as accrual
  is (ADR 016). Rejected: accrual is piecewise because a rate is derived
  on read; a road and a loot are fixed because they are stored (ADR 005,
  ADR 019). A split would buy at most a quarter of one stretch for a
  walk over every boundary on every read of a march.
- **The partial loot of a recall at the season of the recall.** Rejected
  by Decision 6: the men gathered under the terms they left with, the
  use case would read the calendar for a second instant, and a lord could
  wait for spring to recall a winter march. The stored percents make the
  recall a function of the march alone.
- **The season's name on the march**, or the instant alone, the percents
  read from content at the recall. Rejected by the Default: a content
  edit to a season's percents would revalue a march in flight, and
  `Fief.recallMarch` would need the calendar. `departedAt` is already
  stored and would have served; the percents are stored so that it does
  not have to.
- **A forage percent of its own per season**, a new record in content
  beside `multiplierPercent`. Rejected by Decision 3: the forage gleans
  the fields the season swells or strips, so the harvest's percent is the
  forage's, and one record is one thing to tune. The cost is recorded
  below: the two cannot be tuned apart.
- **A `roadPercent` outside `durationPercent`.** Rejected: the road is a
  duration fixed at an order like the other three, and a fourth cell
  reuses the schema, the start-up parse, `durationPercentAt` and the
  overview's `season` with no new shape.
- **A rounding per factor**: `ceil(ceil(base × kind / 100) × season /
  100)` for the road, `floor(floor(heads × rate × hours) × percent /
  100)` for the loot. Rejected as ADR 017 and ADR 021 rejected chained
  roundings: 24 seconds for 23, 2 food for 3.
- **Scale the carry share too, or apply the percent after the cap.**
  Rejected by the Default: the carry is what the party's backs hold in
  any season, and a spring forage that exceeded its share would break the
  cap every loot has had since ADR 019.
- **The season on the attack loot**, autumn's 125 on the hoard's gold.
  Rejected by Decision 5: the hoard is the bandits', not a harvest, and
  the battle and its loot stay the one function of the snapshot ADR 020
  fixed.
- **A column for food alone, four columns without gold, the percents on
  forage rows only, or one JSON column.** Rejected by the Default: a
  record over `ResourceKind` is built from its kinds, never from one
  resource by name, so content that moves wood in a season needs no
  migration; one shape for both orders keeps `MarchOnTheRoad` and the
  row's checks free of a rule per order; and integer columns take a check
  each, which a JSON column does not.
- **Backfill the marches in flight from `departed_at`.** Rejected: SQL
  cannot read the calendar, which is JSON content (ADR 008), and the
  migration merged before the epoch, while every percent still reads
  100.
- **The `Fief` reads the calendar** in `dispatchMarch` and
  `dispatchAttack`. Rejected as ADR 017 rejected it: the entity reads no
  catalog, and the use case already holds the one instant of the
  mutation. `MarchSeason` is the two facts the `Fief` needs.
- **Leave a stored loot percent to the database check**, as #368
  shipped it. Rejected at #369: the in-memory adapter and any fixture
  would restore a 0 or a fraction the store refuses, and the rule is that
  the factory enforces the invariant.
- **`lootPercent` on the wire, a mark on the army section's march card
  or on the sent state, a season in the chronicle line.** Left out:
  Decision 7 marks the forms, where the lord still decides; the card and
  the line answer the road and the loot already fixed. The gap is
  recorded below.
- **A design ticket, or a new chip for a line.** Rejected by the
  Default: the `SeasonMark` chip of S8 carries a season's icon and its
  words wherever it sits.
- **One ticket for the column and the rule.** Rejected by the wave plan:
  a schema change is a wave of one (ADR 006), and storing 100 first let
  the rule land in `packages/domain` alone.

## Consequences

- The docs came last, after every code ticket merged (Default), and
  describe only merged work as shipped. PRD S17 is added under Should
  have, citing this ADR; W1 is unchanged. ADR 017 is amended for the
  fourth `durationPercent` cell, ADR 019 for the season on the road and
  the forage, ADR 020 for the season on the road to a camp, and ADR 021
  for the season in the road's one `ceil`.
  ADR 016's `multiplierPercent` gains a second reader, the forage loot at
  dispatch; its rates and its accrual are untouched.
- `CONTEXT.md` rewrites **Season** (the road, the forage), **Duration**
  (the road fixed at dispatch), **March**, **Forage**, **Loot** and
  **Recall** (the percents of the dispatch).
- `packages/domain` gains `multiplierPercentAt` and `marchSeasonAt` in
  `season/`, `road` on `DurationPercent`, `LootPercent` and
  `AwayMarch.lootPercent`, `MarchSeason`, a fifth argument on
  `marchOneWaySeconds`, `forageLootOf` and `forageLootOfMilliseconds`,
  a `MarchSeason` argument on `Fief.dispatchMarch` and
  `Fief.dispatchAttack`, and the error `InvalidLootPercent`. No port
  changed; `testing/neutralSeasons.ts` holds 100 for `road`, and every
  away-march fixture carries a `lootPercent`.
- `packages/contracts` gains `road` on `SeasonDurationPercentSchema` and
  nothing else; no Spanish enters it (ADR 010).
- Postgres gains the five `loot_percent_*` columns of `fief_marches` with
  their checks (0020), in a wave of one.
- A lord is rewarded for the hour of the dispatch, as ADR 017 rewards
  the hour of the order: a march sent in the last minute of autumn rides
  home on the short road in winter, and one sent as spring ends forages
  a summer stay at spring's percent. The header's countdown tells the
  lord when the season turns.
- The carry share holds back part of spring. With the shipped content a
  party of infantry alone gathers its whole spring quarter up to a stay
  of six hours, 24 food a head against 21 at seven, and the same 24 at
  eight as in summer; riders, whose share is 60 a head, are never held.
  Winter's quarter is always felt. Tuning either is a content edit.
- One dial moves the harvest and the forage. A change to a season's
  `multiplierPercent` moves the fief's rate and the forage loot of that
  resource together; tuning them apart needs the forage percent this ADR
  rejected. With the shipped content food on the lowlands is the only
  loot a season moves.
- A preview read just before a boundary shows the old season's road and
  loot; a dispatch just after it stores the new season's. The form shows
  what the last read answered and the server's answer wins (N1).
- The season's rules are tested in `packages/domain`, on a calendar per
  test, and in `apps/web`, on a stubbed overview. The api's march tests
  run before the epoch, at 2026-09-22, so no api test sends a march in a
  season; `routes/fief.test.ts` covers the `road` percent the overview
  answers in autumn.
- Known gap: the forms' preview repeats the rules of `marchOneWaySeconds`
  and `forageLootOfMilliseconds` in the browser, season included, as it
  has repeated the road and the loot since ADR 019 and ADR 021; a change
  to one must reach the other. The `road` cell is the first
  `durationPercent` the web computes with: for build, study and train
  the overview answers the scaled durations (ADR 017), while a road
  depends on a target and a party only the form knows.
- Known gap: the attack form with `season: null` has no test of its own.
  `mapSeasonRoute.test.tsx` checks "marks nothing before the calendar
  starts" on the forage form alone; the attack form in that state was
  checked on the screenshots of PR #375.
- Known gap: the loot mark has no spoken form. It renders the resource
  bar's visible line, as the bar's mark does, and the sentence the lore
  proposes for it, *La primavera sube la comida del botín un 25 %.*, is
  not in `apps/web/src/copy.ts`.
- Known gap: the loot mark reads the season's percent, never the gain in
  the figure. 10 infantry for eight hours on the lowlands in spring read
  240 and 240 beside *Primavera: +25 % de comida*, since the share holds
  the food; whether the mark stays there is an open question of
  `docs/lore/names.md`.
- Known gap: the march stores the season's percents and no forage term.
  A recall reads the rates and the carries of the content in force at the
  recall, as it did before S17, so the snapshot is of the season alone.
- Known gap: `lootPercent` is not on the wire, so no screen can say
  which season a march away left in; the card shows the road and the loot
  the dispatch fixed. An attack stores percents nothing reads, and every
  march sent in autumn stores gold at 125 to no effect: the price of one
  shape.
- Known gap: content may ship a `road` above 100, a season that slows
  the road: the schema admits it, the road mark would show, and its
  phrase says *acorta*. ADR 017 records the same of the other cells.
- Known gap: `InvalidLootPercent` answers 500 with no wire kind. The
  database checks keep such a row out of Postgres, so the domain refusal
  stands for a store or a fixture without them.
- Known gap: the lore proposals of #366 wait for the author; until
  accepted, `apps/web/src/copy.ts` mirrors the marks.
- Out of scope of #365, each a future ADR or an amendment of this one:
  winter lengthening the road, a season on combat or on the attack loot,
  a season on the stay hours, a road or a loot that follows the season
  after dispatch, a mark on the march card or in the chronicle, PvP.
