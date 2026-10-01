---
status: accepted
date: 2026-09-29
---
# Infantry attack bandit camps

## Context

PRD W1 kept armies, marches and combat out of the phase. ADR 018 reopened
it for recruiting and ADR 019 for forage marches to a free plot, and the
map (ADR 014) now takes one order, a march that meets no one and fights no
one. Infantry that only forage are a levy with nothing to lose, and the
lore has always shown the land no lord has reached yet as land someone
holds (`docs/lore/world.md`, The land). S15 reopens W1 one step further,
for the first combat, and keeps it PvE: bandit camps squat on some free
plots, and the march slot sends the infantry to fight one. The obvious
designs pull in what the earlier ADRs ruled out: a table of camps seeded
in advance, when ADR 014 derives the terrain from the province number and
holds no table beside `fiefs`; a strength that ticks back up by a job
(ADR 005, N2, W7); a battle rolled at the arrival, which no read could
derive from the stored march and no form could preview; a second slot for
the attack, when ADR 019 gave the fief one march slot; a battle that
happens at the return, when the dead should leave the count the hour they
fell; another lord as the target, which pulls in every interaction between
players. The owner grilled the slice on 2026-09-29 (#292), took the
recommended option on every question, and its fourteen decisions bound the
tickets; the ticketing found nine points the decisions left open and the
owner accepted the default of each. This ADR records what S15 shipped, PRs
#306 and #308 to #314, and the lore proposals of #307; where the code
stands over a ticket it records the code. The screens shipped after it,
#303 as PR #316 and #305 as PR #317, as Decision 4 fixes them and the
mockup of #295 draws them.

## Decision

- **A camp sits on a content fraction of the free plots, placed by a hash
  and never a table.** `campOf(address, camps)` mixes the plot's
  `kingdom`, `province` and `plot` through a fixed integer hash and places
  a camp when the high bits of the hash fall under
  `campFraction × 2^24`; the low byte modulo 3 gives the tier, 1, 2 or 3,
  near-uniform over the hash (256 values split 86/85/85). Two calls for one plot answer the same camp, and
  no row anywhere says where a camp is, as `terrainOf` derives the terrain
  (ADR 014). A camp stands on a free plot only: a fief founded on its
  plot erases it, since the map answers a camp on a free plot alone and
  every mutation checks the plot free first. The sign-up rule of ADR 014
  is unchanged: the founding takes the lowest free plot, camp or no camp.
  The worked plot of the lore, province 2 plot 7, is illustrative; the
  shipped hash places no camp there.
- **The camp terms are content** (ADR 008, N5). `camps` in
  `apps/api/content/fief.json`, parsed by the strict `CampTermsSchema`
  inside `FiefContentSchema` and handed to the domain as
  `FiefSettings.camps` (`CampTerms`): `campFraction`, a number from 0 to
  1; `lootPerStrength`, a whole count from 1; and `tiers`, a record keyed
  1, 2 and 3 of `{ maxStrength, regrowHours }`, whole counts from 1.
  `UnitTermsSchema` gains `strength`, a whole count from 1. Shipped: 0.2,
  60, tiers 6 in 6 h, 15 in 12 h and 40 in 24 h, and an infantry strength
  of 1. A camp fraction of 0 places no camp at all.
- **A camp's state is one row per battle, shared by every lord, and its
  strength regrows lazily** (ADR 005, N2). `CampBattle { kingdom,
  province, plot, strength, foughtAt }` is the camp's strength after a
  battle and the arrival that fought it, recorded through the
  `CampRegistry` port (`lastBattleOf`, `lastBattlesIn`, `record`),
  insert-only and never pruned. A plot's state is its latest `foughtAt`,
  and a tie is read by the latest insert, so "the last arrival writes"
  holds whatever order the attackers' reads resolve in.
  `campStrengthAt(tier, lastBattle, at)` answers the tier's `maxStrength`
  for a camp never fought, and otherwise `min(maxStrength, stored +
  floor(maxStrength × elapsed / regrowHours))`, `elapsed` the hours since
  `foughtAt` and never negative: the regrowth is a rate, the tier's max
  per its regrow hours, floored, so a camp left at 1 is full sooner than
  one at 0. With the shipped content a tier 1 camp beaten to 0 reads 1 an
  hour later and 6 after six; a tier 3 one reads 5 after three hours. No
  timer touches a camp; time comes through `Clock`.
- **The attack is a second order of the one march slot, with no stay.**
  `AwayMarch` is `ForageMarch | AttackMarch` on `order`; an attack adds
  `camp { tier, strength }`, the camp as fixed at dispatch, and `fought`.
  It reuses the road, the slot and the instants of ADR 019 with
  `stayHours` 0: `marchInstantsOf` answers `leavesAt = arrivesAt`, so
  `marchPhaseAt` reads an attack outbound and then returning from its
  arrival, with no foraging phase, and the web's phase read agrees without
  a change of code. One march at a time, forage or attack; the men away
  stay counted and keep their peasants (ADR 018, ADR 019).
- **The refusals, in this order.** `Fief.roomForAttack` refuses
  `InvalidUnitCount` (a count below 1 or fractional) before any battle is
  computed, since `battleOf(0, 0, s)` has no answer, then `MarchSlotBusy`;
  `refuseUnreachableTarget` then refuses `MarchTargetOutOfBounds`,
  `MarchToOwnPlot` and `PlotHeld` as ADR 019 does; the use case then
  refuses `PlotHasNoCamp { province, plot }` when `campOf` places no camp;
  `Fief.dispatchAttack` last refuses `NotEnoughInfantryAtHome`. A forage
  march to a camp's plot is refused `PlotHasCamp { province, plot }` by
  `dispatchMarch`, after the target checks and before the men at home.
  Both are new members of `DomainError` and answer 409 with their kind in
  `ApiErrorKindSchema` and the Spanish line of the lore. A camp erased by
  a fief founded on its plot since the map was read answers `PlotHeld`
  first.
- **The camp is read inside the send's transaction, at the strength of
  the send.** `dispatchAttack` reads `lastBattleOf` through the
  transaction's `CampRegistry`, never the pool: `mutateAfterResolve` runs
  the resolve first, and that resolve may record the lord's own earlier
  battle on the same camp, uncommitted, which a pool read would miss. The
  camp may have regrown, or another lord may have fought it, between the
  map read and the send, so the march stores the strength the men will
  fight and the answer says which; the map keeps reading on the pool,
  lock-free, as ADR 014 keeps it.
- **The whole outcome is fixed at dispatch and derives from the snapshot.**
  `battleOf(infantry, campStrength, infantryStrength)` is deterministic:
  the lord's strength is `infantry × infantryStrength`, the higher strength
  wins and a tie goes to the camp. The loser falls whole. The winner loses
  `ceil(n × r²)`, `r` the rival's strength over its own, in integers:
  `ceil(C² / (n × s²))` for a winning lord, `C` the camp's strength and
  `s` an infantry's, since the float form misrounds 25 infantry against 10
  (5 lost instead of 4); a defending camp loses `ceil(S² / C)`, `S` the
  lord's strength. The winner always keeps at least one, `min(n − 1, …)`
  for the lord and `min(C − 1, …)` for the camp. The march stores the
  loot of the predicted survivors, so the form previews the battle, the
  losses and the loot from the same terms (N1), and nothing on the road
  changes them but a recall before the battle. A camp at strength 0 can
  be attacked: won, nothing lost, nothing brought.
- **The loot is 60 per point, in thirds with gold, capped by the
  survivors' carry.** `attackLootOf(terrain, campStrength, survivors,
  camps, forage)` answers, for each of the two resources the terrain
  forages (ADR 019) and for gold, `floor(min(lootPerStrength ×
  campStrength, carryPerInfantry × survivors) / (yielded + 1))`,
  `yielded` the count of resources the terrain yields; the other two
  resources are 0. The carry is `forage.carryPerInfantry`, not a second
  number, and the camp strength fought is the stored snapshot, whether the
  camp still stands at it. A lost battle has no survivors and brings
  nothing. With the shipped content, 10 infantry against a tier 1 camp at
  6 win, lose 4 and bring 96 of each of three resources (the carry of 6
  caps 360); 12 against it lose 3 and bring 120 of each; 12 against a
  tier 2 camp at 15 all fall and the camp keeps 5; 20 against it lose 12
  and bring 128 of each; 30 against it lose 8 and bring 300 of each; 6
  against 6 is the camp's, which keeps 1; 41 against 40 leaves 1
  survivor.
- **The battle is fought at the arrival, on the resolve's one timeline**
  (ADR 005, ADR 019). `resolveUpgrade` gains a fifth finish, `battle`,
  for an attack not yet fought and not recalled whose `arrivesAt` is at or
  before `now`, placed between the recruit order and the march in the tie
  order: the upgrade first, then the study, then the order, then the
  battle, then the march. It reads the infantry strength from the content
  in force and `Fief.completeBattle` stores the stocks the resolve
  materialized to `arrivesAt`, stores that instant as `storedAt`, lowers the stored infantry count by
  the infantry lost and, when won, keeps the march with `infantry` at the
  survivors and `fought` true; when lost, it idles the march slot at the
  arrival and no `marchReturned` follows. The resolve answers the camp's
  new state beside the events, `strength − campLost` at `arrivesAt`, and
  records it through the transaction's registry after the fief is saved
  and before the chronicle, so a refused record rolls the whole read
  back. A recalled attack derives `arrivesAt = recalledAt` (ADR 019 as
  amended) and fights no one.
- **The dead leave the count at the battle, and the survivors are the
  march's men.** Once the stored count drops, the men at home,
  `unitsAtHomeAt`, are the count less `march.infantry`, so the march must
  hold the survivors or the men at home come out short; a won attack's
  `marchReturned` therefore counts the survivors. Peasants are derived
  (ADR 007, ADR 018), so the dead free theirs with no code of their own.
  `DrizzleFiefRepository.save` deletes a `fief_units` row whose count
  drops to 0, the follow-up ADR 018 left, now required: it upserted only
  the counts above 0, so a count that fell to 0 read back unchanged.
- **A battle during an open recruit order folds the delivered units
  first.** `completeBattle` settles the deliveries at `arrivesAt`: the
  units delivered by then move into the stored count, and the order
  shrinks to the remainder, its `startedAt` moved forward by `delivered ×
  perUnitSeconds` and its `cost` scaled per unit by `shareOf`. Without the
  fold the stored count went negative when the dead outnumbered the stored
  men, and the save or the restore refused the fief. The order's closing
  `recruitsDelivered` line therefore counts only the remainder (ADR 018 as
  amended).
- **A recall is allowed only outbound, before the battle.** The shipped
  recall of ADR 019 as amended refuses `MarchAlreadyReturning` at or after
  `leavesAt`, which for an attack is the arrival, so a recall at or after
  the battle is refused with no new rule: a won attack is already
  returning, and a lost one has idled the slot, which answers
  `MarchNotFound`. An attack recalled on the road writes the S14 line
  alone and no battle.
- **The chronicle gains an eighth event kind, battle fought** (ADR 013,
  amended): `battleFought { province, plot, tier, won, infantryLost,
  campLost }`, one per attack fought, stamped with `arrivesAt`, never the
  `now` of the read that fought it, written in the resolve's transaction
  after the recruits delivered of a tied instant and before the march
  returned. Both counts are written even when one is 0. A won attack goes
  on to write `marchReturned` at the return with the survivors and the
  loot, gold among it for the first time; a lost attack writes the battle
  alone. Its wire schema is strict, `tier` a literal 1, 2 or 3.
- **Persistence: two migrations, each alone in its wave** (ADR 006, ADR
  019 as amended). Migration 0016 adds the enum `march_order` and
  `fief_marches.march_order NOT NULL DEFAULT 'forage'`, nullable
  `camp_tier` and `camp_strength`, and `fought NOT NULL DEFAULT false`,
  so every stored march reads as a forage; it replaces
  `fief_marches_stay_hours_positive` by `fief_marches_order_terms`, which
  ties a forage to `stay_hours >= 1` and null camp columns and an attack
  to `stay_hours = 0`, a tier from 1 to 3 and a strength from 0, comparing
  `march_order::text` since the enum is created in the same batch. It
  creates `camp_battles`, an identity `id`, `kingdom`, `province`, `plot`,
  `strength` from 0 and `fought_at`, indexed on the plot and then
  `fought_at, id`, no foreign key. Migration 0017 adds `battle_fought` to
  `fief_event_kind`, nullable `camp_tier` and `camp_lost` and `won NOT
  NULL DEFAULT false` on `fief_events`, and
  `fief_events_battle_terms`: a battle row is a unit row (`count` the
  infantry lost, `province`, `plot`) plus a tier from 1 to 3, a camp loss
  from 0 and `won`, tied to `battle_fought` by `kind::text` (Decision 13
  of #292): Drizzle runs every pending migration in one transaction, and
  Postgres refuses to use an enum value in the transaction that adds it.
  Every row stored before either reads as before.
- **The wire answers the camp, the order and the combat terms as data,
  and `POST /fief/marches/attack` sends one** (ADR 010).
  `FiefOverview.march` is a discriminated union on `order`: a forage with
  `stayHours` from 1, `camp` null and `fought` false, or an attack with
  `stayHours` the literal 0, a strict `camp { tier, strength }` and a
  boolean `fought`; both keep the instants of `marchInstantsOf`, no phase
  field. `combatTerms` copies `infantryStrength`, `lootPerStrength` and
  the `tiers` from the content so the form previews from the server's
  terms (N1). `ProvinceMap` gives each plot a `camp`, null on a held plot
  or a free plot without one, or `{ tier, strength }` at the read instant
  through `readProvinceMap`, which reads `lastBattlesIn` on the pool and
  resolves nothing. `DispatchAttackRequest` is `{ province, plot,
  infantry }`, whole counts from 1; a body that fails it answers 400
  `MalformedRequest`. The route runs the resolve and then
  `dispatchAttack` in one transaction through `mutateAfterResolve` and
  answers the fief overview, whose `march.camp.strength` is the strength
  the men will fight.
- **Screens (Decision 4 of #292, the mockup of #295, shipped as PR #316
  and PR #317).** A camp's plot on `/mapa` reads its tier and strength behind
  a tent icon and carries *Atacar el campamento* in place of *Enviar una
  marcha*; the form has the infantry field alone and previews the road,
  the return, the camp, the outcome, the losses, the bandits' losses, the
  survivors and the loot from `combatTerms` and the camp as the map shows
  it, marking a shortfall in men and blocking no battle read as lost; the
  sent state states in words the strength the server fixed, which may
  differ from the preview, never marking the difference by colour alone.
  The army section's march card reads the two attack phases with
  the survivors, the *Campamento* line, the loot with gold and the S14
  recall button outbound only; a recalled attack reads *Marcha de vuelta*
  with no *Campamento* line, as it never fought; a lost attack idles the slot from the
  battle and the unit card counts the men at home. The web re-reads at an
  unfought attack's `arrivesAt` as well as at `returnsAt`, since the
  battle changes the count and may idle the slot. A hand-drawn camp icon,
  a tent with a pennant, joins the Design System (`docs/art/art-bible.md`,
  UI icons); the mockup stands at version 16 and the Design System at 15.
- **Lore first** (ADR 010). The bandits, the camp, its tier and strength,
  the plot line, the action, the form and its preview, the two phases, the
  recall, the two refusals, the worked battles and the battle line are
  proposals for the author in `docs/lore/world.md` (The land),
  `docs/lore/names.md` (The map, The marches) and
  `docs/lore/chronicle.md` (#307); `apps/web/src/copy.ts` mirrors the
  refusals and the chronicle lines until accepted. *Ejército* stays
  reserved for the army of W1 and the split of *marcha* is an open
  question of the lore.
- **No PvP, no scouting, no season.** The attack meets the bandits and no
  one else: every march that meets another lord, scouting and any
  interaction between players stay in W1. No season touches combat:
  `battleOf`, `attackLootOf` and `campStrengthAt` read no season, and the
  road stays as ADR 019 timed it. Two lords attacking one camp each fight
  their own snapshot, and the last arrival writes the camp's state; a
  camp's state is as fresh as its attackers' last reads, since a battle
  is recorded when the attacker's fief is next resolved.

## Considered options

- **PvP, scouting, a march that meets another lord.** Out of scope of
  #292 and of W1: a camp is a plot's, held by no lord, so nothing a player
  does reaches another player.
- **A table of camps, seeded in advance or written at founding.**
  Rejected as ADR 014 rejected a table of provinces: a hash on the
  coordinates answers every plot with no row, no seeding and no bound on
  the kingdom's size, and a fief founded on the plot erases the camp with
  no delete.
- **A camp per plot, or the tier from the plot number.** Rejected: one
  free plot in five keeps the map mostly foragable, and a tier tied to the
  plot number would make every province's plot 3 the same camp.
- **The strength as a count ticked up by a job**, or stored and advanced
  on read. Rejected by ADR 005, N2 and W7: the strength derives from the
  last battle, the tier's terms and the read instant, and a camp never
  fought needs no row at all.
- **One row per camp, updated in place.** Rejected: an insert per battle
  needs no lock and no upsert, the latest row is the state by
  `fought_at, id`, and two lords' battles resolve in whatever order their
  reads commit with no lost update to reason about.
- **A camp's strength read at the arrival**, so the men fight the camp as
  it stands when they reach it. Rejected by ADR 005 and N1: the form
  could not preview the outcome, the resolve would read the registry to
  derive a close, and a battle fought against a value another lord's
  resolve writes concurrently would depend on the transaction order.
- **A random battle.** Rejected: a roll would need storing or would make
  the resolve nondeterministic, and the lore's counted men have one end.
- **Losses as `n × r²` in floats, rounded once.** Rejected by the owner's
  default: 25 infantry against 10 lose 4 by the integer form and 5 by the
  float one, and the integer form is one `ceil` the form previews.
- **A second slot for the attack, or an attack alongside a forage.**
  Rejected: the same men walk the same road, one march at a time is
  Decision 5, and a second slot would double the phase reads, the recall
  and the resolve step.
- **The battle at the return**, one finish as ADR 019 kept it. Rejected:
  the dead would stay counted, and occupying peasants, for the whole road
  home, and a lost attack would walk an empty march back.
- **A recall after the battle.** Rejected as out of scope of #292: the
  survivors are already returning, and the shipped recall refuses them
  with no new rule.
- **A separate carry for the loot, or a loot in the forage's two
  resources only.** Rejected: `carryPerInfantry` is what a man carries
  whatever he carries, and gold is the bandits' hoard, the one way gold
  enters a fief besides its base rate.
- **The battle event at the return, folded into `marchReturned`.**
  Rejected: a lost attack has no return, and the battle happened at the
  arrival; the roll records endings at their hour (ADR 013).
- **One migration for both tables and the event.** Rejected by the S14
  notes and ADR 019 as amended: the event kind cannot land in the domain
  before its columns and its wire kind, since the chronicle adapters
  switch exhaustively over the kinds, so the battle landed in the resolve
  with the camp record and no event, and the event followed.
- **Read the camp on the pool at dispatch**, as the map is read.
  Rejected: the resolve that runs before the send may have recorded the
  lord's own battle on that camp, uncommitted; the transaction's registry
  reads it, the pool would not.
- **Delete the men at dispatch, or keep the dead in the count until the
  return.** Rejected: the men away stay counted (ADR 019), and the dead
  leave the count the hour they fell, so the peasants come free then.
- **A season on combat, camps that move or strike, other unit kinds,
  units drawn on the map, generated images (S4).** Out of scope of #292,
  each a future ADR, an amendment of this one or a ticket.

## Consequences

- PRD W1 is amended: ADR 020 admits attacks on bandit camps; PvP, scouting
  and marches that meet another lord stay out. S15 is added under Should
  have, citing this ADR. ADR 013 is amended for the eighth event kind, ADR
  014 for the camps the map shows and the attack it sends, ADR 018 for
  the fold of the recruit order at the battle, and ADR 019 for the second
  march order.
- `CONTEXT.md` defines **Camp**, **Tier**, **Strength**, **Attack** and
  **Battle**, and extends **March** (two orders), **Loot** (an attack's),
  **Unit** (the dead leave the count), **Event** (eight kinds),
  **Resolve** (the battle at the arrival), **Kingdom map** (the camps) and
  **Army**, as #293 settled it: the forage march and the attack are the
  yard's errands, not the army of W1. `raid` now says what to use for an
  attack.
- `packages/domain` gains `camp/` (`CampTier`, `CampBattle`, `campOf`,
  `campStrengthAt`, `battleOf`, `attackLootOf`), the `CampRegistry` port,
  `CampTerms` and `FiefSettings.camps`, `UnitTerms.strength`,
  `AttackMarch` and `AttackedCamp`, `Fief.roomForAttack`,
  `Fief.dispatchAttack` and `Fief.completeBattle`, the `dispatchAttack`
  use case, the fifth finish of `resolveUpgrade`, which now takes `camps`,
  the camps of `readProvinceMap`, the event `battleFought` and the errors
  `PlotHasCamp`, `PlotHasNoCamp` and `InvalidCamp`. `Fief.restore` refuses
  an attack with a stay other than 0, a tier outside 1 to 3 or a fractional
  or negative strength, and a forage with a camp at the type level.
- `packages/contracts` gains `CampTermsSchema` and `CampTiersSchema`,
  `UnitTermsSchema.strength`, the `order` union of `FiefOverview.march`,
  `combatTerms`, `camp` on `ProvinceMapSchema`'s plots, `battleFought` on
  `FiefEventSchema`, `DispatchAttackRequestSchema` and the two refusals on
  `ApiErrorKindSchema`; no Spanish enters it (ADR 010).
- Postgres gains `march_order`, the four march columns and
  `camp_battles` (0016), and `battle_fought` with the three event columns
  (0017), each in a wave of one. `camp_battles` grows by one row per
  battle for ever; pruning it is a ticket once a measurement asks for one
  (N2).
- `apps/api` gains `DrizzleCampRegistry`, in the transaction stores for
  the resolve and the send and on the pool for the map as `CampReader`,
  `POST /fief/marches/attack`, and the `CampRegistry` contract suite run
  against the in-memory and the Drizzle adapters, tie rule included.
- **Each battle floors the stocks once more**, as any finish step does
  (ADR 016, ADR 018, ADR 019): the price of one timeline.
- A plain read of the fief now writes a camp row when a battle has
  passed, beside the events (ADR 013); the map still writes nothing.
- The wire's `units` counts the survivors away once the battle is
  resolved, so a client reads the men at home as `units.infantry −
  march.infantry` before and after it with one rule.
- With the shipped content a won attack is worth more than a forage: 12
  infantry bring 360 from a tier 1 camp on the lore's worked road,
  against 144 from two hours of foraging there, and lose 3 men worth 180
  in cost.
  Tuning it is a content edit.
- Known gap: the attack snapshot stores the camp's strength but not the
  infantry's. The resolve reads `units.infantry.strength` from the content
  in force at the arrival, so a content change between the dispatch and
  the arrival can flip the predicted outcome, while the loot stays as it
  was fixed at dispatch.
- Known gap: `Fief.restore` does not check that an open recruit order's
  `cost` divides evenly by its `count`; the fold at the battle and the
  cancel both assume it does.
- Known gap: `campStrengthAt` clamps a negative elapsed to 0, so an `at`
  before the battle's instant answers the stored strength; every shipped
  caller passes an instant at or after it.
- Known gap: the lore proposals of #307 wait for the author; until
  accepted, `apps/web/src/copy.ts` mirrors them. The camp icon is a
  hand-drawn line SVG on the plot tile; `camps/camp-{1,2,3}.png`
  shipped in #324 (PR #332) and the attack form shows them in #326.
- #303 and #305 shipped as PR #316 and PR #317 after this ADR. The sent
  state dropped the mockup's ochre for the server's strength, and a
  recalled attack reads as a forage march on its way back; neither
  changes a decision.
- Out of scope of #292, each a future ADR or an amendment of this one:
  PvP, scouting, any march that meets another lord, a season on combat, a
  recall after the battle, a second march at a time, other unit kinds,
  camps that move or strike, units drawn on the map, generated images.
