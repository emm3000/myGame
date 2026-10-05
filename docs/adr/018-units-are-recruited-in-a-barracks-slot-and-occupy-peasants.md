---
status: accepted
date: 2026-09-29
---
# Units are recruited in a barracks slot and occupy peasants

## Context

PRD W1 kept units, armies, marches and combat out of the phase: a second
game system, to come after the economy is fun on its own. The economy now
has its seven buildings, its arts, its seasons and its chronicle, and the
lore has always said what a unit is: every unit is a hand taken from the
fields (`docs/lore/world.md`, Where resources come from). S10 reopens W1
for recruiting only. The obvious designs pull in what the earlier ADRs
ruled out: a population that units are drawn from and that eats stored
food (ADR 007 made peasants derived and food a plain stock, W9 keeps famine
out); a training queue that is one more kind of entry for the build slot
(ADR 012 gave the library a slot of its own for the same reason); a row per
unit with its own finish, or a job that delivers units as their time comes
(ADR 005 derives every amount on read, N2 forbids the timer); a chronicle
line per unit delivered (ADR 013 caps the roll at 100 events). The owner
grilled the slice on 2026-09-29 (#209), took the recommended option on every
question, and its twelve decisions bound the tickets; the ticketing found
four points the decisions left open and the owner confirmed the default of
each. This ADR records what S10 shipped, PRs #222 to #228, and where the
code corrected a decision it records the code: the barracks is the seventh
building, not the sixth, and its level lives in `fief_buildings`, not on the
fief row. The screen (#219) is recorded as Decision 10 fixes it and the
mockup of #213 draws it.

## Decision

- **A unit is a stored count per kind on the fief.** `Fief` carries
  `units`, a `FiefUnitCounts` with every kind at 0 on founding, restored
  through its invariant factory or refused `InvalidUnitCount` for a negative
  or fractional count. One kind in this slice, `infantry`; archers, cavalry
  and rams are content of a later slice. Content gives each kind, in the
  `units` record of `apps/api/content/fief.json` parsed by
  `FiefContentSchema` and handed to the domain in `FiefSettings` (ADR 008,
  N5), a `cost` in the five resources, a `durationSeconds` and a
  `peasantOccupancy`, the last two whole counts from 1; a missing kind, a
  missing field or a 0 fails the api at start-up. The shipped infantry costs
  20 wood, 10 iron and 30 food, trains in 90 seconds and occupies 1 peasant.
- **Each unit occupies peasants, as a building level does, and eats
  nothing.** `derivePeasantCounts` adds each kind's count times its
  `peasantOccupancy` to the occupied peasants beside the building levels, so
  the army is bounded by the free peasants and every reader of the trio, the
  overview, the enqueue, the queue's revalidation and the cascade cancel,
  sees it (ADR 007). Food is spent only as a cost: no upkeep, no negative
  rate, no change to accrual (ADR 005, W9).
- **The barracks is the seventh building**, `barracks` in `BuildingKind`
  and in the Postgres enum `building` (migration 0011), upgraded through the
  build slot and the build queue like the other six, with a cost, a duration
  and an occupancy per level in `apps/api/content/barracks.json` (levels 1
  to 10 from 200 wood, 120 stone, 60 iron, 360 seconds and 1 peasant) and no
  effect of its own. Its level is one more row of `fief_buildings`, where
  every building level lives since migration 0007. The library is the sixth
  building (ADR 012), so #209's "sixth" was a miscount and Decision 8's "one
  more level on the fief row" named the wrong table; the code stands.
- **The built barracks level, never the projected one, gates and divides
  recruiting.** An order is refused `BarracksNotBuilt` while the built
  barracks is at 0, and each unit of an order takes
  `deriveUnitDurationSeconds(durationSeconds, barracksLevel)`, which is
  `ceil(durationSeconds / (1 + barracksLevel))`: one division, one `ceil`,
  the content seconds divided by one plus the built barracks level, as the
  library divides a study (ADR 012). 90 seconds at barracks 1 is 45, at
  barracks 2 is 30. No season on recruiting in this slice: as S10 shipped
  it, the function read no `durationPercent` (ADR 017), and a barracks
  finished while an order runs shortens nothing. S12 lifts the season
  (ADR 017 as amended).
- **The barracks has a recruit slot: one order at a time, no queue.** `Fief`
  carries `recruitOrder`, idle on founding, or open with its `unit`, its
  `count`, the `cost` it debited, its `perUnitSeconds` and its `startedAt`.
  `Fief.placeRecruitOrder` is the only way an order opens: it refuses
  `InvalidUnitCount` (a count below 1 or fractional), then
  `BarracksNotBuilt`, then `RecruitSlotBusy` while an order is open, then
  `InsufficientResources` with the missing amounts; it debits `count` times
  the unit's cost at `now`, stores that cost on the order and fixes
  `perUnitSeconds` and `startedAt = now`. The build slot, the build queue
  and the study slot are untouched by an order, and an order by them: a
  fief recruits while both are busy.
- **N is bounded by the lowest free count across the build schedule.**
  The use case `placeRecruitOrder` refuses `NotEnoughPeasants` when
  `count` times the unit's occupancy exceeds that count. The first bound
  was `min(free, projectedFree)`. Decision 4 said "the free peasants" and
  the overview has two counts: an order bounded by the built free alone can
  drive the projected trio negative (a waiting upgrade's increase), one
  bounded by the projected free alone can drive the built trio negative (a
  queued farm's supply), and `derivePeasantCounts` answers
  `NegativeFreePeasants` for either (M7). The owner confirmed the lesser on
  2026-09-29. Amended by #339: the two ends are not enough, since a busy
  upgrade that lands before a queued farm leaves a trough between them (an
  order sized to both ends drove the built trio negative and `GET /fief`
  answered 500 until the farm landed), so `deriveLowestFreePeasants`
  bounds N by the lowest free count across the built levels and every step
  of the slot and the queue in order; the built and the projected free are
  its first and last steps.
- **The order's occupancy is charged when it is placed and moves into the
  units at the close, with no change to the occupied total.**
  `derivePeasantCounts` counts an open order's `count` times its occupancy
  as occupied from the instant it is placed, delivered or not; when the
  order closes its `count` moves from the order into the unit counts and
  the occupied peasants read the same before and after. The peasants are
  taken from the fields at the call, as the lore has it, and the bound is
  judged once, on the fief the player sees.
- **Delivery is progressive and derived on read, never stored.**
  `deliveredUnitsOf(order, at)` is
  `min(count, floor(max(0, elapsed) / perUnitSeconds))`, and
  `recruitOrderEndsAt(order)` is `startedAt + count × perUnitSeconds`.
  `Fief.unitCountsAt(at)` answers the stored counts plus the units the open
  order has delivered by `at`, and the overview's `units` reads it, so a
  lord who returns sees the count risen one unit at a time. The stored order
  never changes while it delivers: no row per unit, no column per delivery,
  no process (ADR 005, N2).
- **The resolve closes the order at its last delivery, on one timeline with
  the finished upgrades and the finished study** (ADR 005, ADR 012, ADR
  016). `resolveUpgrade` takes the earliest of the busy build slot's finish,
  the busy study slot's finish and the open order's end that is at or before
  `now`; for an order it materializes the stocks to the order's end and
  `Fief.completeRecruitOrder` adds `count` to its unit, stores the end as
  `storedAt` and leaves the recruit slot idle. The units move into the count
  once, at the close, never read by read: every read already answers them
  through `unitCountsAt`, and a later cancel (Decision 6) reads the
  undelivered units from an order the deliveries never rewrote. On a tie the
  upgrade applies first, then the study, then the order, and their events
  follow that order. An order still delivering is never touched, and a read
  that finds no finish and no ended order runs no transaction.
  `Fief.restore` refuses an open order that ends before `storedAt`
  (`SlotFinishesBeforeStored`), a `count` or a `perUnitSeconds` that is not
  a whole count from 1 (`InvalidUnitCount`, `InvalidUnitDuration`) and a
  negative cost.
- **No cancel of a recruit order in this slice.** A later ticket refunds the
  undelivered units' cost and occupancy and keeps the delivered ones; the
  stored order holds what it needs, its cost, its count and its start, and
  its delivered units are derivable at any instant.
- **The chronicle gains a fifth event kind, recruits delivered** (ADR 013,
  amended): one event per order, never per unit, naming the unit and the
  `count` the order delivered, stamped with the order's end, the instant of
  the last delivery, never the `now` of the read that closed it. It carries
  no level and no refund. The resolve answers it beside the events of the
  same walk, after the upgrade and the study of a tied instant, and the api
  writes it in the transaction that closes the order.
- **Persistence: two tables and two event columns, one migration**
  (0012, ADR 006). Enum `unit` (`infantry`). `fief_units`, one row per fief
  and kind with a `count` from 0, keyed by `(fief_id, kind)`; a kind without
  a row counts 0, and `save` writes only the counts above 0.
  `fief_recruit_orders`, `fief_id` its primary key, so one order per fief,
  with `kind`, `count` from 1, the five `cost_*` it debited,
  `per_unit_seconds` from 1 and `started_at`; no row is an idle slot, and
  `save` replaces the row in the fief's transaction. Both cascade on the
  fief's deletion. `fief_event_kind` gains `recruits_delivered`;
  `fief_events` gains a nullable `unit` over `unit` and a nullable `count`,
  its `level` turns nullable, and the check `fief_events_one_subject`
  replaces `fief_events_building_or_art`: exactly one of `building`, `art`
  and `unit`, a `level` on a building or art row only, a `count` on a unit
  row only. Every row stored before it reads as before. The fief read stays
  one query: the order is a fifth left join, deduplicated by kind (N2).
- **The wire answers `units`, `recruitOrder` and `recruitTerms` as data**
  (ADR 010). `FiefOverview.units` is a record over `UnitKind` of the counts
  at `readAt`, the open order's delivered units included; `recruitOrder` is
  `null` or `{ unit, count, delivered, perUnitSeconds, startedAt, endsAt }`,
  `delivered` and `units` read at the same instant so they never disagree;
  `recruitTerms` is a record over `UnitKind` of the `cost`, the `peasants`
  and the `perUnitSeconds` of one unit, the duration already divided by the
  built barracks level. Decision 9 named `units` and `recruitOrder`; the
  form of Decision 10 needs the terms of one unit, and the owner confirmed
  `recruitTerms` on 2026-09-29 rather than let the client read content (N1).
  `POST /fief/recruit-orders`, behind the signed-in player, runs the resolve
  and then `placeRecruitOrder` in one transaction and answers the overview;
  a malformed body answers 400 `MalformedRequest`, and `BarracksNotBuilt`,
  `RecruitSlotBusy`, `InsufficientResources` and `NotEnoughPeasants` answer
  409 with their kind, each with a Spanish line from the lore.
- **Screen: a barracks card and an army section from barracks level 1**
  (Decision 10, #213, #219). The barracks is a `BuildingCard` with no image
  (S4). Below the buildings, shown from barracks level 1 as the library
  section is from library level 1, the army section reads the infantry
  count, the order in progress (delivered of N, a countdown to the next unit
  and one to the last) and a form for N with its cost and its peasants from
  `recruitTerms`, the shortfalls marked as the building cards mark them
  against `peasants.lowestFree`, the lowest free count across the build
  schedule that the overview answers from `deriveLowestFreePeasants`, the
  bound the server applies to N (#341). Between reads the count and the
  delivered units rise one per `perUnitSeconds` from `startedAt`, capped at
  `count`, and the web re-reads when the order ends, never per unit: a unit
  that trains in under 60 seconds would otherwise poll faster than once a
  minute (M8, N1). Design first: the mockup at version 13 and the Design
  System rules for the numeric form, every web ticket blocked by it.
- **Lore first** (ADR 010). The barracks, the infantry, the verb, the
  section title, the recruit slot, the order line, the countdowns, the
  form's field and its empty-or-invalid line, the two refusals and the
  chronicle line are proposals for the author in the army section of
  `docs/lore/names.md`; `apps/web/src/copy.ts` mirrors them until accepted.

## Considered options

- **A population units are drawn from**, growing over time and eating
  stored food, with upkeep per unit. Rejected by ADR 007 and W9: peasants
  are derived and food is a stock, and a unit that eats is a negative rate
  with a zero-crossing rule. A unit occupies a peasant as a building level
  does, and the same trio bounds both.
- **Units as entries of the build slot and the build queue.** Rejected as
  ADR 012 rejected studies there: a levy is the drill ground's work, not the
  masons', a long order would block every upgrade behind it, and the
  queue's projection and cascade would have to judge unit counts.
- **A recruit queue behind the recruit slot.** Rejected as YAGNI, as the
  study queue was: one kind of unit whose order already takes any N does
  not need a queue, and adding one later is ADR 011 again with `unit` in
  place of `building`.
- **Gate and divide by the projected barracks level.** Rejected as ADR 012
  rejected it for the library: the shortened duration would be a promise
  the projection might not keep once a cancel cascades, and the built level
  is the only one a read can never contradict.
- **A row per unit, or a stored instant per delivery**, so that a read
  finds each unit's finish stored. Rejected by N2 and ADR 005: an order of
  N units is one row, and `floor(elapsed / perUnitSeconds)` answers every
  delivery from the start and the per-unit duration.
- **Move the delivered units into the count on every read**, closing the
  order only at the last one. Rejected: every read of a delivering order
  would become a write, the stored order would change while it delivers,
  and a later cancel could not read the undelivered units from it. Reads
  answer the delivered units through `unitCountsAt`; the stored count moves
  once.
- **Charge the occupancy per unit as it is delivered.** Rejected: the bound
  would be judged on a fief that does not exist yet, an order could be
  refused mid-delivery by a queued upgrade's increase, and ADR 011 charges
  what an order costs at the order.
- **Bound N by the built free peasants alone, or by the projected free
  alone**, as Decision 4 read. Rejected at the ticketing and confirmed by
  the owner: either count alone can drive the other trio negative, and the
  overview answers both.
- **One chronicle event per unit delivered**, or one at the order and one
  at the close. Rejected: ADR 013 keeps 100 events per fief and records
  endings, never orders; a lord who returns to twelve spears reads one line
  (`docs/lore/chronicle.md`).
- **The event kind tied to its subject in the `fief_events` check.**
  Rejected by Postgres: a migration may not use the enum value it adds in
  the same transaction, so the check names one subject and cannot tie
  `kind` to it (`apps/api/CLAUDE.md`). The adapter's exhaustive switch keeps
  them together.
- **The barracks level on the fief row** (Decision 8). Rejected by the
  code: every building level is a row of `fief_buildings` over the enum
  `building` since migration 0007, so the barracks needs an enum value, not
  a column, and its own migration apart from the tables of Decision 8.
- **A wire without `recruitTerms`**, the form reading the unit's cost and
  duration from content. Rejected by N1: the client never computes a value
  the server did not answer, and the per-unit duration depends on the built
  barracks level the server knows.
- **A re-read per delivery.** Rejected by M8: a unit that trains in under
  60 seconds would poll faster than once a minute. The count interpolates
  between reads as the amounts do, and the web re-reads at `endsAt`.
- **Skip the materialization at the order's end.** The close changes no
  rate, so the walk could add the units without materializing the stocks.
  Rejected: every finish the walk applies sets `storedAt` to its instant and
  its event to the same, one step per finish; a close that left `storedAt`
  behind would be the one finish the timeline skips, and the next stretch
  would start at the wrong instant.
- **A season on recruiting**, a `recruit` percent beside `build` and
  `study` (ADR 017). Out of scope of #209; S12 ships it as `train`, in
  ADR 017 as amended.
- **Cancel of a recruit order**, a march, combat, other kinds, upkeep or
  famine (W9), units on the map, generated unit images (S4). Out of scope of
  #209, each a future ADR or ticket.

## Consequences

- PRD W1 is amended: ADR 018 admits recruiting units in a barracks slot,
  and armies, marches and combat stay out. S10 is added under Should have,
  citing this ADR. ADR 013 is amended for the fifth event kind. PRD S3
  still lists four event kinds and M4 five buildings; Decision 12 amends
  neither, as ADR 012 left M4's five as the MVP's.
- `CONTEXT.md` rewrites **Barracks** and **Unit**, defines **Recruit
  order** and **Recruit slot**, and extends **Peasants**, **Resolve**,
  **Event** and **Duration** to units; **Army**, **March** and **Scout** stay
  under W1.
- `packages/domain` gains `UnitKind`, `FiefUnitCounts`, `RecruitOrder`,
  `deliveredUnitsOf`, `recruitOrderEndsAt`, `deriveUnitDurationSeconds`,
  `BarracksLevel`, the `placeRecruitOrder` use case, `Fief.placeRecruitOrder`,
  `Fief.completeRecruitOrder` and `Fief.unitCountsAt`, the event
  `recruitsDelivered` and the errors `InvalidUnitCount`,
  `InvalidUnitDuration`, `BarracksNotBuilt` and `RecruitSlotBusy`;
  `derivePeasantCounts` takes the units and the order, so every
  `FiefSettings`, `StoredFief` and `FiefBuildingLevels` fixture carries
  `units`, `recruitOrder` and `barracks`.
- `packages/contracts` gains `UnitKindSchema`, `units` on
  `FiefContentSchema`, `barracks` on `BuildingKindSchema` and
  `BuildingContentSchema` (a levels-without-effect variant shared with the
  library), `units`, `recruitOrder` and `recruitTerms` on
  `FiefOverviewSchema`, `recruitsDelivered` on `FiefEventSchema`,
  `PlaceRecruitOrderRequestSchema`, and `BarracksNotBuilt` and
  `RecruitSlotBusy` on `ApiErrorKindSchema`; no Spanish enters it (ADR 010).
- Postgres gains `barracks` in `building` (0011), the enum `unit`, the two
  tables and the event columns (0012), each migration in a wave of one, as
  every schema change is.
- **Each close floors the stocks once more.** Materializing the stocks at
  the order's end changes no rate, but each walk step floors every resource
  on its own, so an order closing between two finishes can cost up to one
  unit per resource, as any finish step and any season boundary does (ADR
  016, `packages/domain/CLAUDE.md`). The price of one timeline; the
  alternative is recorded above.
- The overview's `units`, `recruitOrder.delivered` and `peasants` are read
  at `readAt`, the resolve's instant; the delivered units are in the count
  and the order's occupancy is in `occupied`, so a player who sums the
  count times the occupancy and the buildings' occupancy reads the trio's
  `occupied` exactly, before and after the close.
- A second order waits for the slot, as a second study does. The bound on
  N is the stocks and the free peasants, not a cap: a fief with 500 free
  peasants may order 500 infantry, and the order then runs 500 per-unit
  durations.
- A read just before the order's end shows `count − 1` delivered and the
  order open; a read after it shows the order `null`, the whole count and
  the chronicle line dated at the end. The web re-reads at `endsAt` and
  shows what the server stored, never what the section interpolated.
- Known gap: `Fief.restore` does not check a stored order's `unit` against
  the catalog's `units`, as the queue and the study carry their gaps (ADR
  011, ADR 012); a content kind removed under an open order fails every read
  after it.
- Known gap: the lore proposals of #210 and the empty-or-invalid line of
  #213 wait for the author; until accepted, `apps/web/src/copy.ts` mirrors
  them. The barracks and the infantry have no generated image (S4) and the
  infantry icon of #213 is a hand-drawn line SVG (`docs/art/art-bible.md`).
- Out of scope of #209, each a future ADR or an amendment of this one: a
  cancel of a recruit order, a recruit queue, other unit kinds, a season on
  training (S12 ships it: ADR 017 as amended), upkeep or famine, marches,
  combat, units on the map.

## Amendment (2026-09-29)

S11 (#231) supersedes the decision "No cancel of a recruit order in this
slice" and lifts the "Cancel of a recruit order" rejection above. The owner
grilled it on 2026-09-28 and took the recommended option on every question;
this records what S11 shipped, PRs #240 to #243, where the code
stands over the tickets.

- **The lord keeps the delivered units and is refunded the rest in full.**
  `Fief.cancelRecruitOrder(target, stocksAtNow, now)` reads the delivered
  units with `deliveredUnitsOf(order, now)`, a delivery at the cancel instant
  counting (the floor), and adds them to the stored count of the order's
  unit. The undelivered units are `count - delivered`, and their refund is
  `shareOf(cost, cancelled, count)`, the stored cost times the undelivered
  over the count: exact, since the stored cost is `count` times the unit
  cost and seasons scale only durations (ADR 017). The refund is added to
  the stocks at the cancel instant even above the capacity, where it freezes,
  like the other cancels, `storedAt` becomes the cancel instant and the
  recruit slot is left idle. Their peasants are freed with no code of their
  own: occupancy derives from the counts plus the open order (Decision "The
  order's occupancy"), so the delivered units stay occupied and the
  undelivered ones stop being.
- **The resolve comes first, and an ended order is refused.** The use case
  `cancelRecruitOrder` materializes the stocks to the cancel instant, and the
  api runs the resolve walk before it (ADR 005, ADR 016), so every finished
  work is applied first. An order whose end is at or before the cancel
  instant is refused, never swapped for another: the walk has closed it, and
  the answer is the same `RecruitOrderNotFound`.
- **The order is named by its unit and its `startedAt`.** The cancel is
  refused `RecruitOrderNotFound { unit, startedAt }`, a new member of
  `DomainError` in the style of `UpgradeNotFound` and `StudyNotFound`, when
  the slot is idle, holds another unit, or holds an order started at another
  instant (compared by epoch milliseconds), so a stale tab never cancels a
  newer order. It maps to HTTP 409 with `RecruitOrderNotFound` in
  `ApiErrorKindSchema`.
- **No cascade.** Freeing peasants only raises the free count. The build
  slot, the build queue and the study slot stay untouched, since none of
  them holds an entry that a rising free count can invalidate.
- **The chronicle gains a sixth event kind, recruits cancelled** (ADR 013): one event per order, `recruitsCancelled` with its `unit`, the
  `delivered` count (from 0), the `cancelled` count (from 1) and the
  `refund`, stamped with the cancel instant and written in the cancel's
  transaction. It carries no level. The wire schema is strict, its Spanish
  line is a lore proposal of #232 that waits for the author, and the
  chronicle row reads its identity from the unit, the delivered and the
  cancelled counts.
- **Persistence: one value and one column, migration 0013**, alone in its
  wave. `fief_event_kind` gains `recruits_cancelled`; `fief_events` gains a
  nullable `cancelled_count`. The delivered units of a recruits-cancelled
  row live in the existing `count` column, which a recruits-delivered row
  already uses for the units it delivered, and the refund reuses the
  `refund_*` columns of the two other cancels. The check
  `fief_events_one_subject` is replaced: `cancelled_count` may be set only
  on a unit row and then from 1. Every row stored before it reads as
  before. The alternative, a `delivered_count` column beside `count`, would
  leave `count` meaning two things on one kind and null on the other.
- **The route is `DELETE /fief/recruit-orders/:unit/:startedAt`**, the
  instant URL-encoded in the path, validated by
  `CancelRecruitOrderRequestSchema` `{ unit, startedAt }` and answering the
  fief overview like the other cancels.
- **The screen is the Design System `CancelAction` inside `RecruitSlot`,**
  with no confirmation dialog, as the build and study cancels (Decision 6
  of #231, recorded as it fixes it and not as shipped); no design ticket.

Nothing else here changes: the order is still placed in full, delivers on
read and closes at its last delivery, a second order still waits for the
slot, and a recruit queue, other unit kinds, a season on training (S12
ships it: ADR 017 as amended), upkeep or famine, marches, combat and units
on the map stay out. PRD S3 lists four
event kinds and ADR 013 five; this amendment amends neither list, as
Decision 8 of #231 fixes.

## Second amendment (2026-09-29)

S15 (ADR 020) lowers a unit count outside a recruit order for the first
time: the infantry that fall at a battle leave the stored count at the
arrival. A battle fought while a recruit order is still open first folds
the delivered units into the stored count and shrinks the order to the
remainder: `count` drops by the delivered, `startedAt` moves forward by
`delivered × perUnitSeconds` and `cost` is scaled per unit by `shareOf`,
so the stored count never goes negative when the dead outnumber the men
stored before the order. As a result the order's closing
`recruitsDelivered` line counts only the remainder, never the count
ordered. Its peasants need no code of their own: occupancy derives from
the counts plus the open order, so the fold moves it and the dead free
theirs. `DrizzleFiefRepository.save` now deletes a `fief_units` row whose
count drops to 0, the follow-up the S10 review left. Nothing else here
changes: an order still delivers one unit at a time on read, is paid and
staffed in full at the order and is cancelled with the delivered kept.

## Third amendment (2026-10-01)

S16 (ADR 021) supersedes "One kind in this slice, `infantry`" in the
decision "A unit is a stored count per kind on the fief" and lifts "other
unit kinds" from the out-of-scope line as far as cavalry goes: `cavalry`
is the second `UnitKind`, and archers and rams stay content of a later
slice. Each kind's terms gain `carry`, `roadPercent` and `barracksLevel`,
whole counts from 1, beside the `strength` of ADR 020; the shipped rider
costs 30 wood, 40 iron, 20 gold and 80 food, takes 300 seconds and
occupies 2 peasants, and the infantry's cost, duration and occupancy
stand. The barracks gates a kind by a level of its own: after
`BarracksNotBuilt` and before `RecruitSlotBusy`, `Fief.placeRecruitOrder`
refuses `BarracksTooLow { unit, requiredBarracksLevel, barracksLevel }`, a
new member of `DomainError` answered 409, when the built barracks is
below the unit's `barracksLevel`, 1 for the infantry and 3 for the rider
as shipped. The enum `unit` gains `cavalry` (migration 0018), and
`fief_units`, `fief_recruit_orders` and the recruit events hold a rider
in the columns above. The army section draws one card per kind, the
rider's locked below its level. Nothing else here changes: one recruit
slot and one order at a time, of one kind, paid and staffed in full at
the order, delivered one unit at a time on read, its per-unit duration
the content seconds over one plus the built barracks level under the
season's train percent (ADR 017 as amended), cancelled with the delivered
kept, and one chronicle line per order.

## Fourth amendment (2026-10-02)

S18 (ADR 023) adds a third kind, `settler`, the unit that founds a
lord's second fief, and lifts "other unit kinds" from the out-of-scope
line one kind further; archers and rams stay content of a later slice.
The settler is recruited through the recruit slot above like any kind,
gated by the level of the third amendment: `Fief.placeRecruitOrder`
refuses `BarracksTooLow { unit: 'settler', requiredBarracksLevel: 5,
barracksLevel }` at built barracks 1 to 4, after `BarracksNotBuilt` at
0. As shipped it costs 1000 wood,
1000 stone, 600 iron, 100 gold and 1000 food, the first kind to cost
stone, takes 7200 content seconds and occupies 4 peasants from the
instant the order is placed: 1 200 seconds a settler at barracks 5, 900
ordered in a spring that trains at 75 %, and 1 029 at barracks 6. Its
`strength` and `carry` are 0, so the third amendment's "whole counts
from 1" now holds for `roadPercent` and `barracksLevel` alone, and
`strength` and `carry` are whole counts from 0 (ADR 021 as amended).
The enum `unit` gains `settler` (migration 0021), and `fief_units`,
`fief_recruit_orders` and the recruit events hold a settler in the
columns above. A unit count is lowered outside a battle for the first
time: a settler that founds leaves the stored count at its arrival and
frees its peasants, an open recruit order being settled first as the
second amendment settles it at a battle. The army section draws the
settler's card third, locked below barracks 5 in the lines of the
rider's lock. The `BarracksTooLow` line names the kind and the level it
needs, in the api from the refusal and in the army section from the
refused order and `unitTerms`, where it was written for the rider
alone. Nothing else here changes: one recruit slot and one order at a
time, of one kind, paid and staffed in full at the order, delivered one
unit at a time on read, cancelled with the delivered kept, and one
chronicle line per order.

## Fifth amendment (2026-10-05)

S20 (ADR 025) adds a fourth kind, `archer`, third in the kinds' order
before the settler, and lifts archers from "archers and rams stay
content of a later slice" in the third and the fourth amendments; rams
stay deferred. The archer is recruited through the recruit slot above
like any kind, gated by the level of the third amendment:
`Fief.placeRecruitOrder` refuses `BarracksTooLow { unit: 'archer',
requiredBarracksLevel: 2, barracksLevel }` at built barracks 1, after
`BarracksNotBuilt` at 0. As shipped it costs 40 wood, 10 iron, 5 gold
and 40 food, takes 150 content seconds and occupies 1 peasant from the
instant the order is placed: 50 seconds an archer at barracks 2, and 38
ordered in a spring that trains at 75 %. The enum `unit` gains `archer`
(migration 0027), and `fief_units`, `fief_recruit_orders` and the
recruit events hold an archer in the columns above. The army section
draws four cards, the archer's third, locked below barracks 2, and the
settler's fourth, where the fourth amendment drew it third. Nothing
else here changes.
