---
status: accepted
date: 2026-09-29
---
# Infantry forage a free plot on a march

## Context

PRD W1 kept armies, marches and combat out of the phase. ADR 018 reopened
it for recruiting, and a fief now holds infantry that stand in the yard
and answer no order: they occupy peasants, eat nothing and do nothing. The
kingdom map (ADR 014) reads every plot of a province, free or held, and is
read to plan, never acted on; the lore has always shown the land no lord
has reached yet (`docs/lore/world.md`, The land). S13 reopens W1 one step
further: infantry march to a free plot of the kingdom, forage there for a
chosen count of hours and come back with what they carry, meeting no one.
The obvious designs pull in what the earlier ADRs ruled out: a job that
lands the loot when the men are back, or a march that moves resources as
it walks (ADR 005, N2, W7); a plot that is reserved or depleted, a table
beside `fiefs` that ADR 014 never needed; a march as one more entry of a
slot the fief already has (ADR 012, ADR 018); a loot rolled at the arrival,
which no read could derive from the stored march; men drawn out of the
count, so that the peasants they occupy come free while they walk (ADR
007, ADR 018). The owner grilled the slice on 2026-09-28 (#255), took the
recommended option on every question, and its sixteen decisions bound the
tickets; the ticketing found six points the decisions left open, and the
owner accepted the default of each on 2026-09-29, correcting one: the
content ships 3 per hour per yielded resource and a carry of 48, not 10
and 50, so the longest stay fills the carry exactly. This ADR records what
S13 shipped, PRs #267 and #269 to #273, and the lore proposals of #268;
where the code stands over a ticket it records the code. The screens
(#264, #265) are recorded as Decision 14 fixes them and the mockup of #259
draws them.

## Decision

- **A march is one order: infantry from the fief to a free plot of its
  kingdom, and back.** The reach is every plot the map bounds (ADR 014): a
  province from 1 to `lastOccupiedProvince + 1`, the map's `lastProvince`,
  and a plot from 1 to `plotsPerProvince`, read through `KingdomMapReader`
  and the catalog at dispatch. A target outside is refused
  `MarchTargetOutOfBounds { province, plot }`, a new member of
  `DomainError`, never the map's `ProvinceNotFound` (404): a march is a
  mutation and its refusals answer 409 like every other slot refusal. The
  fief's own plot is refused `MarchToOwnPlot`; a plot holding a fief,
  listed by `holdersIn`, is refused `PlotHeld { province, plot }`. Only
  kingdom 1 exists, and the march never leaves the fief's kingdom.
- **The road is timed by the map.** `marchOneWaySeconds(from, to, forage)`
  is `|Δprovince| × secondsPerProvince + |Δplot| × secondsPerPlot`, and the
  way back costs the same. No season slows the road (ADR 016, ADR 017
  untouched). The shipped content, 600 and 60 seconds, makes one province
  and five plots of road 15 minutes each way.
- **The forage terms are content** (ADR 008, N5). `forage` in
  `apps/api/content/fief.json`, parsed by the strict `ForageTermsSchema`
  inside `FiefContentSchema` and handed to the domain as
  `FiefSettings.forage` (`ForageTerms`):
  `secondsPerProvince`, `secondsPerPlot`, `carryPerInfantry` and
  `maxStayHours`, whole counts from 1, and `yieldPerHour`, a record over
  the three terrains of the five resources, `gold` the literal 0, so a
  content file that yields gold fails the api at start-up. Shipped: 600,
  60, 48, 8, and 3 per hour on lowlands food and wood, uplands wood and
  stone, ridges stone and iron. The terrain is the province's,
  `terrainOf(province)` (ADR 014), never a plot's.
- **The loot is fixed at dispatch and splits the carry evenly.** The player
  picks a stay of 1 to `maxStayHours` whole hours, refused
  `StayOutOfRange { stayHours }` outside it. `forageLootOf(terrain,
  infantry, stayHours, forage)` answers, for every resource the terrain
  yields above 0, `min(infantry × rate × hours, floor(carryPerInfantry ×
  infantry / yielded))`, `yielded` the number of resources the terrain
  yields, and 0 for the others, gold forced to 0 whatever the terms say.
  The owner's default read the divisor as 2; the code divides by the count
  of yielded resources, the same 2 for every shipped terrain, and holds for
  content that yields one or three. With the shipped content the longest
  stay brings `8 × 3 = 24` per infantry and resource, exactly `48 / 2`, so
  every hour of stay counts and the carry never binds before the last one:
  twelve infantry on the uplands for two hours bring 72 wood and 72 stone,
  one infantry for eight hours brings 48 against a cost of 60. The loot is
  stored on the march; nothing on the road or at the plot changes it, and
  the resolve credits what is stored.
- **One march slot per fief, and the infantry away stay counted.**
  `Fief.march` is `March`: idle, or away with `province`, `plot`,
  `infantry`, `stayHours`, `departedAt`, `oneWaySeconds` and `loot`.
  `Fief.unitsAtHomeAt(at)` is `unitCountsAt(at)` less the away march's
  infantry; the count itself does not change, so the men away keep their
  peasants occupied (ADR 018) and the overview's `units` counts them. A
  march asking more infantry than are at home at dispatch, delivered units
  counting, is refused `NotEnoughInfantryAtHome { infantry, atHome }`; a
  second march while one is away, `MarchSlotBusy`. A march debits nothing
  and stamps no `storedAt`; the build slot, the build queue, the study slot
  and the recruit slot are untouched by it, and it by them.
- **The refusals come in one order**, as the default of #255 fixed it:
  the `dispatchMarch` use case asks `Fief.roomForMarch` first
  (`InvalidUnitCount` for an infantry count below 1 or fractional, then
  `StayOutOfRange`, then `MarchSlotBusy`), then the target
  (`MarchTargetOutOfBounds`, `MarchToOwnPlot`, `PlotHeld`), then the men
  at home (`NotEnoughInfantryAtHome`). The bounds and the own plot never
  coincide, since the own plot is always on the map.
- **The plot is checked free at dispatch and is neither reserved nor
  depleted.** The check reads `KingdomMapReader` on the pool, outside the
  transaction and lock-free (ADR 014), so it does not serialize against a
  founding; two lords may forage one plot at once, and a fief founded there
  after the march left changes nothing. No table holds a plot.
- **The phases are derived on read.** `marchInstantsOf(march)` answers
  `arrivesAt = departedAt + oneWaySeconds`, `leavesAt = arrivesAt +
  stayHours × 3600` and `returnsAt = leavesAt + oneWaySeconds`;
  `marchPhaseAt(march, at)` answers `outbound` before the arrival,
  `foraging` before the leave and `returning` after it, an instant on a
  boundary reading the later phase. Nothing is stored per phase, and no
  process moves the men (ADR 005, N2).
- **The resolve closes the march at `returnsAt`, on one timeline with the
  finished upgrades, the finished study and the ended recruit order** (ADR
  005, ADR 012, ADR 016, ADR 018). `resolveUpgrade` takes the earliest of
  the four finishes at or before `now`; for a march it materializes the
  stocks to `returnsAt` and `Fief.completeMarch` credits the loot to them
  even above the capacity, where they freeze as a refund does (ADR 011),
  stores `returnsAt` as `storedAt` and leaves the march slot idle. No unit
  count and no peasant changes: the men were counted all along. On a tie
  the upgrade applies first, then the study, then the order, then the
  march, and their events follow that order. `Fief.restore` refuses an
  away march returning before `storedAt` (`SlotFinishesBeforeStored`, with
  `returnsAt` as `finishesAt`), an `infantry` or a `stayHours` that is not
  a whole count from 1, a negative or fractional `oneWaySeconds` and a
  negative loot.
- **The chronicle gains a seventh event kind, march returned** (ADR 013,
  amended): `marchReturned { province, plot, infantry, loot }`, one per
  march, stamped with `returnsAt`, never the `now` of the read that closed
  it, written in the resolve's transaction after the upgrade, the study and
  the recruits delivered of a tied instant. It carries no level, no unit
  and no refund; its wire schema is strict.
- **Persistence: one table and two event columns, migration 0014** (ADR
  006), alone in its wave. `fief_marches`, `fief_id` its primary key
  cascading on the fief, so one march per fief; `province`, `plot`,
  `infantry`, `stay_hours` and `one_way_seconds` each checked from 1;
  `departed_at`; five `loot_*` under the whole-amount check the stocks
  carry. No row is an idle slot; `save` replaces the row in the fief's
  transaction and `fiefOf` adds one more left join, at most one row, read
  from the first (N2). `fief_event_kind` gains `march_returned`;
  `fief_events` gains a nullable `province` and `plot`, and a
  march-returned row is a unit row, `unit` infantry with the infantry in
  `count`, the loot in the `refund_*` columns and the target in `province`
  and `plot`, the default the owner accepted on #255 rather than five
  `loot_*` columns and an `infantry` column. The check
  `fief_events_one_subject` is replaced: `province` and `plot` both null,
  or both from 1 on a unit row only; it still names no kind (the ADD VALUE
  rule, ADR 018). Every row stored before it reads as before.
- **The wire answers `march` and `forageTerms` as data, and `POST
  /fief/marches` sends one** (ADR 010). `FiefOverview.march` is `null` or
  a strict `{ province, plot, terrain, infantry, stayHours, departedAt,
  oneWaySeconds, loot, arrivesAt, leavesAt, returnsAt }`: the stored facts,
  the target's terrain from `terrainOf` and the three instants of
  `marchInstantsOf`, no phase field and no `unitsAtHome` field, the owner's
  default: the phase is what the read instant makes of the instants, and
  the men at home are `units.infantry` less `march.infantry`.
  `forageTerms` copies the content field by field so the form previews from
  the server's terms (N1). `DispatchMarchRequest` is `{ province, plot,
  infantry, stayHours }`, whole counts from 1; a body that fails it answers
  400 `MalformedRequest`, so an infantry count or a stay below 1 never
  reaches the use case. The route runs the resolve and then `dispatchMarch`
  in one transaction through `mutateAfterResolve`, so a march returned by
  then frees the slot first; the map reader is passed beside the
  transaction's stores, never inside them (ADR 014). `PlotHeld`,
  `MarchToOwnPlot`, `NotEnoughInfantryAtHome`, `MarchSlotBusy`,
  `StayOutOfRange` and `MarchTargetOutOfBounds` answer 409 with their kind
  in `ApiErrorKindSchema` and the Spanish line of the lore.
- **Screen: the map sends, the army section shows** (Decision 14, #259,
  #264, #265). Every free plot on `/mapa` carries the action *Enviar una
  marcha*, never a held plot nor the lord's own; it opens a form inline
  under the province grid with the infantry and the hours, previewing from
  `forageTerms` the road one way, the time until the return and the loot,
  and marking a shortfall in men against the count at home (N1: the server
  decides, the preview is display). The army section shows the march slot
  under the levy, idle or in its phase line, with one countdown to
  `returnsAt` and the loot line; the unit card reads the men at home and
  the men away. The web re-reads at `returnsAt` only, and the phase between
  reads is display interpolation (M8). A hand-drawn march icon, a signpost,
  joins the Design System (`docs/art/art-bible.md`, UI icons); the mockup
  stands at version 15 and the Design System at 14.
- **Lore first** (ADR 010). The march, the forage, the loot, the slot, the
  three phases, the countdown, the action, the form, the six refusals, the
  chronicle line and the terrain yields are proposals for the author in
  `docs/lore/world.md` (The land), `docs/lore/names.md` (The marches) and
  `docs/lore/chronicle.md` (#268); `apps/web/src/copy.ts` mirrors them
  until accepted.
- **No combat, no recall, no season.** The march meets no one, and every
  interaction between players stays in W1. There is no recall in this
  slice: the stored march holds what a recall needs, the target, the men,
  `departedAt` and `oneWaySeconds`, as ADR 018 left the cancel to S11. No
  season touches the road or the forage: `marchOneWaySeconds` and
  `forageLootOf` read no clock and no season.

## Considered options

- **Combat, scouting, a march that meets another lord.** Out of scope of
  #255 and of W1: the target is a free plot by definition, and a plot with
  a fief is refused.
- **A march as an entry of the recruit slot or of the build slot.**
  Rejected as ADR 012 and ADR 018 rejected their slots: a march is neither
  the drill ground's nor the masons' work, and a slot of its own keeps the
  refusals and the resolve step apart.
- **Draw the men out of the count while they march**, freeing their
  peasants. Rejected: ADR 018 makes every unit occupy peasants and the
  lore keeps the men away among the fief's hands; a fief that enqueued on
  the peasants of men on the road would owe them back at the return, a
  cascade the queue has no rule for. `unitsAtHomeAt` derives the men at
  home, and the count never moves.
- **A loot rolled at the arrival or at the return**, from the terrain, the
  season or luck. Rejected by ADR 005 and N1: the resolve must derive the
  close from the stored march alone, a roll would need storing or would
  make the close nondeterministic, and the form could not preview it.
- **Cap the loot at the total carry, with no per-resource split.**
  Rejected: two resources at equal rates would need a rule for which one
  yields first; an even share, floored, is one formula the form previews.
- **A fixed divisor of 2**, as the default of #255 wrote it. The code
  divides by the count of resources the terrain yields, the same value for
  the shipped terrains, so content that yields one or three resources
  splits its carry without a code change.
- **10 per hour and a carry of 50.** Rejected by the owner: the carry would
  bind from the third hour, so a stay of 3 to 8 hours brought the same
  loot; 3 per hour and 48 fill the carry at the eighth hour exactly.
- **Reserve or deplete the plot.** Rejected: a plot table beside `fiefs`
  (ADR 014 has none), a reservation that needs an expiry, a job (W7) or a
  read that clears it, and nothing to contend for while marches meet no
  one.
- **Reuse `ProvinceNotFound` (404) for a target outside the bounds.**
  Rejected: a mutation's refusal answers 409 with its kind, and the plot
  bound is not a province bound; `MarchTargetOutOfBounds` names both.
- **Refuse the loot, or bring nothing home, when a fief is founded on the
  plot after the march left.** Rejected: the loot is fixed at dispatch and
  the plot is checked once; the march was sent to a free plot.
- **A stored phase, or a row per phase change.** Rejected: three instants
  derive from four stored numbers, and a stored phase would need a process
  to advance it (N2).
- **Two more finishes, at the arrival and at the leave.** Rejected:
  nothing on the fief changes when the men arrive or leave the plot; the
  return is the one finish, and the resolve walks one step per march.
- **Land the loot as a rate while the men forage.** Rejected: a stock's
  rate derives from the building and art levels, the terrain and the season
  (ADR 005, ADR 016); a resource that grows away from the fief, stops and
  then lands is three rules for one number the dispatch already fixed.
- **Clamp the loot at the capacity.** Rejected: refunds land above the
  capacity and freeze (ADR 011, ADR 012), and a march that lost its loot to
  a full warehouse would punish the lord for a bound the form could not
  show while the men were away.
- **A `unitsAtHome` field, or a phase field, on the wire.** Rejected as the
  owner's default: both derive from fields already on the wire, and a
  phase field would go stale between reads.
- **Five `loot_*` columns and an `infantry` column on `fief_events`.**
  Rejected: the loot reads as a refund does, amounts that came into the
  stores, and `count` already holds a unit count on a unit row; two
  columns, `province` and `plot`, are all the row lacked.
- **Tie the event kind to its columns in the check.** Rejected by Postgres,
  as ADR 018 recorded: a migration may not use the enum value it adds.
- **Read the map inside the fief's transaction.** Rejected: ADR 014 keeps
  the reader lock-free on the pool, and since the plot is neither reserved
  nor depleted the race with a founding is harmless.
- **A recall, a second march, a season on the road or the forage, plot
  depletion, other kingdoms, other unit kinds, units drawn on the map,
  upkeep or famine (W9), generated images (S4).** Out of scope of #255,
  each a future ADR, an amendment of this one or a ticket.

## Consequences

- PRD W1 is amended: ADR 018 admits recruiting and ADR 019 forage marches
  to a free plot; armies, marches that meet another lord and combat stay
  out. S13 is added under Should have, citing this ADR. ADR 013 is amended
  for the seventh event kind, and ADR 014 for the one action the map now
  takes, which lifts "Nothing is started from the map". PRD S2 still reads
  the map as browsed and S3 four event kinds; Decision 16 amends neither,
  as ADR 018 left S3.
- `CONTEXT.md` rewrites **March**, defines **Forage**, **Loot** and **March
  slot**, and extends **Unit** (at home, away), **Resolve**, **Event**
  (seven kinds) and **Kingdom map** (the march action). **Army** and
  **Scout** stay under W1: whether infantry on a forage march are an army
  is the lore's call (#256).
- `packages/domain` gains `march/` (`March`, `AwayMarch`, `forageLootOf`,
  `marchOneWaySeconds`, `marchInstantsOf`, `marchPhaseAt`), `ForageTerms`
  and `FiefSettings.forage`, `MarchOrder`, `Fief.march`,
  `Fief.roomForMarch`, `Fief.dispatchMarch`, `Fief.completeMarch` and
  `Fief.unitsAtHomeAt`, the `dispatchMarch` use case, the first mutation
  that reads `KingdomMapReader`, the event `marchReturned` and the errors
  `PlotHeld`, `MarchToOwnPlot`, `NotEnoughInfantryAtHome`,
  `MarchSlotBusy`, `StayOutOfRange` and `MarchTargetOutOfBounds`;
  `terrainOf` is exported for the overview. Every `FiefSettings` fixture
  carries `forage` and every `StoredFief` fixture a `march`.
- `packages/contracts` gains `ForageTermsSchema`, shared by
  `FiefContent.forage` and `FiefOverview.forageTerms`, `march` and
  `forageTerms` on `FiefOverviewSchema`, `marchReturned` on
  `FiefEventSchema`, `DispatchMarchRequestSchema` and the six refusals on
  `ApiErrorKindSchema`; no Spanish enters it (ADR 010).
- Postgres gains `fief_marches`, `march_returned` and the two event
  columns (0014), in a wave of one, as every schema change is.
- **Each return floors the stocks once more**, as any finish step and any
  season boundary does (ADR 016, ADR 018): the price of one timeline.
- The wire's `units` counts the infantry away, so a client reads the men
  at home as `units.infantry − march.infantry`, and one that sends more is
  refused 409 with `NotEnoughInfantryAtHome`, never trusted (N1).
- The free check is lock-free, so a plot founded between the check and
  the save is foraged anyway; Decision 6 makes that harmless, and the
  march to a province past the last held one stays valid after a fief
  settles there.
- With the shipped content the loot is a trickle against the costs: one
  infantry brings 48 of two resources in eight hours and cost 60 to
  recruit; a march is not an economy, and tuning it is a content edit.
- A march-returned row reuses `count` and the `refund_*` columns; only the
  adapter's exhaustive switch ties them to the kind, as it does for the
  cancels.
- Known gap: `Fief.restore` accepts an `oneWaySeconds` of 0, refusing only
  a negative or a fractional one, while the check
  `fief_marches_one_way_seconds_positive` refuses the row. No shipped march
  reaches 0, since the own plot is refused and every other plot is at least
  one plot of road away, but a fixture may restore what the store would
  not hold; a follow-up aligns the two.
- Known gap: the lore reads an infantry count below 1 as `InvalidUnitCount`;
  the shipped request schema refuses it before the use case with 400
  `MalformedRequest`, and the form's own line keeps it from being sent.
  The domain refusal stands for a caller that bypasses the wire.
- Known gap: `StayOutOfRange` carries `stayHours` only, since `Fief.restore`
  has no catalog to read `maxStayHours`, and both Spanish copies of its
  line, `apps/api/src/http/answerRefusal.ts` and `apps/web/src/copy.ts`,
  hardcode *de 1 a 8 horas enteras*: a content change to `maxStayHours`
  leaves the refusal line wrong until both are edited.
- Known gap: the lore proposals of #268 wait for the author; until
  accepted, `apps/web/src/copy.ts` mirrors them. The march icon is a
  hand-drawn line SVG and the march has no generated image (S4).
- #264 and #265 are recorded here as Decision 14 fixes them, not as
  shipped; the ADR is amended if either corrects a decision.
- Out of scope of #255, each a future ADR or an amendment of this one:
  combat, scouting, any interaction between players, a recall of a march,
  more than one march per fief, a season on the forage or on the road,
  plot depletion or reservation, other kingdoms, units drawn on the map,
  other unit kinds, upkeep or famine (W9), generated images (S4).

## Amendment (2026-09-29)

S14 (#277) supersedes "There is no recall in this slice" in the decision
"No combat, no recall, no season", the considered option "A recall, a second
march, ..." and the out-of-scope line of the Consequences: a march is now
recalled on its way out or at the plot. Combat and seasons stay out. The
owner grilled it on 2026-09-29 and took the recommended option on every
question; this records what S14 shipped, PRs #285 to #291 and the lore
proposals of #278 (PR #286), where the code stands over the tickets.

- **A march is recalled while outbound or foraging, never while returning.**
  `marchPhaseAt` reads the instant of the recall: a boundary reads the later
  phase, so a recall exactly at `arrivesAt` is foraging with nothing
  foraged, and a recall at `leavesAt` or after is returning and refused. A
  march already home when the recall arrives is closed by the resolve first
  and refused as not found, as ADR 018's amendment refuses a recruit order
  that already ended.
- **The return depends on the phase.** Recalled outbound, the men turn back
  where they stand and walk as long as they walked:
  `returnsAt = recalledAt + (recalledAt - departedAt)`. Recalled foraging,
  they walk the full road back: `returnsAt = recalledAt + oneWaySeconds`.
- **The partial loot is computed in whole milliseconds.** Recalled outbound
  it is nothing. Recalled foraging, per resource the terrain yields it is
  `floor(infantry × ratePerHour × foragedMilliseconds / 3_600_000)`, the
  foraged time being `recalledAt - arrivesAt` in milliseconds, capped at the
  even carry share `floor(carryPerInfantry × infantry / yielded)` as
  `forageLootOf` caps it, and never gold. `forageLootOfMilliseconds` holds
  the formula and `forageLootOf` calls it with `stayHours` in milliseconds,
  so dispatch and recall share one rule; a fractional count of seconds never
  enters it, as `materializeResources` floors in milliseconds too. The
  recall overwrites the loot stored at dispatch.
- **Worked numbers**, with the shipped terms. Ten infantry on the uplands,
  840 seconds each way, two hours of stay (the domain fixture), recalled
  1 800 seconds after the arrival: `floor(10 × 3 × 1800 / 3600) = 15` wood
  and 15 stone, against 60 each had they stayed; the carry share is 240 and
  does not bind. Twelve infantry on the lore march, 900 seconds each way:
  recalled 1 800 seconds after the arrival they bring 18 of each; recalled
  1 150 seconds after it, `floor(12 × 3 × 1150 / 3600) = 11`.
- **The instants derive from `recalledAt` on read** (ADR 005, N2).
  `AwayMarch` gains an optional `recalledAt`. `marchInstantsOf` answers, for
  a recalled march, `arrivesAt = min(departedAt + oneWaySeconds,
  recalledAt)`, `leavesAt = recalledAt` and `returnsAt = recalledAt +
  (arrivesAt - departedAt)`. That is both returns above, and a march
  recalled on the way out answers `arrivesAt = leavesAt = recalledAt`.
  `marchPhaseAt`, the resolve's closing of the march and the web's phase
  read a recalled march with no change of code. No timer runs; time comes
  through `Clock`.
- **The domain.** `Fief.recallMarch(target, now, forage)` takes a
  `MarchTarget { departedAt }` and refuses `MarchNotFound { departedAt }`
  when the slot is idle or holds a march departed at another instant
  (compared by epoch milliseconds), so a stale tab never recalls a newer
  march, then `MarchAlreadyReturning`, which carries no field, as
  `MarchSlotBusy` does; both are new members of `DomainError`. It writes no
  event and moves no stock: the resolve credits the loot at the return, so
  neither `recallMarch` nor its use case takes a chronicle or materializes
  the stocks. `Fief.restore` refuses a stored `recalledAt` before
  `departedAt`, or at or after the `leavesAt` the unrecalled march would
  have, as `SlotStartsAfterFinish`.
- **The resolve closes it as any march.** At the recalled `returnsAt` the
  resolve credits the partial loot even above the capacity, where it freezes
  as a refund does (ADR 011), and leaves the march slot idle; the tie order
  of ADR 019 is unchanged.
- **The chronicle gains no event kind; `marchReturned` gains `recalled`**
  (ADR 013). `marchReturned { province, plot, infantry, loot, recalled }`,
  still one per march, stamped with `returnsAt` and written at the return in
  the resolve's transaction. `recalled` is true when the closed march
  carries a `recalledAt`. The chronicle stays at seven kinds; the wire's
  `recalled` is a required boolean of the strict schema, and its Spanish
  line is a lore proposal of #278 that waits for the author.
- **Persistence: two columns and two checks, migration 0015** (ADR 006),
  alone in its wave. `fief_marches.recalled_at` is nullable under
  `fief_marches_recalled_after_departure`, null or at or after `departed_at`;
  `fief_events.recalled` is `boolean NOT NULL DEFAULT false` under
  `fief_events_recalled_only_march`, so older rows read `false` with no
  backfill. That check compares `kind::text` with `'march_returned'` and not
  the enum value: Drizzle's migrator runs every pending migration in one
  transaction, so a database still at 0013 runs the `ADD VALUE` of 0014 and
  the check of 0015 together, and Postgres refuses to use an enum value in
  the transaction that adds it. The cast reads the label as text instead.
- **The route is `POST /fief/marches/:departedAt/recall`, not `DELETE`:**
  the march still exists while it walks home. `departedAt`, an ISO instant
  in the path, is validated by `RecallMarchRequestSchema { departedAt }`
  and names the march. The route runs the resolve and then `recallMarch` in
  one transaction through `mutateAfterResolve`, and answers the fief
  overview. `MarchNotFound` and `MarchAlreadyReturning` answer 409 with
  their kind in `ApiErrorKindSchema` and a Spanish line. A `departedAt`
  that fails the schema answers 400 `MalformedRequest` with an empty body,
  as every malformed request does, never an `ApiErrorKind`.
- **The wire answers `recalledAt`.** `FiefOverview.march` gains
  `recalledAt`, an instant or `null` when not recalled; its `arrivesAt`,
  `leavesAt` and `returnsAt` are those `marchInstantsOf` derives, so a
  client reads the phase from them and no phase field is added.
- **Screen (Decision 8 of #277, shipped in PR #291).** One direct button on the army section's march
  slot, shown outbound and foraging only, with no confirmation dialog, as
  *Cancelar la leva* has none; after the recall the card shows the returning
  countdown to the new `returnsAt`, and a march recalled on the road shows no
  *Botín* line. No design ticket. The button's copy is a
  lore proposal of #278 that waits for the author.

Nothing else here changes: one march at a time, the road, the terms and the
loot at dispatch, the men away still counted, the seven event kinds and the
resolve's tie order stand. A recall while returning, a confirmation, a
second march, a season on the road or the forage and combat stay out. PRD
W1 is unchanged, S14 is added under Should have citing this ADR as amended,
and `CONTEXT.md` gains **Recall**, adjusts **March**, **Loot** and **Event**.
Known gap: the lore proposals of #278 wait for the author.

## Second amendment (2026-09-29)

S15 (ADR 020) supersedes "No combat" in the decision "No combat, no
recall, no season" and lifts "Combat, scouting, a march that meets
another lord" from the considered options as far as the bandits go: the
march slot takes a second order, `attack`, beside `forage`, on `AwayMarch`
discriminated by `order`. An attack goes to a camp's plot, checked as a
forage's target is and refused `PlotHasNoCamp` where no camp stands, and
a forage to a camp's plot is refused `PlotHasCamp`. It walks the same road
with no stay: `stayHours` is 0, `marchInstantsOf` answers `leavesAt =
arrivesAt`, and `marchPhaseAt` reads it outbound and then returning. Its
loot is fixed at dispatch as the forage loot is, from the camp's strength
and the predicted survivors, in thirds with gold, capped by the survivors'
carry. The battle is a fifth finish of the resolve at the arrival, between
the recruit order and the march; the dead leave the count then, and a won
attack keeps the march with the survivors, so `marchReturned` counts them,
while a lost attack idles the slot at the arrival with no return. The
recall of the amendment above is allowed only outbound, before the battle:
at or after the arrival it is refused `MarchAlreadyReturning` for a won
attack and `MarchNotFound` for a lost one, with no new rule. `fief_marches`
gains `march_order`, `camp_tier`, `camp_strength` and `fought` (migration
0016), and the wire's `march` is a union on `order`. Nothing else here
changes: one march at a time, the road, the forage terms and its loot, the
men away still counted and the tie order of the four earlier finishes
stand; a march that meets another lord stays out.
