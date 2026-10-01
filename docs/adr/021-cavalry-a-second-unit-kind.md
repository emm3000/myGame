---
status: accepted
date: 2026-10-01
---
# Cavalry, a second unit kind

## Context

PRD W1 kept armies, marches and combat out of the phase. ADR 018 reopened
it for recruiting, ADR 019 for forage marches and ADR 020 for attacks on
bandit camps, each with infantry alone: ADR 018 left "archers, cavalry and
rams" as content of a later slice, and every layer since counted one kind
by name, `forage.carryPerInfantry` in the content, `infantryStrength` on
the wire, `fief_marches.infantry` in the store, `NotEnoughInfantryAtHome`
among the refusals. With one kind the S15 combat has one dial, how many
men to send. S16 reopens W1 one step further, for a second kind that makes
the party a choice: infantry is cheap strength; cavalry is fast and
carries more, paid in gold, food, time and peasants. The obvious designs
pull in what the earlier ADRs and the rules ruled out: a speed or a
barracks gate written in code, when N5 and ADR 008 keep every term in
content; a march per kind, when ADR 019 gave the fief one march slot; a
battle of rounds or of kinds that counter each other, when ADR 020 fixed
the whole outcome at dispatch from one deterministic function the form
previews; a `cavalry` field beside every `infantry` field, a patch over
the single-kind shapes where the rule is to rebuild; a reset of the stored
marches and events, when a schema change is a migration. The owner grilled
and confirmed the slice on 2026-10-01 (#343), and its eleven decisions
bound the tickets; the ticketing wrote five defaults into the tickets,
listed in the wave plan on #343, and the owner confirmed each. This ADR
records what S16 shipped, PRs #355 and #357 to #363, and the lore
proposals of #344 (PR #356); where the code stands over a ticket it
records the code: the march stores its party in columns, not in the
table Decision 6 preferred, and the screens, which Decision 10 fixed and
the mockup of #347 drew, read a blank count as 0 and draw no button on
the locked card.

## Decision

- **Cavalry is the second unit kind, and the kinds have one order.**
  `UnitKind` is `infantry | cavalry`. `byUnitKind(entryOf)` is the one
  literal over the kinds in `packages/domain`; `unitKinds` and
  `FiefUnitCounts.none` derive from it, and every record over the kinds
  in the domain is built through it, never from a hard-coded kind inside
  a function; the store's adapters name the two count columns.
  The order is infantry, then cavalry, the same as the wire's
  `UnitKindSchema`, and it decides three things below: which kind the
  losses reach first, which kind a refusal names when more than one
  qualifies, and the order a line names a party in. The Spanish label,
  *jinete* / *jinetes*, is a lore proposal (#344).
- **Each kind's carry, road percent and barracks level are content**
  (ADR 008, N5). `UnitTermsSchema`, strict, gains `carry`, `roadPercent`
  and `barracksLevel` beside the `cost`, `durationSeconds`,
  `peasantOccupancy` (ADR 018) and `strength` (ADR 020), each a whole
  count from 1; `units` in `apps/api/content/fief.json` is a record over
  `UnitKind`, so a missing kind, a missing field or a 0 fails the api at
  start-up. Shipped: infantry keeps its cost, 90 seconds, 1 peasant and
  strength 1, and gains carry 48, road 100 and barracks 1; cavalry costs
  30 wood, 40 iron, 20 gold and 80 food, takes 300 seconds and 2
  peasants, with strength 2, carry 120, road 50 and barracks 3.
  `forage.carryPerInfantry` is removed: the carry is a unit's term, read
  from `units` by the forage loot, the recalled loot and the attack loot
  through `MarchTerms` and `AttackTerms`.
- **A kind is recruited from the barracks level its terms give.**
  `Fief.placeRecruitOrder` refuses `BarracksTooLow { unit,
  requiredBarracksLevel, barracksLevel }`, a new member of `DomainError`
  in the shape of `LibraryLevelTooLow`, when the built barracks is below
  the unit's `barracksLevel`: after `InvalidUnitCount` and
  `BarracksNotBuilt`, before `RecruitSlotBusy` and
  `InsufficientResources`, writing nothing. The level is the built one,
  never the projected one, as ADR 018 gates and divides. It answers 409
  with its kind in `ApiErrorKindSchema`. The recruit slot, the order, its
  delivery, its cancel and its events are those of ADR 018 for either
  kind: one order at a time, of one kind. A rider's duration is the
  shipped `deriveUnitDurationSeconds`, `ceil(durationSeconds × train /
  (100 × (1 + barracksLevel)))`, under the same season train percent
  (ADR 017 as amended): 75 seconds at barracks 3, 57 ordered in a spring
  that trains at 75 %.
- **A march carries a party: a count per kind.** `AwayMarch.units`,
  `MarchOrder.units` and `AttackOrder.units` are a `UnitCountsByKind` in
  place of `infantry`: each count a whole number from 0, at least one
  unit in all. `refuseInvalidParty` refuses `InvalidUnitCount` naming the
  first kind whose count is negative or fractional, or, when every count
  is 0, the first kind of the order; `Fief.roomForMarch` and
  `Fief.roomForAttack` run it before any other check, and `Fief.restore`
  before any other check of a stored march, so no road, loot or battle
  is computed for an empty party. The party
  is one march in the one march slot (ADR 019): it walks, forages,
  fights, is recalled and returns together.
- **The road is timed by the slowest kind sent, in one `ceil`.**
  `roadPercentOf(units, terms)` answers the highest `roadPercent` among
  the kinds with a count from 1, and `marchOneWaySeconds` answers
  `ceil(base × percent / 100)`, `base` the road of ADR 019,
  `|Δprovince| × secondsPerProvince + |Δplot| × secondsPerPlot`: one
  product, one division and one `ceil`, as ADR 016 and ADR 017 round.
  With the shipped content, on the lore's road of one province and five
  plots, 900 seconds: 6 riders ride 450 each way, and 12 infantry and 6
  riders 900, as a single infantry beside the riders would. A kind at 0
  slows nothing. The result is stored on the march as `oneWaySeconds`,
  so the instants, the phases and the recall of ADR 019 read it with no
  change.
- **The forage gathers per head whatever the kind, capped by the summed
  carry.** `forageLootOfMilliseconds` and `forageLootOf` answer, for each
  resource the terrain yields, `min(floor(heads × rate × milliseconds /
  3 600 000), floor(carryOf(units) / yielded))`: `heads` the total of the
  counts, `carryOf(units, terms)` the sum of `nₖ × carryₖ`, gold never
  foraged. A rider forages no faster than an infantry. With the shipped
  content 12 infantry and 6 riders on the uplands for two hours bring
  108 wood and 108 stone, and 6 riders alone 36 of each; the same 12 and
  6 recalled half an hour into the stay bring 27 of each.
- **The battle sums the strength, and the infantry fall first.**
  `battleOf(units, campStrength, terms)` answers `{ won, unitsLost,
  campLost, survivors }`, the two counts per kind. The lord's strength is
  `S = Σ nₖ × sₖ`; the lord wins when `S > C`, and a tie goes to the
  camp (ADR 020). A winning lord loses `ceil(C² / S)` strength points, taken
  in `unitKinds` order: each kind loses `min(nₖ, ceil(rest / sₖ))` units
  and lowers the rest by their strength, never below 0. When that takes
  every unit of every kind, the last kind the losses reached loses one
  fewer, so the winner always keeps at least one unit in all, not one
  per kind. With infantry alone it is the `min(n − 1, ceil(C² / (n ×
  s²)))` of ADR 020, since the nested `ceil` equals the single one. A
  losing lord loses every unit, and the camp `min(C − 1, ceil(S² / C))`,
  unchanged. With the shipped content: 5 infantry and 5 riders against a
  camp at 6 lose 3 infantry and no rider; 2 and 3 against 6 lose both
  infantry and 2 riders, and 1 rider returns; 12 and 6 against 15 lose
  10 infantry; 10 riders against 6 lose 1; 8 riders against 15 lose 7; 1
  and 1 against 2 keep the rider; a lone rider against a camp at 1 wins
  and loses no one; 3 riders against 6 is the camp's, which keeps 1; 7
  riders against 15 all fall and the camp keeps 1; 10 infantry against 6
  still lose 4 and 25 against 10 still lose 4.
- **The attack loot is capped by the survivors' summed carry.**
  `attackLootOf` answers, for each resource the terrain yields and for
  gold, `floor(min(lootPerStrength × campStrength, carryOf(survivors)) /
  (yielded + 1))`, the split of ADR 020 with the carry read per kind.
  With the shipped content 10 riders against a tier 1 camp at 6 bring 120
  of each of three resources (the camp's 360 binds, under a carry of
  1 080); 12 infantry and 6 riders against a tier 2 camp at 15 bring 272
  of each (the survivors' carry of 816 caps 900); 2 infantry and 3 riders
  against 6 bring 40 of each, the one rider's 120.
- **The units away are the party, and the dead leave the count per
  kind.** `Fief.unitsAtHomeAt` is `unitCountsAt` less the march's count
  of every kind; the stored count does not change at dispatch, so the
  units away keep their peasants, two for each rider (ADR 018, ADR 019).
  `NotEnoughUnitsAtHome { unit, count, atHome }` replaces
  `NotEnoughInfantryAtHome` in `DomainError`, naming the first kind short
  in `unitKinds` order, still the last refusal of both dispatches; every
  other refusal of ADR 019 and ADR 020 keeps its place. At the battle
  `Fief.completeBattle` lowers each kind by its `unitsLost` and a won
  march keeps `units` at the survivors per kind (ADR 020). The dispatch
  fixes the forage loot, or the loot of the predicted survivors, over the
  whole party, and a recall's partial loot counts every head.
- **The return and the battle events count each kind** (ADR 013).
  `marchReturned.units` is the party that returned, the survivors of a
  won attack, and `battleFought.unitsLost` the count of each kind that
  fell, in place of `infantry` and `infantryLost`; a battle that lost no
  one writes every kind at 0. The recruit events keep their one `unit`
  and its counts, since an order is of one kind. The chronicle stays at
  eight kinds.
- **Persistence: two migrations, each alone in its wave** (ADR 006).
  Migration 0018 adds `cavalry` to the enum `unit` and nothing else:
  `storedUnits` maps every `UnitKind` to the Postgres enum, so the
  kind could not enter the domain before its value, and the march's
  shape followed in a later ticket. `fief_units`, `fief_recruit_orders`
  and the recruit events store a rider through the columns of ADR 018.
  Migration 0019 renames `fief_marches.infantry` to `infantry_count`, so
  every stored march keeps its infantry with no data copy, and adds
  `cavalry_count`, 0 on every stored march; each is checked from 0 and
  `fief_marches_units_positive` checks their sum at least 1, in place of
  `fief_marches_infantry_positive`. `fief_events` gains a nullable
  `infantry_count` and `cavalry_count`; one `UPDATE` moves every
  `march_returned` and `battle_fought` row from `unit` and `count` to
  the two columns, the riders at 0. `fief_events_one_subject` is
  replaced: a row's subject is exactly one of a building, an art, a unit
  or the unit counts, and `province` and `plot` sit on a row with unit
  counts and only there. The new `fief_events_unit_counts` puts the
  counts on those two kinds and no other, each from 0, a return's sum at
  least 1. Every march and event stored before reads back as infantry
  with no rider. Neither migration uses `cavalry` as a value in a check
  or a seed, and the `UPDATE` and `fief_events_unit_counts` compare
  `kind::text`: Drizzle runs every pending migration in one transaction,
  and Postgres refuses an enum value in the transaction that adds it
  (ADR 019 as amended, ADR 020). The fief read stays one query (N2): the
  march is still one row of the one joined read.
- **The wire counts each kind in one record, with no infantry field left
  beside it** (ADR 010). `UnitCountsSchema` is a record over
  `UnitKindSchema` of whole counts from 0, which needs every kind and
  refuses any other key; `PartySchema` is the same record refined to sum
  at least 1. `DispatchMarchRequestSchema` is `{ province, plot, units,
  stayHours }` and `DispatchAttackRequestSchema` `{ province, plot, units
  }`, `units` a party; a body that fails either answers 400
  `MalformedRequest` with an empty body, so a party with no unit never
  reaches the use case. `FiefOverview.march.units` is the party away and
  `FiefOverview.units` the counts; `unitTerms` is a record over the kinds
  of a strict `{ strength, carry, roadPercent, barracksLevel }` copied
  from content, so a form previews from the server's terms (N1);
  `forageTerms` carries no carry and `combatTerms` is `{ lootPerStrength,
  tiers }`, the infantry strength gone to `unitTerms`; `recruitTerms`
  answers both kinds, unchanged in shape. `marchReturned.units` is a
  party and `battleFought.unitsLost` the counts. `ApiErrorKindSchema`
  gains `BarracksTooLow` and renames `NotEnoughInfantryAtHome` to
  `NotEnoughUnitsAtHome`, both answered 409. Each step crossed the
  contracts, the api and the web in one PR, the terms in #355, the kind
  and `BarracksTooLow` in #357, the counts and `NotEnoughUnitsAtHome` in
  #362: rebuild, never adapt.
- **Screens: a card per kind, the rider's lock, the forms with a party
  and the lines that name it** (Decision 10 of #343, the mockup of #347;
  PR #359, PR #362, PR #363). `CavalryIcon`, a horseshoe with its nails
  beside a lance, hand-drawn in a 24 px box with a 1.75 px stroke in the
  current ink, joins the Design System (`docs/art/art-bible.md`, UI
  icons). The army section draws one card per kind, each with the icon
  of its own kind and its own counts at home and away. Below the
  barracks level its terms give, the rider's card is locked: a dashed
  frame, the count at home, *Requiere cuartel de nivel 3* and a reason
  naming the built level, with no form, no field, no cost list and no
  button; the acceptance criterion of #350 won over the disabled button
  the mockup drew. The lock reads `unitTerms[kind].barracksLevel` against
  the built barracks level and is display: the server refuses (N1). The
  march and attack forms on `/mapa` have one count field per kind under
  a header counting each kind at home behind its own icon, and send
  `units` with every kind, a blank field read as 0. Each time a form
  opens, the first kind with units at home starts at 1 and the others at
  0. The preview repeats the domain's rules from `unitTerms`,
  `forageTerms` and `combatTerms` as display code: the road of the
  slowest kind entered, the forage per head capped by the summed carry,
  and the battle's losses and survivors per kind with the loot capped by
  the survivors' carry. A form is blocked, sending nothing, in this
  order: a march away, a count that is not a whole number from 0, on the
  forage form a stay outside the range, every count at 0, and a kind
  short at home, the first in the kinds' order named with its count at
  home. The sent state, the army section's march card and its recall's
  accessible name read the party of `march.units` as one phrase in the
  kinds' order, a kind at 0 left out, and so does the chronicle for the
  party of a return and the losses of a battle, so a line of infantry
  alone reads as it did. The mockup stands at version 21 and the Design
  System at 17.
- **Lore first** (ADR 010). The rider and its label, the party phrase,
  the locked card's two lines, the two refusals, the form's lines for
  two kinds, the phase lines and the chronicle lines are proposals for
  the author in `docs/lore/names.md`, `docs/lore/world.md` and
  `docs/lore/chronicle.md` (#344); `apps/web/src/copy.ts` and
  `apps/api/src/http/answerRefusal.ts` mirror them until accepted.
- **Nothing else changes: no archers, no rams, no PvP, no season on the
  road.** The defaults of Decision 8: cavalry trains under the season
  train percent every unit does, and the camps, their strengths, their
  regrowth and the recall are those of ADR 019 and ADR 020; a recall
  turns the whole party back, never one kind. `marchOneWaySeconds`,
  `battleOf` and `attackLootOf` read no season. Archers and rams stay
  content of a later slice; PvP, scouting and any march that meets
  another lord stay in W1. The rider has no generated image (S4).

## Considered options

- **Archers, rams, PvP, scouting, a march that meets another lord.** Out
  of scope of #343 and of W1: one kind is enough to make the party a
  choice, and every interaction between players stays out.
- **A speed per kind computed in code, or a road term apart from the
  map's.** Rejected by N5 and ADR 019: `roadPercent` is one content
  number over the road the map already times, and a new kind's pace is a
  content edit.
- **The road timed by the fastest kind, or by an average over the
  party.** Rejected: the party arrives together, the battle and the
  return are one instant each (ADR 019, ADR 020), and an average would
  need a weighting rule and a second rounding where the highest percent
  needs one `ceil`.
- **A march per kind, or a second march slot for the riders.** Rejected
  as ADR 020 rejected a second slot for the attack: one march at a time,
  and two marches would double the phase reads, the recall and the
  resolve step.
- **A forage rate per kind.** Rejected by Decision 4: every head gathers
  at the terrain's rate, the formula of ADR 019 with `n` the heads, and
  the rider's carry raises only the cap.
- **Losses spread over the kinds in proportion, or taken from the
  cavalry first.** Rejected by Decision 5: a proportional split needs a
  rounding rule per kind and can lose a rider for a fraction of a point.
  Infantry first is one walk in the kinds' order, deterministic, which
  the form previews, and spends the cheap strength before the dear one.
- **Losses counted in units, not in strength points.** Rejected: the
  curve of ADR 020 is in strength, and only `ceil(rest / sₖ)` per kind
  reduces to its infantry formula for any content strength; #348
  recorded that one infantry per strength point holds only at strength
  1, the shipped case.
- **One survivor kept per kind.** Rejected by Decision 5: the winner
  keeps at least one unit in all, as ADR 020 kept one infantry; a floor
  per kind would make a mixed party lose less than its strength owes.
- **`carryPerInfantry` kept beside a carry for the rider, or a `cavalry`
  field beside each `infantry` field** on the march, the requests, the
  events and the refusal. Rejected by the rule to rebuild and by Decision
  7: a record over `UnitKind` is exhaustive at the type level and strict
  on the wire, and a third kind then touches no shape.
- **A `fief_march_units` table**, one row per kind sent, as Decision 6
  preferred. Rejected by the code (PR #361): a check can refuse a march
  with no unit only within one row, which a child table cannot do
  without a constraint trigger, and one more one-to-many join, beside
  those of the buildings, the queue, the arts and `fief_units`, would
  multiply the rows of the one fief read again (N2). The
  cost is recorded below: a new kind is a column on two tables.
- **One migration for the enum value and the march's columns.**
  Rejected by the code: `storedUnits` is exhaustive over `UnitKind`, so
  the value had to land with the kind (#346), before the domain's march
  held a party (#349) for the store to keep (#351).
- **Gate the rider by the projected barracks level.** Rejected as ADR
  018 rejected it for recruiting: the built level is the only one a read
  can never contradict, and `barracksLevel` on the unit's terms gates
  any kind against it.
- **Slots on `ApiError` for the refusal lines.** Left out (PR #362):
  `ApiError` carries a kind and a message, and optional `unit`, `count`
  and `atHome` fields are a larger contract change than S16 needed. The
  gap is recorded below.
- **A season on the road or on combat, a recall of one kind, a rider
  image (S4), a change to the camps or their regrowth.** Out of scope of
  #343, each a future ADR, an amendment of this one or a ticket.

## Consequences

- PRD W1 is amended: ADR 021 admits a second unit kind, cavalry; armies,
  PvP, scouting and marches that meet another lord stay out. S16 is added
  under Should have, citing this ADR. ADR 018 is amended for the second
  kind and the barracks level gate, ADR 019 for the party, the road
  percent, the carry from the unit terms and `NotEnoughUnitsAtHome`, and
  ADR 020 for the summed strength, the losses infantry first and the
  loot cap summed. ADR 013's eight event kinds stand; two of them count
  per kind.
- `CONTEXT.md` defines **Party** and rewrites **Unit** (cavalry in,
  archers and rams later, the units away per kind), **March**, **Loot**
  and **Battle** (a count per kind), and adjusts **Barracks**,
  **Forage**, **Strength**, **Army** and **Event** to two kinds.
- `packages/domain` gains `byUnitKind`, `roadPercentOf`, `carryOf`,
  `refuseInvalidParty`, `MarchTerms`, the three fields of `UnitTerms` and
  the errors `BarracksTooLow` and `NotEnoughUnitsAtHome`; `battleOf`,
  `attackLootOf`, `forageLootOf`, `forageLootOfMilliseconds` and
  `marchOneWaySeconds` take a `UnitCountsByKind`; `AwayMarch`,
  `MarchOrder`, `AttackOrder`, `marchReturned` and `battleFought` count
  per kind. `ForageTerms.carryPerInfantry` and `NotEnoughInfantryAtHome`
  are gone.
- `packages/contracts` gains `cavalry` on `UnitKindSchema`,
  `UnitCountsSchema` and `PartySchema` (neither exported from the
  entry), the three fields of `UnitTermsSchema`, `unitTerms` on
  `FiefOverviewSchema` and the two refusals on `ApiErrorKindSchema`; no
  schema outside `UnitKind.ts` names a kind, and no Spanish enters it
  (ADR 010).
- Postgres gains `cavalry` in `unit` (0018) and the per-kind columns of
  `fief_marches` and `fief_events` with their checks (0019), each in a
  wave of one.
- **A third kind touches no formula and no wire shape.** Besides its
  content it needs an entry in `byUnitKind` and in `UnitKindSchema`, a
  value in the enum `unit`, a count column on `fief_marches` and on
  `fief_events` with their three checks edited and the adapters' mapping
  of them, its label and its icon. Its place in the order is a decision:
  it fixes when its units fall.
- A mixed party is never faster than its slowest kind: one infantry
  beside the riders doubles their road with the shipped content, so the
  rider's pace is bought by sending riders alone.
- A kind's losses round up to whole units, so a party can pay more
  strength than the curve asks: 2 infantry and 3 riders against 6 owe 5
  points and pay 6, the second rider falling for the odd point. The rule
  that keeps one unit can also spare the whole party: a lone rider
  against a camp at 1 owes 1 point and loses no one, and its battle line
  reads *Pierdes 0 infantes*, the first kind of the order, since the
  event carries the losses and not the party (`docs/lore/names.md`, The
  chronicle).
- With the shipped content a rider is two infantry in strength and in
  peasants and two and a half in carry, for 170 resources against 120,
  20 of them gold, and 300 content seconds against 180. The forage never
  fills a rider's carry, 24 of each resource per head at the longest
  stay against a share of 60, so the carry pays on a won attack. Tuning
  it is a content edit.
- The wire's `units` counts the units at home and away, so a client
  reads the units at home of a kind as `units[kind] −
  march.units[kind]`, before and after a battle, with the one rule of
  ADR 020.
- Known gap: the forms' preview repeats the rules of `roadPercentOf`,
  `forageLootOf`, `battleOf` and `attackLootOf` in the browser, as the
  attack form repeated `battleOf` since ADR 020; a change to one must
  reach the other, and the server's answer wins (N1). The preview reads
  the units at home and the camp's strength as the last read answered
  them, so the dispatch may fix other figures.
- The forms' blocked states come in an order of their own, the march
  away first, where the domain refuses the party and the stay before
  `MarchSlotBusy`; both name the same kind short. The form is display
  and the refusal order of ADR 019 and ADR 020 stands.
- Known gap: the api's `BarracksTooLow` line is static, *nivel 3* and
  *los jinetes*, and the web's `NotEnoughUnitsAtHome` line names no
  count and is not in the lore, since `ApiError` carries no slots; the
  api's own line for it is built from the refusal's `unit`, `count` and
  `atHome`. A second gated kind, or a web line with its counts, needs
  the slots on the wire.
- Known gap: `InvalidUnitCount` for a party has no wire kind and would
  answer 500; the request schema refuses a fractional, negative or empty
  party first with 400, so the domain refusal stands for a caller that
  bypasses the wire, as ADR 019 recorded for the infantry count.
- Known gap: ADR 020's snapshot gap now spans the kinds. The attack
  stores the camp's strength and the loot of the predicted survivors but
  no unit term; the resolve reads every kind's `strength` from the
  content in force at the arrival, so a content change on the road can
  flip the outcome or move the losses while the loot stays as fixed.
- Known gap: `roadPercentOf` answers 0 for a party with no unit; every
  shipped caller has refused that party first.
- Known gap: the lore proposals of #344 wait for the author; until
  accepted, `apps/web/src/copy.ts` and `answerRefusal.ts` mirror them.
  The forms read a blank count as 0 where the mockup blocked it (PR
  #363); `docs/lore/names.md` records it as a proposal.
- Out of scope of #343, each a future ADR or an amendment of this one:
  PvP, scouting, any march that meets another lord, archers, rams, a
  recall of one kind, a season on the road or on combat, a rider image,
  a change to the camps, their regrowth or the recall.

## Amendment (2026-10-01)

S17 (ADR 022) lifts "no season on the road" from the decision "Nothing
else changes: no archers, no rams, no PvP, no season on the road", and
"a season on the road" from the last considered option and from the
out-of-scope line of the Consequences. `marchOneWaySeconds` takes the
season's road percent as its last argument and answers `ceil(base ×
percent × road / 10 000)`: `percent` the `roadPercentOf` above, the
slowest kind sent, and `road` the season's road percent in content, 75 in
autumn and 100 in every other season as shipped (ADR 017 as amended),
still one product, one division and one `ceil`. At 100 it is the
`ceil(base × percent / 100)` above. With the shipped content, on the
lore's road of 900 seconds, 6 riders ride 450 each way and 338 in autumn
(337.5 up), and 12 infantry and 6 riders 900 and 675 in autumn.

`forageLootOfMilliseconds` and `forageLootOf` take a percent per
resource and answer `min(floor(heads × rate × milliseconds × percent /
(3 600 000 × 100)), floor(carryOf(units) / yielded))`, the season's
percent inside the one `floor` and the summed carry still the cap; a
recall's partial loot reads the percents the march stored at dispatch.
The decision's sentence that `marchOneWaySeconds` reads no season now
holds of the calendar alone: the function takes the percent the use case
read at dispatch. `battleOf` and `attackLootOf` read no season, as
before. The known gap of the forms' preview now spans the season.

Nothing else here changes: the kinds and their order, the party, the
road of the slowest kind, the carry, the battle, the losses and the
attack loot stand, and a season on combat stays out.
