---
status: accepted
date: 2026-10-02
---
# A second fief founded by a settler

## Context

PRD W4 kept new land out of the phase: "Multiplies every screen; after
the first fief is complete." M2 gave a player one fief at sign-up, and
every layer since assumed there was no other: `fiefs_player_unique`
allowed one row per player since migration 0001,
`FiefRepository.fiefOf(playerId)` and
`KingdomMapReader.addressOf(playerId)` found the fief by its lord, the
api served `/fief` and `/map`, the web `/`, `/mapa` and `/cronica`, and
`CONTEXT.md` read "One per player in the MVP". S18 reopens W4 one step:
a second fief. The obvious designs pull in what the earlier ADRs and the
rules ruled out: a fief that appears when a timer runs out, when no
process advances state (ADR 005, W7); a second fief read through the
same player-keyed routes with a "current fief" kept beside them, a shim
where the rule is to rebuild; a plot checked free at dispatch alone, as
ADR 019 checks a forage's, which lets a rival take it while the settler
walks; a cap written in code, when N5 and ADR 008 keep every term in
content; a Spanish name built by a domain rule, when a name the player
reads is copy (ADR 010); a unit of strength 0 handed to a battle that
divides by the strength; a line in the chronicle for the arrival alone,
when the claim on the plot starts at the dispatch; a reset of the stored
fiefs, marches and events, when a schema change is a migration. The
owner grilled and confirmed the slice on 2026-10-01 (#378), and its nine
decisions bound the tickets; the ticketing wrote nine defaults into #378
and six more into the tickets, all listed on #378, and the owner
confirmed each. This ADR records what S18 shipped, PRs #394 and
#396 to #406, the lore proposals of #379 (PR #395) and the design of
#381; where the code stands over a ticket or over the mockup it records
the code: the founding form does not block at the cap, since the cap is
not on the wire, and the map shows the api's line for it; the plot held
at the arrival is found by the new fief's `save`, not by a read; the cap
is counted without a lock; and the header's switcher takes its own row on
a phone.

## Decision

- **A lord holds at most `fiefCap` fiefs, 2 as shipped, and the second
  is founded, never taken** (Decisions 1 and 2 of #378). `fiefCap` is a
  whole count from 1 in `FiefContentSchema`, `FiefSettings.fiefCap` in
  `packages/domain`, and 2 in `apps/api/content/fief.json` (ADR 008,
  N5), so a missing cap or a 0 fails the api at start-up. Sign-up still
  gives one fief and no more: `foundFief` refuses
  `PlayerAlreadyHoldsFief` through `FiefRepository.holdsFief`, as before.
  The second fief is founded by a march of one settler to a free plot of
  the same kingdom. No fief is taken from another lord, and nothing
  travels between a lord's two fiefs.
- **The settler is the third unit kind, last in the kinds' order**
  (Decision 3). `UnitKind` is `infantry | cavalry | settler`, in
  `byUnitKind` and in the wire's `UnitKindSchema`. Its terms are content:
  1000 wood, 1000 stone, 600 iron, 100 gold and 1000 food, 7200 seconds,
  4 peasants, strength 0, carry 0, road 100 and barracks 5.
  `UnitTermsSchema` and the overview's `UnitStatsSchema` now take
  `strength` and `carry` as whole counts from 0; `durationSeconds`,
  `peasantOccupancy`, `roadPercent` and `barracksLevel` stay from 1. It
  is recruited through the recruit slot of ADR 018 like any kind:
  `Fief.placeRecruitOrder` refuses `BarracksTooLow { unit: 'settler',
  requiredBarracksLevel: 5, barracksLevel }` at built barracks 1 to 4,
  after `BarracksNotBuilt` at 0: the gate of ADR 021 with the settler's
  level. The order occupies 4
  peasants a settler from the instant it is placed. With the shipped
  content `deriveUnitDurationSeconds` trains a settler in 1 200 seconds
  at barracks 5, 900 ordered in a spring that trains at 75 %, and 1 029
  at barracks 6 (7 200 / 7 = 1 028.57 up). Its chronicle line is the
  `recruitsDelivered` of any order.
- **A settler never forages and never attacks.** `refuseUnfitUnits`
  (`packages/domain/src/march/`) refuses `UnitUnfitForOrder { unit:
  'settler', order }`, a new member of `DomainError`, for a party that
  holds a settler; `Fief.roomForMarch` and `Fief.roomForAttack` run it
  right after `refuseInvalidParty` and before every other check, writing
  nothing, so no forage loot, no battle and no attack loot is computed
  over a settler. It answers 409 with its kind in `ApiErrorKindSchema`.
  `battleOf` also skips a kind the party holds none of: with a strength
  of 0 in the terms, `ceil(rest / sₖ)` over a kind at 0 was 0 / 0 for
  every winning party, a settler in it or not (PR #397).
- **The founding is the third march order: one settler, alone, to a
  free plot with no camp** (Decision 4). `AwayMarch` gains
  `FoundingMarch`: `order: 'found'`, `name`, the new fief's name,
  `units` exactly `foundingParty` (1 settler and 0 of every other kind),
  `stayHours` 0, a `loot` of 0 and the season's `lootPercent`, stored to
  keep the one shape of ADR 022, to no effect on a loot of 0. It holds the
  fief's one march slot (ADR 019) until it founds or comes home.
  `Fief.restore` refuses a stored founding whose stay is not 0
  (`StayOutOfRange`) or whose party is not one settler alone
  (`InvalidUnitCount`). The road is
  the `marchOneWaySeconds` of every march, over the settler's road
  percent, 100, and the season's road percent at dispatch (ADR 022),
  fixed at dispatch and stored as `oneWaySeconds`: from 3:12 to 2:7, 900
  seconds, and 675 sent in an autumn of 75 %.
- **`dispatchFounding` refuses in one order, writing nothing.** The use
  case `dispatchFounding({ playerId, fiefId, province, plot, name })`
  refuses `FiefNotFound`, `BlankFiefName`, `MarchSlotBusy`,
  `FiefCapReached { cap }`, `MarchTargetOutOfBounds`, `MarchToOwnPlot`,
  `PlotHeld`, `PlotReserved { province, plot }`, `PlotHasCamp` and last
  `NotEnoughUnitsAtHome { unit: 'settler', count: 1, atHome }`.
  `FiefCapReached` and `PlotReserved` are new members of `DomainError`,
  each answered 409. It reads `clock.now()` once, hands
  `Fief.dispatchFounding` the `MarchSeason` of that instant, saves the
  fief and records the event below. No stock is debited and no count
  changes: the settler away is still counted and keeps its 4 peasants.
- **The cap counts the fiefs held and the foundings on the road**
  (Default). `FiefCapReached` is refused when
  `fiefsOf(playerId).length + foundingsOnTheRoadOf(playerId)` is at or
  above `fiefCap`; `FiefRepository.foundingsOnTheRoadOf` counts the
  lord's founding marches neither recalled nor applied. With the shipped
  cap and one march slot per fief, a lord of one fief with a founding on
  the road is answered `MarchSlotBusy` first, so `FiefCapReached` is
  read by a lord of two fiefs and by no one else.
- **The new fief's name travels in the request** (Default; ADR 010).
  `DispatchFoundingRequestSchema` is a strict `{ province, plot, name }`.
  `FiefName.create` trims it and refuses a name of blanks alone as
  `BlankFiefName`, the rule of sign-up; an empty one fails the request
  schema first, 400 `MalformedRequest`. The march stores it. The name
  the form
  proposes, the origin's name and the terrain of the target province as
  a surname, is built by `copy.founding.proposedName` in
  `apps/web/src/copy.ts`, and the lord may type any other. No Spanish
  rule lives in the domain or on the wire.
- **The plot is reserved from the dispatch until the founding is
  recalled or applied** (Decision 9). A reservation is a founding march
  with no `recalledAt` still stored on its fief; nothing else is stored
  for it. `KingdomMapReader.reservationsIn(kingdom, province)` answers
  each as `{ plot, playerId }`, the kingdom being the sending fief's.
  `refuseUnreachableTarget`, the one function a forage, an attack and a
  founding share, refuses in order `MarchTargetOutOfBounds`,
  `MarchToOwnPlot`, `PlotHeld` and then `PlotReserved`, whoever reserved
  it. `FiefRepository.occupiedPlots()` answers the held plots and the
  reserved ones, so sign-up's `lowestFreeCoordinates` never places a new
  lord on a reserved plot. A recall lifts the reservation at the instant
  of the recall, not of the return. Two foundings that race past the
  read are stopped by the store: the partial unique index of migration
  0022, whose violation `save` answers as `PlotReserved`.
- **A march to any fief of the sending lord is `MarchToOwnPlot`**
  (Decision 8). `refuseUnreachableTarget` compares the holder's
  `playerId` with the sending fief's, where it compared the sending
  fief's plot alone, so a forage or an attack sent to either of the
  lord's fiefs, from either, is refused before `PlotHeld`; a founding
  from a lord of two fiefs is answered `FiefCapReached` before its
  target is read. There is no transport between a lord's own fiefs.
- **The fief is founded at the arrival, on read** (Decisions 1, 4 and 6,
  Default; ADR 005). `resolveUpgrade` takes `ids` (`IdGenerator`). For a
  founding not recalled whose `arrivesAt` is at or before `now`, it
  builds the new fief with `fiefFoundedBy`, `Fief.found` with a new id,
  the origin's `playerId` and kingdom, the march's name, province and
  plot, the content's `startingStocks` and `at = arrivesAt`, and saves
  it before the walk. The walk then applies `Fief.completeFounding` at
  `arrivesAt`, a sixth finish beside the five of ADR 020: an open
  recruit order is settled as at a battle, the settler leaves the
  origin's count and frees its 4 peasants by derivation, the march slot
  idles and `storedAt = arrivesAt`. Finishes of one instant apply the
  upgrade first, then the study, the recruit order, the battle, the
  founding and the march's return. The founding is applied by the next
  read of the fief the settler left, or by its next accepted mutation,
  since a refused mutation rolls back the resolve it ran; at the shipped
  cap that fief is the lord's only one. No timer and no job founds it,
  and a read before the arrival changes nothing. `hasChanged` is true after
  it.
- **The new fief starts as a first fief does, and arts stay per fief**
  (Decisions 5 and 6). It holds the M2 starting stocks, 500 wood, 500
  stone, 200 iron, 50 gold and 300 food, every building at level 0, no
  unit, no art, an idle build slot, study slot, recruit slot and march
  slot, and it accrues from the arrival instant, not from the read that
  applied it. Its terrain is its province's (ADR 014). Nothing of the
  origin crosses over: not its arts, its units, its stocks or its queue.
- **A plot held at the arrival founds nothing and turns the settler
  home** (Default, #387). When the new fief's `save` answers
  `CoordinatesTaken`, which only a sign-up that read its plots just
  before the dispatch can cause, `Fief.turnFoundingHome` stores
  `recalledAt = arrivesAt` on the march before the walk: the settler
  walks the whole road back, returns as a recalled march and is kept.
  `Fief.restore` accepts a founding's `recalledAt` equal to its arrival
  and refuses a later one; a forage's or an attack's `recalledAt` at its
  `leavesAt` is still refused. The check is the insert meeting
  `fiefs_coordinates_unique`, not a read before it, so it has no
  read-then-write race (PR #401).
- **A founding is recalled as any march, and the settler is kept**
  (Default; ADR 019 as amended). `Fief.recallMarch` recalls it outbound
  alone, since its stay is 0: at or after the arrival the method
  answers `MarchAlreadyReturning`. Through the api the resolve runs
  first and has founded the fief by then, so a recall past the arrival
  finds the slot idle and answers `MarchNotFound`; `MarchAlreadyReturning`
  is read for a founding turned home. The settler walks back as long as
  it walked,
  brings no loot, stays counted with its peasants held throughout, and
  can be sent again. Sent from 3:12 to 2:7 and recalled 600 seconds out,
  it is home 600 seconds later.
- **The chronicle gains two kinds, ten in all, and the first written at
  a dispatch** (Default; ADR 013). `FiefEvent` gains `foundingSent` and
  `fiefFounded`, each `{ province, plot, name, occurredAt }`, `name` the
  new fief's. `dispatchFounding` takes `chronicle` and records one
  `foundingSent` on the origin at the dispatch instant, after
  `fiefs.save`; a refusal records nothing. The resolve answers one
  `fiefFounded` stamped with `arrivesAt` among the origin's events, in
  walk order, and records the same event on the new fief's id, its
  first. A founding recalled, or turned home at a held plot, writes the
  `marchReturned` of its return, `recalled` true, and no `fiefFounded`;
  its `foundingSent` stays. Every event is still written in the
  transaction that applies it.
- **Every fief is read and changed by its id** (Decision 7; PRs #394 and
  #396). `FiefRepository` is `occupiedPlots()`, `holdsFief(playerId)`,
  `fiefsOf(playerId)`, the ids of the lord's fiefs by province then
  plot, `foundingsOnTheRoadOf(playerId)`, `fiefOf(fiefId)` and `save`;
  `KingdomMapReader.addressOf` takes a `FiefId` and answers the address
  with its holder. Every use case command that names a fief carries
  `fiefId` beside `playerId` (`FiefOfPlayer`), `resolveUpgrade`
  included, and opens with `ownFiefOf`, `readProvinceMap` with the same
  check on the address: an unknown fief and another lord's both answer
  `FiefNotFound { fiefId }`, before any other refusal, writing nothing.
  The api's row lock is on the fief's row, `fiefOf` filtering by
  `fiefs.id` under `FOR UPDATE OF fiefs` inside a transaction (N4).
- **The api serves `/fiefs` and nothing beside it** (Decision 7).
  `GET /fiefs` lists the lord's fiefs; `GET /fiefs/:fiefId` and
  `GET /fiefs/:fiefId/events` read one; the mutations sit under
  `/fiefs/:fiefId/upgrades`, `/studies`, `/recruit-orders` and
  `/marches`, with `POST /fiefs/:fiefId/marches/found` for the founding;
  `GET /fiefs/:fiefId/map` and `/map/:province` read the map from that
  fief. `requireNamedFief` parses the path with `FiefRequestSchema`: an
  id that is not a uuid answers 400 `MalformedRequest` with an empty
  body, and an unknown id or another lord's 404 `FiefNotFound`, one
  answer for both. `/fief` and `/map` are gone, with the interim lookup
  of #380 (`requireSoleFief`): rebuild, never adapt. A fief read with
  nothing to resolve is still one round trip to the store (N2).
- **`GET /fiefs` resolves each fief and lists what the resolve founded.**
  `fiefListOf` reads `fiefsOf`, resolves each fief as a fief read does,
  reads `fiefsOf` again and resolves the ids the first read lacked, so a
  fief founded by that same request is in its answer. `FiefListSchema`
  is a strict `{ fiefs }`, each a strict `{ id, name, coordinates }`,
  ordered by province then plot.
- **The web reads each fief at its own URL** (Decision 7). The screens
  live at `/feudo/$fiefId`, `/feudo/$fiefId/mapa`,
  `/feudo/$fiefId/mapa/$province` and `/feudo/$fiefId/cronica`, under
  one layout that shows the `FiefNotFound` line for an id that is not a
  uuid; `/` redirects to the first fief of `GET /fiefs`, so sign-up and
  sign-in land there. `/mapa` and `/cronica` are gone. Every `ApiClient`
  method that reads or changes a fief takes its `fiefId` first. The
  segment `feudo` is a lore proposal (#379).
- **Persistence: four migrations, each alone in its wave** (ADR 006).
  0021 adds `settler` to the enum `unit`, a `settler_count` to
  `fief_marches`, added with `DEFAULT 0` and the default then dropped,
  as 0019 did for `cavalry_count`, and a nullable `settler_count` to
  `fief_events`, 0 on every row with unit counts; the checks that sum
  the counts include it. 0022 adds `found` to `march_order`, a nullable
  `founding_name` to `fief_marches`, replaces `fief_marches_order_terms`
  (a founding holds stay 0, no camp, not fought, a name, 1 settler and
  no other unit; a forage and an attack hold no name) and creates the
  partial unique index `fief_marches_founding_plot_unique` on
  `(province, plot) WHERE founding_name IS NOT NULL AND recalled_at IS
  NULL`. 0023 drops `fiefs_player_unique` and adds the plain
  `fiefs_player_id_index`; nothing in the schema stops two fiefs for
  one player any more, and `fiefs_coordinates_unique` still stops two
  on one plot. 0024 adds `founding_sent` and `fief_founded` to
  `fief_event_kind` and a nullable `fief_name` to `fief_events`,
  rewrites `fief_events_one_subject` to count `fief_name` as a subject
  that carries `province` and `plot`, and adds
  `fief_events_founding_name`. No migration uses a new enum value as a
  value: every check compares `::text`, and the index predicate reads
  `founding_name`, since an index predicate must be immutable and
  `march_order::text` is not (ADR 019 as amended, ADR 021). No table is
  added: a march is still one row keyed by its fief, so every fief,
  march and event stored before reads as before.
- **The wire names each fief and never a player** (ADR 010, ADR 014).
  `FiefOverview` gains `id`; `FiefOverview.march` gains the `found`
  variant with its `name`, `stayHours` 0, `camp: null` and `fought:
  false`; `unitTerms` and `recruitTerms` answer the three kinds;
  `FiefEventSchema` gains `foundingSent` and `fiefFounded`, each a
  strict `{ kind, province, plot, name, occurredAt }`; `ApiErrorKindSchema`
  gains `UnitUnfitForOrder`, `FiefCapReached` and `PlotReserved`.
  `fiefCap` is in `FiefContentSchema` alone: no response carries it, and
  `ApiError` has no slot for the refusal's `cap`. Each wire change
  crossed the contracts, the api and the web in one PR.
- **The map shows a reservation and marks every own fief** (Decision 9;
  ADR 014). `readProvinceMap` answers each plot's `reservation`: `{
  isOwn }` on a free plot `reservationsIn` lists, `isOwn` true for the
  viewer's own founding, and nothing on a held plot. A reserved plot
  answers no camp. The wire plot is a strict `{ plot, fief, camp,
  reservation }`, `reservation` null or a strict `{ isOwn }`: the founder
  is never named and no player id crosses the wire. Every fief of the
  viewer is `isOwn`. The map read is five reads on the pool, lock-free,
  resolving nothing: the address, the last held province, the holders,
  the reservations and the camps' last battles.
- **Screens** (#381; PRs #400 and #403 to #406). `SettlerIcon`, a
  loaded cart on its wheel, the shaft forward, hand-drawn in a 24 px box
  with a 1.75 px stroke in the current ink, joins the Design System
  (`docs/art/art-bible.md`, UI icons). The army section draws the
  settler's card third, locked below built barracks 5 in the lines of
  the rider's lock and open from it; the card says nothing of strength
  or carry. The map's forage and attack forms hold no settler field:
  `partyKinds` (`apps/web/src/units/partyKinds.ts`) names once the kinds
  those two orders carry, and their requests still send `settler: 0`. A
  free plot with no camp and no reservation carries *Fundar un feudo*
  beside *Enviar una marcha*, whether or not a settler is at home. The
  founding form holds the name field, prefilled, and previews *Camino de
  ida* and *Llegada en* through the `oneWaySecondsOf` the other forms
  use, with the autumn mark of ADR 022; it is blocked, in this order, by
  a march away, a blank name and no settler at home. After an accepted
  founding the map reads the province again, so the plot reads
  *reservada · Tu fundación*. A reserved plot is a dashed tile with the
  settler's icon and *reservada*, the founder's with the marker *Tu
  fundación*, and no action for anyone; both own fiefs read *Tu feudo*
  and no plot carries `aria-current`. The march card reads a founding
  with *Nuevo feudo:* and *Llegada en*, with its recall, and the fief
  screen re-reads at the arrival. The header's `FiefSwitcher`, *Tus
  feudos*, lists the lord's fiefs as links in the order `GET /fiefs`
  answers, the current one marked by a frame, a rail, bold and
  `aria-current`; choosing the other keeps the screen, the fief, its map
  or its chronicle. `useFiefList` reads the list on mount and on each
  navigation, never on a timer (M8). The chronicle reads *Fundación
  enviada:* and *Feudo fundado:* with the fief's name and its plot. The
  mockup stands at version 23 and the Design System at 19.
- **Lore first** (ADR 010). The settler and its label, *colono*, the
  founding's lines, the proposed name, the reserved plot, the switcher,
  the URL segment, the refusals and the chronicle lines are proposals
  for the author in `docs/lore/world.md`, `docs/lore/names.md` and
  `docs/lore/chronicle.md` (#379, PR #395); `apps/web/src/copy.ts` and
  `apps/api/src/http/answerRefusal.ts` mirror them until accepted.
- **Nothing else changes: no transport, no third fief, no other
  kingdom, no taking a plot, no PvP.** Nothing moves between a lord's
  fiefs, neither stocks nor units. The cap is 2. A founding goes to a
  free plot of the sending fief's kingdom, and only kingdom 1 exists
  (ADR 014). No held plot changes hands, and no march meets another
  lord (W1). A fief is not renamed, and the settler has no generated
  image (S4). The forage, the attack, the battle, the camps, the seasons
  and the recall's rules are those of ADR 019 to ADR 022.

## Considered options

- **Transport between a lord's fiefs, more than two fiefs, another
  kingdom, taking a held plot, PvP, renaming a fief, an image for the
  settler.** Out of scope of #378: one more fief is enough to make
  every route and screen name its fief, and each of these is a slice of
  its own.
- **A timer, or a job, that founds the fief when the settler arrives.**
  Rejected by ADR 005 and W7: the arrival is a finish like a battle's,
  applied by the read that follows it, and the api still idles with no
  process of its own (N2). The cost is recorded below: a reservation
  outlives its arrival until its lord reads.
- **A "current fief" behind the player-keyed routes, or `/fief` and
  `/map` kept beside `/fiefs/:fiefId`.** Rejected by Decision 7 and the
  rule to rebuild: the interim `fiefsOf(playerId)[0]` of #380 lived for
  one wave and #382 deleted it. An id in the path makes each request
  name its fief, and a URL can be opened, shared and switched.
- **A plot checked free at dispatch and not reserved**, as ADR 019
  leaves a forage's. Rejected by Decision 9: a forage that finds its
  plot founded on loses nothing, while a settler that finds its plot
  taken has spent its road. The reservation closes the plot to marches
  and to sign-up; the turn home covers the one race left.
- **A table of reservations.** Not needed: the founding march's row is
  the reservation, so the recall and the arrival free the plot with no
  second write, and one partial index over `fief_marches` enforces it.
- **The index predicate on `march_order = 'found'`.** Rejected by
  Postgres: the value cannot be used in the transaction that adds it,
  and a predicate over `march_order::text` is not immutable (#384). The
  predicate reads `founding_name`, non-null exactly on a founding.
- **A strength and a carry from 1 for every kind, the settler told
  apart some other way.** Rejected by Decision 3: 0 is what a settler
  is worth in a fight and on the way home. A party with a settler is
  refused before any battle or loot is computed, and `battleOf` skips a
  kind with no unit.
- **A settler field on the forage and attack forms, refused by the
  server.** Shipped as an interim (#383) and removed (#385): a field
  that can only be refused is not offered. `partyKinds` is the one
  place that names which kinds those orders carry.
- **A founding party of several settlers, or a settler with an
  escort.** Rejected by Decision 4: exactly one settler, alone. The
  party is a constant, the form needs no count, and the store checks it.
- **A founding sent to a camp's plot, erasing the camp as a first fief
  does** (ADR 020). Rejected by Decision 4: a founding goes to a plot
  with no camp. Sign-up still takes the lowest free plot, camp or not.
- **The settler taken out of the count at dispatch.** Rejected by the
  Defaults: it occupies its peasants until it founds, as every unit
  away does (ADR 019), and a recalled settler is kept (S14). The count
  and the peasants change at the arrival alone.
- **A cap that counts only the fiefs held.** Rejected by the Default:
  the foundings on the road count, so a higher cap could not be passed
  by sending two settlers at once. At the shipped cap the march slot
  already forbids it.
- **A lock on the lord's other fiefs for the cap count.** Left out (PR
  #398): the count is lock-free so a dispatch never locks a fief it
  does not change. It is safe at a cap of 2; the gap is recorded below.
- **A read of the plot's holder before the founding at the arrival.**
  Rejected by the code (PR #401): the insert meets
  `fiefs_coordinates_unique` inside a savepoint, so the resolve
  survives the conflict and no read can go stale before the write.
- **A settler lost, or a refusal of the read, when the plot is held at
  the arrival.** Rejected by the Default: the march turns home as if
  recalled at its arrival, the settler kept. A read that failed would
  block the origin fief for good.
- **The new fief named by a rule in the domain.** Rejected at the
  ticketing (the wave plan of #378): a rule that builds a Spanish name
  would put copy in the domain against ADR 010. The request carries the
  finished name, as sign-up's does.
- **Arts shared by a lord's fiefs, or a new fief that starts with
  buildings, units or the settler's cost.** Rejected by Decisions 5 and
  6: each fief studies its own arts, and the new one starts as a
  sign-up's does, through the same `Fief.found`.
- **The founder named on a reserved plot, or a player id on the wire.**
  Rejected as ADR 014 rejected it for a holder: the map answers `{
  isOwn }` and no more, and the contract refuses a reservation with a
  player id.
- **403 for another lord's fief.** Rejected by the Default: an unknown
  id and another lord's answer the same 404, so an id tells a caller
  nothing of a fief that is not theirs.
- **No event at the dispatch**, the chronicle recording endings and
  never orders (ADR 013). Rejected by the Default: the dispatch claims
  a plot of the kingdom, and `foundingSent` is the record of that
  claim. A forage and an attack still write nothing when they leave.
- **`fiefCap` on the overview or the fief list, or slots on `ApiError`
  for the refusal's `cap`.** Left out (#390, PR #404): the web ticket
  was not to change `packages`, so the map reads `FiefCapReached` by
  the `message` the api builds from the refusal's `cap`. The gap is
  recorded below.
- **One migration for the kind, the order, the index and the events.**
  Rejected by the wave plan: `storedUnits` is exhaustive over
  `UnitKind`, so the enum value landed with the kind (#383), the order
  with its march (#384), the dropped index with the founding (#387) and
  the event kinds with the events (#388), each a wave of one.
- **A switcher that opens as a menu.** Rejected at the design (#381):
  with a cap of 2 both entries stay in view as links and one tap
  switches.

## Consequences

- The docs came last, after every code ticket merged, and describe only
  merged work as shipped. PRD M2 still gives one fief at sign-up and
  cites this ADR for the second; W4 is amended: ADR 023 admits a second
  fief, founded by a settler, while transport and more fiefs stay out;
  S18 is added under Should have. ADR 013 is amended for the two event
  kinds and the first event at a dispatch, ADR 014 for the reservation,
  the reserved plot sign-up skips, the own fiefs and the third order of
  the map, ADR 018 for the third kind at barracks 5, ADR 019 for the
  founding order, its reservation and `MarchToOwnPlot` for any own
  fief, and ADR 021 for a kind of strength 0 and carry 0, refused on a
  forage or an attack.
- `CONTEXT.md` rewrites **Fief** (at most two per lord) and **New land**
  (the founding), names the settler in **Unit** and the founding order
  in **March**, defines a **reserved** plot under **Plot**, and adjusts
  **Player**, **Coordinates**, **Kingdom map**, **Resolve**, **Party**,
  **Recall**, **Camp**, **Strength**, **Chronicle**, **Event** and the
  avoided words.
- `packages/domain` gains `FoundingMarch`, `foundingParty`,
  `refuseUnfitUnits`, `fiefFoundedBy`, `ownFiefOf`, `FiefOfPlayer`,
  `Fief.roomForFounding`, `Fief.dispatchFounding`,
  `Fief.completeFounding`, `Fief.turnFoundingHome`, the use case
  `dispatchFounding`, `FiefSettings.fiefCap`, the port methods
  `fiefsOf`, `foundingsOnTheRoadOf` and `reservationsIn`,
  `ProvincePlot.reservation`, the events `foundingSent` and
  `fiefFounded` and the errors `UnitUnfitForOrder`, `FiefCapReached`
  and `PlotReserved`; `FiefNotFound` carries `fiefId` in place of
  `playerId`, and `resolveUpgrade` takes `ids`.
- `packages/contracts` gains `settler` on `UnitKindSchema`,
  `FiefListSchema`, `FiefRequestSchema`, `DispatchFoundingRequestSchema`,
  `fiefCap` on `FiefContentSchema`, `id` and the `found` march on
  `FiefOverviewSchema`, `reservation` on the map's plot, the two events
  and the three refusals; no Spanish enters it (ADR 010).
- Postgres gains `settler` in `unit` and the `settler_count` columns
  (0021), `found` in `march_order`, `founding_name` and the reservation
  index (0022), `fiefs_player_id_index` in place of
  `fiefs_player_unique` (0023), and the two event kinds with
  `fief_name` (0024), each in a wave of one.
- A read of one fief can now write another: the resolve of the origin
  inserts the new fief's row and its first event in the origin's
  transaction (N4). Nothing scans the fiefs; the founding rides the
  march of the fief being read (ADR 005).
- A founding is the first plot a lord chooses, and it can open a
  province. The target is bounded as every march's, by the last held
  province plus one, and a reservation does not move that bound; a fief
  founded on the empty province does, from the read that applies its
  arrival.
- With the shipped content a settler costs 3 700 resources and 4
  peasants against the rider's 170 and 2, and its 7 200 content seconds
  are twenty-four times the rider's 300. The new fief opens with the
  1 550 of a first fief, so the cost is the price of the plot and of a
  second set of slots, never recovered in stocks. Tuning it is a
  content edit.
- The two fiefs share nothing but their lord: each has its own build
  slot and queue, study slot, recruit slot and march slot, its own arts
  and its own chronicle. A lord of two fiefs sends two marches at once,
  one from each.
- `fiefCap` is content, but a cap above 2 is not a content edit alone:
  the two gaps below on the cap count and on the lock stand in its way,
  and the lore, the switcher's layout and the web's fallback line are
  written for two.
- Known gap: a reservation outlives its arrival until a read of the
  fief the settler left applies it (ADR 005). Until then the map shows
  the plot reserved to every other lord, marches to it are refused
  `PlotReserved` and sign-up skips it; a lord who never returns holds
  the plot reserved, with no fief on it.
- Known gap: a sign-up that reads its plots just before a founding is
  dispatched to the lowest free plot can still take it. The founding
  then turns home at its arrival, the settler kept and the road spent.
- Known gap: the cap check in `dispatchFounding` reads `fiefsOf` and
  `foundingsOnTheRoadOf` without a lock across the lord's fiefs (PR
  #398). At a `fiefCap` of 2 it is safe: one fief means one march slot
  under `FOR UPDATE`, and two fiefs are already at the cap. A cap above
  2 needs a lock on the player.
- Known gap: `fief_marches_founding_plot_unique` is on `(province,
  plot)` with no kingdom, and the memory adapter copies it, while
  `reservationsIn` filters by the sending fief's kingdom and
  `occupiedPlots` answers each reservation under it (PR #399). A second
  kingdom needs the kingdom in the index. A dispatch also reads the
  holders and the reservations in two lock-free queries; N2 binds a fief
  read, not a dispatch.
- Known gap: `GET /fiefs` runs one resolve per fief and reads `fiefsOf`
  again after them on every request (PR #401); N2's one round trip
  binds a fief read, not the list. The new fief is saved before the
  walk: Postgres rolls it back with the transaction if the walk fails,
  and the in-memory test double does not.
- Known gap: `fiefCap` and the refusal's `cap` do not cross the wire
  (PR #404). The map therefore shows the api's `FiefCapReached` line by
  its `message`, the one refusal a screen reads that way, and the
  founding form cannot block at the cap before sending, as the mockup
  of #381 drew it: a lord of two fiefs learns it from the server. The
  web's own line for that kind writes the shipped 2 and no screen shows
  it.
- Known gap: the founding form's preview repeats `marchOneWaySeconds`
  in the browser, as the other forms have since ADR 019, and reads the
  season and the settlers at home as the last read answered them; the
  server's answer wins (N1).
- Known gap: the web's `BarracksTooLow` line in `copy.refusals` names
  no level and no unit and is not in the lore, since `ApiError` carries
  no slots (PR #397); the army section builds the slotted line from the
  refused order and `unitTerms`, and the api's from the refusal. This
  closes the static *nivel 3* and *los jinetes* gap of ADR 021.
- Known gap: the shared contract suites of the api's adapters hold no
  accented fief name since PR #406; accented names still round-trip
  through Postgres in the route and migration tests.
- Known gap: a fief founded while a screen stays open joins the
  switcher on the next navigation or reload (#391), since the header
  reads no timer. Switching from a numbered province opens the other
  fief's own province, not the same one. The current entry carries
  `aria-current="page"`, the value the router sets, where the design
  wrote `true`. `useLiveFief` keeps the last overview it read when the
  `fiefId` changes under it: the fief left shows until a read of the new
  one answers, and stays while that read is refused (PR #396).
- Known gap: on a phone the switcher takes its own row between the
  title and the navigation, a deviation from #381's "fits beside"
  accepted at the design review.
- Known gap: the domain's in-memory `FiefRepository` does not refuse
  `PlotReserved`; the api's two adapters do, under their contract suite
  (PR #398).
- Known gap: a founding stores the season's `lootPercent` to no effect,
  as an attack does: the price of one shape (ADR 022).
- Known gap: the lore proposals of #379 wait for the author; until
  accepted, `apps/web/src/copy.ts` and `answerRefusal.ts` mirror them.
  The name the form proposes doubles its surname when the fief the
  settler leaves already carries it, an open question of
  `docs/lore/names.md`.
- Out of scope of #378, each a future ADR or an amendment of this one:
  transport between a lord's fiefs, more than two fiefs, another
  kingdom, taking a held plot, PvP, renaming a fief, an image for the
  settler.
