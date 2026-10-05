---
status: accepted
date: 2026-10-05
---
# Transport between a lord's fiefs

## Context

ADR 023 gave a lord a second fief and kept the two apart: "Nothing
moves between a lord's fiefs, neither stocks nor units", `MarchToOwnPlot`
refused a march to any fief of the sending lord (Decision 8 of #378),
and PRD W4 read "transport between a lord's fiefs and more than two
fiefs stay out". A second fief opens with the stocks of a first one and
nothing built, beside a fief that may sit at its capacity, so S19
reopens W4 one more step: resources carried from one of a lord's fiefs
to the other. Every layer assumed a march touches one fief: no march
order debited a stock at dispatch, every mutation locked one fief's row
(`mutateAfterResolve`, N4), a fief read touched one fief (N2), and the
resolve credited a fief only what its own slots finished. The obvious
designs pull in what the earlier ADRs and the rules ruled out: a cargo
credited when a timer runs out, when no process advances state (ADR
005, W7); a read of the destination that resolves the origin's march to
learn what is coming, when a fief read is one round trip over one fief
(N2); two fiefs locked in the order a request names them, which
deadlocks two transports sent each way at once; a foreign key from a
march row to the other fief, on a row `save` deletes and reinserts; a
cargo above the carry trimmed by the client, when the server is the
only source of truth (N1); a reset of the stored marches and events,
when a schema change is a migration. The owner grilled and confirmed
the slice on 2026-10-03 (#408), and its eleven decisions bound the
tickets; the ticketing wrote nine defaults into #408, and the owner
confirmed each. This ADR records what S19 shipped, PRs #420 to #426,
the lore proposals of #409 (PR #419) and the design of #410; where the
code stands over a ticket or over the mockup it records the code: the
march card and the sent state name the destination by its plot alone,
the cargo card has no progress track, a second cargo is not refused but
cannot meet a pending one, and the form shows one blocking reason at a
time.

## Decision

- **A transport carries resources between a lord's two fiefs, and
  nothing else moves** (Decisions 1 and 2 of #408). The cargo is an
  amount of each of wood, stone, iron, gold and food. No unit is
  stationed at the other fief: the party walks there and back and is
  counted on the fief it left throughout. The cap of ADR 023 stands at
  2, so "the other fief" names one fief.
- **The transport is the fourth march order** (Decision 3, Default).
  `AwayMarch` is `ForageMarch | AttackMarch | FoundingMarch |
  TransportMarch`; a `TransportMarch` is a march on the road with
  `order: 'transport'`, `toFiefId` and `cargo`, a `Stocks`. Its
  `province` and `plot` are the destination's, its `stayHours` 0, its
  `loot` 0 of every resource and its `lootPercent` the season's, stored
  to keep the one shape of ADR 022, to no effect. It holds the origin's
  one march slot (ADR 019) until the party is home. The carriers are
  the infantry, carry 48, and the cavalry, carry 120, from
  `apps/api/content/fief.json`; `carryOf` sums each kind's count times
  its carry, and no art and no season scales it. A party that holds a
  settler is refused `UnitUnfitForOrder { unit: 'settler', order:
  'transport' }` by `refuseUnfitUnits`. There is no new unit kind.
- **The cargo is debited at dispatch, the first march order that
  debits** (Decision 4). The use case `dispatchTransport({ playerId,
  fiefId, toFiefId, units, cargo })` refuses, writing nothing and in
  this order: `FiefNotFound { fiefId }` for the origin;
  `InvalidUnitCount`, `UnitUnfitForOrder`, `NegativeResourceAmount`,
  `EmptyCargo` and `MarchSlotBusy` from `Fief.roomForTransport`;
  `MarchToOwnPlot` when `toFiefId` is the sending fief; `FiefNotFound {
  fiefId: toFiefId }` for an unknown fief or another lord's; and from
  `Fief.dispatchTransport` `NotEnoughUnitsAtHome`, `CargoAboveCarry {
  cargo, carry }` when the summed cargo is above `carryOf(units)`, a
  cargo equal to the carry being sent, and last `InsufficientResources
  { missing }` against the stocks materialized at the dispatch instant.
  `EmptyCargo` and `CargoAboveCarry` are new members of `DomainError`,
  each answered 409 with its kind in `ApiErrorKindSchema`. The use case
  reads `clock.now()` once, debits the cargo from the origin's stocks
  at that instant, stores the march and `storedAt`, and saves the
  origin and then the destination.
- **A transport to the lord's other fief is not `MarchToOwnPlot`**
  (Decision 1, Default). The transport names its destination by fief id
  and never passes `refuseUnreachableTarget`, so a forage, an attack
  and a founding aimed at any own fief are still refused as ADR 023
  left them. `MarchToOwnPlot` answers a transport only toward the fief
  it leaves. `toFiefId` is checked against `fiefsOf(playerId)` before
  that fief is read, so a hand-built request never reads, and never
  locks, the destination of another lord (#413); it and an unknown id
  answer the same 404.
- **The road is one way and has no stay** (Decision 5). The road is the
  `marchOneWaySeconds` of every march between the two plots, over the
  road percent of the slowest kind sent and the season's road percent
  at dispatch (ADR 021, ADR 022), fixed at dispatch and stored as
  `oneWaySeconds`. With the shipped content, from 1:3:12 to 1:2:7, 900
  seconds of base road: 6 riders carry 720 and ride 450 seconds, 338
  sent in an autumn of 75 %; 12 infantry carry 576 and walk 900
  seconds, 675 in autumn; 300 wood, 200 stone and 220 iron fill the
  riders' 720, and 721 is refused. The party turns home at the arrival
  and rides back empty (Decision 8): the riders are home 900 seconds
  after leaving.
- **The cargo on its way is stored on the destination and credited by
  its own resolve** (Decision 6; ADR 005, N2). The dispatch stores an
  `IncomingCargo` on the destination: `fromFiefId`, the origin's
  `name`, `province` and `plot`, the `cargo` and `arrivesAt`, the
  march's arrival; the destination's `storedAt` does not move.
  `resolveUpgrade` gains a seventh finish, `arrivedCargoOf`, due when
  `arrivesAt` is at or before `now`: `Fief.completeCargo` adds the
  cargo to the stocks materialized at `arrivesAt`, with no clamp, so
  above the capacity they freeze as a refund's do (ADR 011, ADR 019),
  sets `storedAt = arrivesAt` and clears the cargo. The arrival is
  applied by the next read of the destination or its next accepted
  mutation, never by the origin's: each fief read still touches one
  fief, and no timer and no job credits it. The cargo stores the
  origin's name and plot so the card and the chronicle line name it
  without reading the origin.
- **Finishes of one instant apply the cargo last** (Default). The order
  is the upgrade, the study, the recruit order, the battle, the
  founding, the march's return and then the arrived cargo:
  `earliestFinishedOf` folds them in that order and replaces only on a
  strictly earlier instant.
- **At most one cargo is on its way to a fief** (Decision 6).
  `fief_incoming_cargo` is keyed by its fief, so the store holds one.
  Nothing refuses a second: the other fief is the only sender, it has
  one march slot, a transport not recalled delivers at its arrival and
  is home a road later, a recall drops the cargo, and a dispatch
  resolves both fiefs first, so an arrived cargo is credited before the
  next is stored. `dispatchTransport` replaces what the destination
  holds, and with a cap of 2 it never holds any by then.
- **A recalled transport carries its cargo home** (Decision 7,
  Default; ADR 019 as amended). `Fief.recallMarch` recalls it outbound
  alone, since its stay is 0: from the arrival on it answers
  `MarchAlreadyReturning`. `recalledLootOf` answers the march's cargo
  as its `loot`, and the use case `recallMarch` saves the origin and
  then `destination.dropCargoFrom(origin.id)`, which clears the cargo
  only when it came from that fief: the destination loses it at the
  recall instant, in the transaction of the recall. The party walks
  back as long as it walked, and the return credits the cargo to the
  origin even above the capacity, as a recalled forage's loot (S14).
  Recalled 300 seconds out, the six riders are home at 600 seconds with
  the 720.
- **A two-fief mutation locks every fief of the lord in ascending id**
  (Decision 7, Default; N4). `mutateFiefPairAfterResolve` reads
  `fiefsOf(playerId)` inside one transaction, sorts the ids ascending,
  reads each `FOR UPDATE OF fiefs` in that order, resolves each at one
  instant, the latest of the clock and every locked `storedAt`, and
  then runs the mutation at that instant. Two transports sent each way
  at once, or a recall racing a transport from the other fief,
  serialize instead of deadlocking. The dispatch of a transport and
  every recall go through it, whatever the march's order, since the
  order is known only under the lock; resolving both fiefs first also
  makes a recall after a credited arrival read the march returning.
  Every other mutation keeps the one-fief `mutateAfterResolve`.
- **No foreign key points at the other fief** (Default).
  `fief_marches.to_fief_id` and `fief_incoming_cargo.from_fief_id` are
  plain uuids. `DrizzleFiefRepository.save` deletes and reinserts the
  march row and the cargo row on every save, and a foreign key would
  take `FOR KEY SHARE` on a row the other fief's mutation holds `FOR
  UPDATE`. `fief_incoming_cargo.fief_id` references its own fief,
  `ON DELETE cascade`, and no other.
- **Persistence: two migrations, each alone in its wave** (ADR 006).
  0025 adds `transport` to `march_order`, a nullable `to_fief_id` and
  five nullable `cargo_*` columns to `fief_marches`, the check
  `fief_marches_transport_cargo` (a transport holds all six and a cargo
  of at least 1, every other order none), the whole-amount checks, and
  a transport branch in `fief_marches_order_terms` (stay 0, no camp,
  not fought, no founding name, no settler); it creates
  `fief_incoming_cargo`, primary key `fief_id`, with `from_fief_id`,
  `from_name`, `from_province`, `from_plot`, the five `cargo_*` amounts
  and `arrives_at`. 0026 adds `transport_sent` and `transport_arrived`
  to `fief_event_kind` and rewrites `fief_events_founding_name` so
  `fief_name` is held by the four kinds that name a fief; it adds no
  column, the cargo of an event being stored in the `refund_*` columns
  as a returned march's loot is. Every check compares `::text` (ADR 019
  as amended). Marches and events stored before read as before, under
  the migration tests.
- **The chronicle gains two kinds, twelve in all** (Decision 10,
  Default; ADR 013). `FiefEvent` gains `transportSent` and
  `transportArrived`, each `{ province, plot, name, cargo, occurredAt
  }` of the other fief. `dispatchTransport` records one `transportSent`
  on the origin at the dispatch instant, after both saves, naming the
  destination: the second event written at a dispatch, since the
  stocks leave at that instant. The destination's resolve answers one
  `transportArrived` stamped with `arrivesAt`, naming the origin from
  the stored cargo. The party's return is the `marchReturned` of every
  march, on the origin, with the destination's plot: no loot when it
  delivered, and `recalled` true with the cargo as its `loot` when
  recalled. A recalled transport writes no `transportArrived`, and its
  `transportSent` stays.
- **The wire** (N1, ADR 010). `POST /fiefs/:fiefId/marches/transport`
  takes `DispatchTransportRequestSchema`, a strict `{ toFiefId, units,
  cargo }`: a uuid, a party of at least one unit and five whole
  amounts from 0; a cargo of 0 passes the schema and is refused
  `EmptyCargo`. It answers the origin's overview. `FiefOverview.march`
  gains the `transport` variant with `toFiefId` and `cargo`, `stayHours`
  0, `camp: null` and `fought: false`; `FiefOverview.incomingCargo` is
  null or a strict `{ fromFiefId, from: { name, province, plot },
  cargo, arrivesAt }`; `FiefEventSchema` gains the two kinds. The api's
  line for `CargoAboveCarry` carries both figures, and
  `InsufficientResources` on this route reads *para esa carga*
  (#412). Each wire change crossed the contracts, the api and the web
  in one PR.
- **Screens** (Decision 9, #410; PRs #425 and #426). On the map the
  lord's other fief, and no other plot, carries *Enviar un transporte*.
  Its form holds the convoy image, the infantry and rider counts with
  no settler field, five amount fields, the live *Carga: 720 de 720*,
  *Camino de ida* and *Llegada en*, and no *Vuelta en*.
  `transportFormOf` blocks, in this order, on a march away, a count or
  amount that is not a whole number, an empty party or too few men at
  home, an empty cargo, a cargo above the carry and a cargo above the
  stores. The march card reads *Marcha de transporte:* with *Carga:*
  and counts to the arrival while outbound, then *Vuelta del
  transporte:* and *Vuelta en*; the recall is offered while outbound.
  The destination's fief screen shows `CargoCard`, *Carga en camino*,
  first in the slot column above the build slot: the image, *Desde* the
  origin's name and plot, the amounts and the countdown, and it re-reads
  the fief at the arrival. The chronicle reads *Transporte enviado:*
  and *Transporte recibido:* with the other fief's name and plot.
- **The march card and the sent state name the destination by its plot
  alone** (owner, 2026-10-05, on #408). They read as the lore line
  does, *Marcha de transporte: 6 jinetes a provincia 2, parcela 7*;
  #416's "the destination's name and plot" is superseded by the lore.
  The wire's march carries no name.
- **One generated image, the convoy, with no people** (Decision 11,
  owner 2026-10-03; N7, #411, PR #424). `convoy.png` is the one image
  of the new `convoys` family of `docs/art/catalog.md`, at
  `apps/web/public/art/convoys/` with its prompt beside it: two laden
  carts on a road, the escort implied by the arms lashed to them. The
  bible's `no people` holds and gains no exception; the accent is the
  warehouse's ochre and umber. `convoyArtOf()` is the one place a
  screen reads it from, and the cargo card and the transport form are
  its two consumers. Its file name is the family's own word, not a
  `CONTEXT.md` term.
- **Lore first** (ADR 010). *Transporte*, *la carga*, the form, the
  card's lines, the refusals and the chronicle lines are proposals for
  the author in `docs/lore/` (#409, PR #419), except *Carga en camino*,
  the owner's words; `apps/web/src/copy.ts` and
  `apps/api/src/http/answerRefusal.ts` mirror them until accepted. The
  identifiers say *cargo*, never *delivery*, which the recruit order
  holds (`recruitsDelivered`, `Fief.deliveriesSettledAt`).
- **Nothing else changes: no stationing of units, no third fief, no
  transport to another lord.** Units never stay at the other fief, the
  cap is 2, and a transport reaches only a fief of the sending lord, so
  no march meets another lord (W1) and nothing is traded (W3). There is
  no market, no carry bonus from an art or a season, and no image but
  the convoy: units keep their hand-drawn icons (S4). The forage, the
  attack, the founding, the battle, the camps and the seasons are those
  of ADR 019 to ADR 023.

## Considered options

- **Stationing or moving units between fiefs, more than two fiefs,
  transport to another lord, a market, a carry bonus.** Out of scope of
  #408: resources between two own fiefs is the smallest step that makes
  the second fief worth its settler, and each of these is a slice of
  its own.
- **A timer, or a job, that credits the cargo at its arrival.**
  Rejected by ADR 005 and W7: the arrival is a finish of the
  destination, applied by the read that follows it (N2).
- **The cargo credited by the origin's resolve, or a destination read
  that resolves the origin's march.** Rejected by Decision 6: either
  makes one fief's read write or read the other. The cargo stored on
  the destination keeps each read on one fief; the price is a second
  row written at the dispatch and dropped at the recall.
- **The cargo debited at the arrival, or held in escrow outside both
  fiefs.** Rejected by Decision 4: the stocks leave when the party
  does, so a cargo cannot be spent twice and the origin's read needs
  nothing of the destination.
- **A cargo trimmed to the carry or to the stocks.** Rejected: the
  server refuses with a named reason and its figures, as every order
  does (N1), and the form shows the live carry.
- **A new carrier kind, or the settler's cart as one.** Rejected by
  Decision 3: content already gives infantry and cavalry a carry, and
  the settler's is 0.
- **A stay at the destination, or a party that stays there.** Rejected
  by Decisions 2 and 5: a stay with nothing to gather is a wait, and a
  party that stays is stationing.
- **A loaded way back, or a round trip that brings a second cargo.**
  Rejected by Decision 8: the other fief sends its own transport from
  its own slot.
- **Two fiefs locked in the order the request names them, or the origin
  first.** Rejected at the ticketing: two transports sent each way lock
  in opposite orders and deadlock. Ascending `fiefs.id` is the same for
  both.
- **Only the two fiefs of the transport locked.** Left out: the helper
  locks `fiefsOf(playerId)`, which at a cap of 2 is those two, and a
  recall cannot name the other fief before the lock.
- **The transport recall on its own route, the other recalls on the
  one-fief helper.** Rejected at the ticketing: the route cannot know a
  march's order before the lock, so every recall takes the two-fief
  helper.
- **A foreign key from `to_fief_id` or `from_fief_id` to `fiefs`.**
  Rejected at the ticketing: `save` reinserts those rows on every save,
  and the key would lock a row of the other fief against its own
  mutation.
- **A refusal while the destination still holds a cargo.** Left out
  (#413): the recall drops the cargo and the dispatch resolves both
  fiefs first, so the case cannot arise at a cap of 2; the test `keeps
  one incoming cargo per fief` pins it.
- **The cargo lost, or left to arrive, when the transport is
  recalled.** Rejected by Decision 7: the men carried it out and carry
  it back. Left to arrive was the interim between #412 and #413, which
  lost nothing; the other order of tickets would have left an arrived
  but uncredited cargo.
- **The cargo credited before the other finishes of its instant.**
  Rejected by the Default: it is the one finish that comes from another
  fief, so the fief's own works apply first.
- **New event kinds for the return, or the cargo read from the origin
  at the arrival.** Rejected by the Defaults: `marchReturned` already
  stores a loot, and the stored cargo names its origin.
- **No event at the dispatch** (ADR 013). Rejected by the Default: the
  stocks leave the origin at that instant, and `transportSent` is the
  record of the debit, as `foundingSent` is of the claim.
- **The destination's name on the march card and the sent state.**
  Rejected by the owner on 2026-10-05: the lore line reads the plot,
  and the map's tile beside it already names the fief.
- **A progress track on the cargo card.** Left out (PR #425):
  `incomingCargo` carries no `departedAt`, so the card has no span to
  draw. Adding one is a contracts ticket of its own, pending the owner.
- **An escort drawn on the convoy, as an exception to `no people`.**
  Rejected by the owner on 2026-10-03: arms on the carts imply it.
- **An image per carrier kind or per resource.** Out of scope of #408:
  one image, no tiers.
- **One migration for the order and the events.** Rejected by the wave
  plan: the order and its table landed with the march (#412), the
  event kinds with the chronicle (#414), each a wave of one.

## Consequences

- The docs came last, after every code ticket merged, and describe only
  merged work as shipped. PRD W4 is amended: ADR 024 admits transport
  between a lord's fiefs while more than two fiefs stay out; S4 names
  the convoy among the generated images; S19 is added under Should
  have. ADR 023 is amended for the transport that is not
  `MarchToOwnPlot`, and ADR 019 for the fourth order, the cargo debited
  at dispatch and the recalled transport that carries it home. This ADR
  is the record of the eleventh and twelfth event kinds and of the
  second event written at a dispatch (ADR 013).
- `CONTEXT.md` defines **Cargo**, names the transport in **March**, the
  cargo's arrival in **Resolve** and the twelve kinds in **Event**, and
  adjusts **Fief**, **Kingdom map**, **Unit**, **Party**, **Recall**
  and **Chronicle**. `docs/art/art-bible.md` records that the convoy's
  file name is not a `CONTEXT.md` term.
- `packages/domain` gains `TransportMarch`, `IncomingCargo`,
  `TransportOrder`, `Fief.roomForTransport`, `Fief.dispatchTransport`,
  `Fief.completeCargo`, `Fief.dropCargoFrom`, the use case
  `dispatchTransport`, the events `transportSent` and
  `transportArrived` and the errors `EmptyCargo` and `CargoAboveCarry`;
  `recallMarch` reads and saves the other fief for a transport.
  `packages/contracts` gains `DispatchTransportRequestSchema`, the
  `transport` march and `incomingCargo` on `FiefOverviewSchema`, the
  two events and the two refusals. `apps/api` gains
  `mutateFiefPairAfterResolve`. Postgres gains `transport` in
  `march_order`, the cargo columns and `fief_incoming_cargo` (0025) and
  the two event kinds (0026).
- A mutation of one fief can now write another: a dispatch stores the
  cargo on the destination and a recall drops it, each in one
  transaction under both locks (N4). A read still touches one fief
  (N2).
- A transport dispatch and every recall now lock and resolve every fief
  of the lord, where a recall locked one. At a cap of 2 that is one
  more row and one more resolve for each recall.
- A fief can be filled above its capacity from the other, where its
  production freezes until it spends down (ADR 011). The carry of the
  party and the origin's one march slot are the only limits; tuning
  them is a content edit.
- A lord of two fiefs can run one transport each way at once, one from
  each march slot, and a fief with a transport away sends no forage, no
  attack and no founding until the party is home.
- Known gap: a cargo is credited when the destination is next read or
  changed (ADR 005). Its stocks read right at any instant, but its
  `transportArrived` line is written by that read, stamped with the
  arrival.
- Known gap: the cargo card has no progress track, since
  `incomingCargo` carries no `departedAt` and the card has no span to
  draw (PR #425). Whether the wire gains the departure waits for the
  owner.
- Closed gap (#428): after a recall the march card read the cargo twice,
  under *Carga:* and under *Botín:*, since a recalled transport's `loot`
  is its cargo and the card drew any loot; the recalled-card test used a
  zero loot the api never answers. #428 fixed the card, which never draws
  *Botín:* for a transport, and the fixture, whose `loot` now equals its
  cargo; the domain and the wire stay as they are.
- Known gap: no test ties a march's return with an arrived cargo at one
  instant; the tie test pins the recruit order before the cargo, and
  the order after the return rests on `earliestFinishedOf`.
- Known gap: a mutation whose path names another lord's fief locks that
  fief's row, after the lord's own, before `ownFiefOf` refuses it (PR
  #421). It is so on every mutation route since ADR 023, and one
  follow-up should check ownership before the lock.
- Known gap: `Fief.restore` does not check a stored transport's
  `toFiefId`, nor that a stored incoming cargo is not empty; the
  store's checks cover the march's cargo and not the incoming one's
  total.
- Known gap: the transport form reads the stocks of the overview the
  map read once, not interpolated, so a lord who stays on the map can
  be blocked from a cargo the server would accept until a reload, and
  it repeats `carryOf` and `marchOneWaySeconds` in the browser; the
  server's answer wins (N1).
- Known gap: `copy.refusals.CargoAboveCarry` holds a line with no
  figures that is not in the lore, reached only by a refusal with no
  `message`, and the map's `InsufficientResources` line is a web copy
  of the one the api sends (PR #426).
- Known gap: the helper locks every fief of the lord and
  `dispatchTransport` replaces a pending cargo unrefused; both are
  right at a cap of 2 and are to be read again before the cap rises
  (ADR 023).
- Known gap: the lore proposals of #409 wait for the author, among them
  whether *transporte* holds and whether `InsufficientResources` keeps
  a line per order.
- Out of scope of #408, each a future ADR or an amendment of this one:
  more than two fiefs, stationing or moving units between fiefs,
  transport to another lord, a market, a carry bonus from an art or a
  season, any image but the convoy.
