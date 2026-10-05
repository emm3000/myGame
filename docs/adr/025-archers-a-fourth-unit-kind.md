---
status: accepted
date: 2026-10-05
---
# Archers, a fourth unit kind

## Context

PRD W1 kept armies, marches and combat out of the phase. ADR 018 to ADR
021 reopened it for recruiting, forage marches, attacks on bandit camps
and a second unit kind, and ADR 018 and ADR 021 left archers and rams
as content of a later slice. ADR 021 rebuilt every single-kind shape into a
record over `UnitKind` and closed with a recipe: a new kind touches no
formula and no wire shape; it needs its content, an entry in `byUnitKind`
and in `UnitKindSchema`, a value in the enum `unit`, a count column on
`fief_marches` and on `fief_events` with their checks, its label and its
icon, and its "place in the order is a decision: it fixes when its units
fall". ADR 023 then added the settler as the third kind, last in the
order, of strength 0 and in no fighting party, and ADR 024 let the
infantry and the cavalry carry a transport. With two fighting kinds a
won battle has one shape: the infantry pay first and the riders after
them. S20 reopens W1 one step further, for a third fighting kind whose
one role is where it stands in that order. The obvious designs pull in
what the earlier ADRs ruled out: a volley before the lines meet or kinds
that counter each other, when ADR 020 fixed the whole outcome at dispatch
from one deterministic function the form previews; a loss order kept
apart from the kinds' order, when ADR 021 gave the kinds one order; a
strength, a pace or a barracks gate written in code, when N5 and ADR 008
keep every term in content; a reset of the stored marches and events,
when a schema change is a migration. The owner grilled and confirmed the
slice on 2026-10-05 (#430), and its seven decisions bound the tickets;
the ticketing wrote three defaults into #430, and the owner confirmed
the kinds' order and the icon's drawing the same day. This ADR records
what S20 shipped by PRs #439 to #441, the lore proposals of #431 (PR
#438) and the design of #433; the map's forms and the chronicle with
three kinds are the work of #436, not merged when this was written, and
are recorded from the mockup of #433, not as shipped.

## Decision

- **The archer is the fourth unit kind and the third in the kinds'
  order** (Decision 1 and the Defaults of #430). `UnitKind` is `infantry
  | cavalry | archer | settler`, in that order in `byUnitKind`
  (`packages/domain/src/fief/byUnitKind.ts`), in `unitKinds`, which
  derives from it, and in the wire's `UnitKindSchema`. The archer is the
  fourth kind to exist and the third fighting one; the settler, third
  since ADR 023, is now the fourth in the order and still the last. The
  one order of ADR 021 decides what it decided: which kind the losses
  reach first, which kind a refusal names when more than one qualifies,
  and the order a line, the cards and the form fields name the kinds in.
  The Spanish label, *arquero* / *arqueros*, is a lore proposal (#431).
- **The archer falls last** (Decision 2). There is no new formula:
  `battleOf` (`packages/domain/src/camp/battleOf.ts`) is the function of
  ADR 021 as amended, unedited. The lord's strength is `S = Σ nₖ × sₖ`,
  the lord wins when `S > C`, and a winner loses `ceil(C² / S)` strength
  points taken in `unitKinds` order, each kind losing `min(nₖ, ceil(rest
  / sₖ))` units, a kind the party holds none of skipped. Placed third,
  the archers pay only what is left once every infantry and every rider
  sent has fallen, at 1 point an archer with the shipped strength. A
  losing lord loses every unit, archers too, and the camp `min(C − 1,
  ceil(S² / C))`. Every outcome without archers is the one it was. With
  the shipped content, against a tier 1 camp at 6: 2 infantry, 2 riders
  and 3 archers lose 2 infantry and 1 rider and no archer; 1 infantry, 1
  rider and 4 archers lose the infantry, the rider and 3 archers, and 1
  archer returns; 10 archers alone lose 4; 5 archers alone all fall and
  the camp keeps 1. 3 archers against a camp at 2 lose 2. 10 infantry
  against 6 still lose 4, and 1 infantry and 1 rider against 2 still
  keep the rider. #434 (PR #440) pinned with tests the two mixed
  parties, the 3 archers against 2, the lost battle and the loot of the
  6 archers who survive, and edited no function.
- **The archer's terms are content** (Decision 3, ADR 008, N5).
  `units.archer` in `apps/api/content/fief.json`: 40 wood, 0 stone, 10
  iron, 5 gold and 40 food, 150 seconds, 1 peasant, strength 1, carry
  24, road 100 and barracks 2. `units` is a record over `UnitKind`, so
  content without the archer's terms fails the api at start-up. Beside
  the infantry's 20 wood, 10 iron and 30 food, 90 seconds, 1 peasant,
  strength 1, carry 48, road 100 and barracks 1, the archer has an
  infantry's strength, pace and peasants and half its carry, for 95
  resources against 60 and 150 content seconds against 90: the loss
  order is its one edge.
- **An archer is recruited from built barracks level 2.** The recruit
  slot, the order, its delivery, its cancel and its events are those of
  ADR 018 for any kind, and the gate is ADR 021's: `Fief.placeRecruitOrder`
  refuses `BarracksTooLow { unit: 'archer', requiredBarracksLevel: 2,
  barracksLevel }` at built barracks 1, after `BarracksNotBuilt` at 0,
  and the api builds its line from the refusal's unit and level (ADR 021
  as amended). The order occupies 1 peasant an archer from the instant
  it is placed. The shipped `deriveUnitDurationSeconds` trains an archer
  in 50 seconds at barracks 2 and in 38 ordered in a spring that trains
  at 75 % (37.5 up), under the season train percent every kind takes
  (ADR 017 as amended); 4 archers cost 160 wood, 40 iron, 20 gold and
  160 food, occupy 4 peasants and are delivered over 200 seconds.
- **Archers forage, attack and carry a transport** (Decision 4). A
  party counts archers beside the infantry and the riders on those three
  orders, and `refuseUnfitUnits` is unchanged: it refuses a settler and
  nothing else, so a founding is still one settler alone. `roadPercentOf`,
  `marchOneWaySeconds`, `forageLootOfMilliseconds`, `carryOf` and
  `attackLootOf` already run over every kind and are unedited. With the
  shipped content, from 3:12 to 2:7 on the uplands, a base road of 900
  seconds, with the season's road and loot percents at 100: 10 archers
  walk 900 seconds each way, and 6 riders with 4 archers 900, where the
  6 riders alone ride 450; 10 archers forage 60 wood and 60 stone in 2
  hours and 120 of each in 8, the share of their carry of 240; 12
  infantry and 10 archers forage 408 of each in 8 hours, the share of a
  carry of 816; 1 infantry, 1 rider and 4 archers who beat a camp at 6
  bring 8 of each of three resources, the one archer's 24; 2 infantry, 2
  riders and 3 archers bring 64 of each, a survivors' carry of 192; 10
  archers alone bring 48 of each. On a transport 10 archers carry a
  cargo of 240, and 241 is refused `CargoAboveCarry { cargo: 241, carry:
  240 }`. The units away, the dead leaving the count and
  `NotEnoughUnitsAtHome` are ADR 021's per kind: the refusal names the
  first kind short in the kinds' order, so the archers only when neither
  the infantry nor the riders are short.
- **Persistence: one migration, alone in its wave** (Decision 6, ADR
  006). Migration 0027 adds `archer` to the enum `unit`, `BEFORE
  'settler'`, so the enum keeps the kinds' order. `fief_marches` gains
  `archer_count`, added with a default of 0 that is then dropped, so
  every stored march holds no archer and every later insert names its
  count, checked from 0 by `fief_marches_archer_count_whole`.
  `fief_events` gains a nullable `archer_count`, and one `UPDATE` writes
  0 on every row that holds unit counts. Four checks are replaced with
  the archer in: `fief_marches_units_positive` sums four counts,
  `fief_marches_order_terms` holds a founding at `archer_count` 0 and
  leaves a transport refusing only a settler, `fief_events_one_subject`
  ties the nullness of `archer_count` to that of the other three counts,
  and `fief_events_unit_counts` checks it from 0 and sums it into a
  return's party. `fief_units`, `fief_recruit_orders` and the recruit
  events store an archer through the columns of ADR 018. Every march and
  event stored before reads back with 0 archers; no migration is edited
  and nothing is reset. The migration never names `archer` as a value in
  a check or a write, and the checks compare `kind::text` and
  `march_order::text`, since Drizzle runs every pending migration in one
  transaction and Postgres refuses an enum value in the transaction that
  adds it (ADR 021). The fief read stays one query (N2).
- **The wire keeps every shape.** `UnitKindSchema` gains `archer`, and
  every record over it follows with no schema edited: `units`,
  `recruitTerms` and `unitTerms` on the overview answer four kinds, a
  party and the events' `units` and `unitsLost` count four, and a
  request's `units` needs the `archer` key, a body without it answering
  400 `MalformedRequest` as any incomplete party does (ADR 021). No kind
  joins `ApiErrorKindSchema`.
- **Screens: the archer's card and icon are shipped; the forms and the
  chronicle are drawn** (Decision 5; #433, PR #441, #436). `ArcherIcon`,
  a strung bow beside an arrow, hand-drawn in a 24 px box with a 1.75 px
  stroke in the current ink, joins the Design System between the rider's
  and the settler's (`docs/art/art-bible.md`, UI icons). The army
  section draws the cards in the kinds' order, infantry, riders, archers
  and settlers, so the settler's card is the fourth and still the last.
  Below built barracks 2 the archer's card is locked in the lines of the
  rider's lock, *Requiere cuartel de nivel 2* and a reason naming the
  built level, with the count at home and no form; a lord at barracks 1
  reads three locked cards. From level 2 it recruits as the other cards
  do. The card says nothing of strength, carry or pace, as no kind's
  card does. The march card and its recall's accessible name read the
  party with three kinds, *12 infantes, 6 jinetes y 10 arqueros*, a kind
  at 0 left out. The lock reads `unitTerms.archer.barracksLevel` against
  the built level and is display: the server refuses (N1). On `/mapa`,
  the forage, attack and transport forms and the lines map `partyKinds`,
  every kind but the settler, so since PR #439 each form holds an archer
  field the server accepts and its empty party reads *Envía al menos un
  infante, un jinete o un arquero.* The mockup of #433 draws the rest,
  which #436 is to pin and to fit at 390 px: the archer's field third on
  each form and no settler field; the road of 6 riders and 4 archers at
  15:00; the forage of 10 archers for 8 hours at 120 and 120; the attack
  preview of 1, 1 and 4 against a tier 1 camp losing 1 infantry, 1 rider
  and 3 archers; the transport's carry of 10 archers at 240; the blocked
  states with every count at 0 and with archers short at home; the sent
  state and the chronicle's return and battle lines with three kinds and
  with archers alone. The mockup stands at version 27 and the Design
  System at 22.
- **Lore first** (ADR 010). The archer and its label, what it carries,
  the locked card's lines, the `BarracksTooLow` line for archers, the
  party phrase and the empty line with three kinds, the forms' lines and
  the chronicle lines are proposals for the author in
  `docs/lore/names.md`, `docs/lore/world.md` and `docs/lore/chronicle.md`
  (#431); `apps/web/src/copy.ts` and `apps/api/src/http/answerRefusal.ts`
  mirror them until accepted.
- **Nothing else changes: no rams, no PvP, no scouting** (Decision 6
  and the Out of scope of #430). The camps, their strengths and their
  regrowth, the recall, which turns the whole party back, and the
  season's reach on a march (ADR 022) are as they were; no season
  touches combat. Rams stay content of a later slice; PvP, scouting and
  any march that meets another lord stay in W1. The archer has no
  generated image (S4).

## Considered options

- **Rams, PvP, scouting, a march that meets another lord.** Out of scope
  of #430 and of W1. A ram has nothing to break while no march meets a
  wall, and every interaction between players stays out.
- **A volley before the lines meet, a ranged phase or kinds that counter
  each other.** Rejected by Decision 2: each is a new formula over a
  battle ADR 020 fixed as one deterministic function, read whole on the
  form before the men leave. The lore keeps the volley as an open
  question (`docs/lore/world.md`); it would be a new ADR.
- **Archers first in the loss order, or between the infantry and the
  cavalry.** Rejected by Decision 2: falling last is the role. First,
  the archer would be a dearer infantry that shields the others; in the
  middle, it would shield the riders, the dear strength, at a price
  under theirs. Last, it is the kind a won battle sends home.
- **A loss order listed apart from the kinds' order.** Rejected: ADR 021
  gave the kinds one order that the losses, the refusals, the lines and
  the screens all read. A second list would let the cards and the form
  name the kinds in one order while the battle walks another, and
  `battleOf` would have needed its first edit for a kind.
- **The archer appended after the settler.** Rejected by the Defaults of
  #430: the battle would not change, since no fighting party holds a
  settler, but the cards and the fields follow the order, and the
  settler's card, the dearest and the last unlocked, stays last. The
  cost is that "the third kind" of ADR 023 now names the fourth, which
  this ADR amends.
- **An archer stronger, faster or better loaded than an infantry.** Left
  to content. The shipped terms give the archer one edge alone so that
  the loss order can be read on its own in play; raising its strength or
  its carry is an edit of `fief.json`, with the caveat on a strength
  above 1 recorded below.
- **Archers kept off a transport, or off a forage.** Rejected by
  Decision 4: `refuseUnfitUnits` refuses the kind that carries and
  fights nothing, and an archer does both. A list of kinds per order
  would be a second rule where the terms already answer.
- **Two migrations, the enum value first, as S16 took.** Not needed:
  S16 split them because the march's shape changed between the two
  (ADR 021). The columns per kind exist since 0019, so the value and its
  two columns land together, as 0021 landed the settler's.
- **A `fief_march_units` table now that the kinds are four.** Rejected
  again, for ADR 021's reasons: a check can refuse a march with no unit
  only within one row, and one more one-to-many join would multiply the
  rows of the one fief read (N2). The cost stays a column on two tables
  and four checks rewritten for each kind.
- **A generated image for the archer.** Out of scope: S4 keeps units on
  hand-drawn icons.
- **A recall of one kind, a season on combat, a change to the camps or
  their regrowth.** Out of scope of #430, each a future ADR, an
  amendment of this one or a ticket.

## Consequences

- PRD W1 is amended: ADR 025 admits archers (S20); rams, armies, PvP,
  scouting and marches that meet another lord stay out. S20 is added
  under Should have, citing this ADR. Row S18 keeps calling the settler
  a third unit kind, as it was when S18 shipped.
- ADR 021 is amended for the fourth kind, the loss order and the
  later-slice list. ADR 023 is amended: the settler is the fourth kind
  in the order, still last, and its card the fourth. ADR 018 is amended
  for the kind recruited at barracks 2, ADR 020 for the loss order and
  ADR 024 for the third carrier of a transport.
- `CONTEXT.md` counts the archer in **Unit**, gives its **Strength**,
  names the loss order in **Battle** and counts archers among the
  carriers of a transport in **March**.
- ADR 021's recipe held. The kind took its content, an entry in
  `byUnitKind` and in `UnitKindSchema`, a value in the enum `unit`, a
  count column on two tables with their checks, the adapters' mapping,
  its label and its icon; no formula and no wire shape changed. The
  recipe's "three checks" are four since the founding of ADR 023 made
  `fief_marches_order_terms` name each kind's count. A fifth kind, rams among them, follows the
  same list, and its place in the order is again the decision.
- With the shipped content an archer is an infantry in strength, pace
  and peasants with half its carry, dearer by 35 resources, 5 of them
  gold, and by 60 content seconds. A party of archers alone fights as
  the same count of infantry and brings half: 10 archers against a camp
  at 6 lose 4 and bring 48 of each, where 10 infantry lose 4 and bring
  96. The archer pays only behind other kinds. Tuning it is a content
  edit.
- A won battle that sent archers always brings at least one archer
  home. A win costs at most `S − 1` points, the infantry and the riders
  ahead pay at least their own strength before the archers pay, and an
  archer of strength 1 pays exactly the points left, so the archers lose
  at most one fewer than were sent. ADR 021's rule that spares the last
  unit reached now fires only for a party without archers. An archer
  comes home at any strength, since that rule lands on the last kind
  reached. What holds for a strength of 1 alone is that the rule never
  fires with archers sent: at a higher strength their losses round up as
  the riders' do and the rule can spare one.
- The riders fall before the archers. In a party of the three kinds the
  dear kind stands between the infantry and the archers: an archer never
  shields a rider, and the archers survive a battle that costs riders.
- An archer slows riders as an infantry does: 6 riders with one archer
  ride the archers' road, twice their own with the shipped content.
- The forage fills an archer's carry where it never fills a rider's:
  each head gathers 3 of each of two resources an hour against a share
  of 12, so archers alone bring no more from the fifth hour of a stay
  on. Beside infantry the carry is summed and binds later.
- A request built before S20, with no `archer` key in `units`, answers
  400 `MalformedRequest`, since the record needs every kind. A page
  loaded before the deploy must be reloaded to send a march.
- Known gap: `partyBattleOf` and the forms' previews repeat `battleOf`,
  `carryOf` and the road in the browser (ADR 021); they walk the same
  kinds' order, and the server's answer wins (N1).
- Known gap: #436 is in flight. Until it merges no web test pins the
  three forms, their previews, their blocked states or the chronicle's
  lines with archers, and the three count fields are not fitted at 390
  px. Its screens here are the mockup's.
- Known gap: the open question on *Pierdes 0 infantes* widens
  (`docs/lore/names.md`, The chronicle). A battle that lost no one
  writes every kind at 0 and its line names the first kind of the order,
  so archers alone against a camp at strength 0 read *Pierdes 0
  infantes* too.
- Known gap: the lore proposals of #431 wait for the author, among them
  the label, what the icon draws and whether archers ever loose before
  the lines meet.
- Out of scope of #430, each a future ADR or an amendment of this one:
  rams, PvP, scouting, any march that meets another lord, a recall of
  one kind, a season on combat, an archer image, a change to the camps,
  their regrowth, the recall or `refuseUnfitUnits`.
