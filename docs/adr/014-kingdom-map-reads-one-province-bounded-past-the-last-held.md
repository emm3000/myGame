---
status: accepted
date: 2026-09-28
---
# The kingdom map reads one province, bounded one past the last held

## Context

PRD S2 gives the player a kingdom map: the province their fief lies in and
its plots (`docs/lore/world.md`, The land). Every fief has held an address
`kingdom:province:plot` since migration 0000, unique under
`fiefs_coordinates_unique`, and a new fief takes the lowest free plot of
kingdom 1 (`lowestFreeCoordinates`, `foundFief`). Nothing shipped before S2
read those columns back as a map, and the obvious designs pull in more than
S2 asks: a whole-kingdom view, a table of provinces with their terrain, a
choice of plot at sign-up, a map that refreshes on a timer. The owner decided
the shape at the grilling of 2026-09-26 (#142, engram topic
`mygame/grilling-s1-s2-s3-s7`) and left four gaps to what already shipped;
this ADR records the decisions and the defaults after PRs #149 to #153.

## Decision

- The map shows **one province at a time**, read-only: every plot of the
  province, numbered 1 to `plotsPerProvince`, each free or holding a fief,
  the fief's name as its lord gave it, and the viewer's own fief marked.
  Nothing is started from the map.
- **Browsing is bounded by `lastProvince`**, the highest province of the
  viewer's kingdom holding a fief plus one, so the map always shows one
  empty province past the last settled one and never a province no lord
  could reach. A province below 1 or above `lastProvince` is refused
  `ProvinceNotFound` (404), never clamped to the bound. `/mapa` opens the
  viewer's own province; `/mapa/<n>` opens province n.
- **Terrain belongs to the province and is derived**, never content and
  never per plot: `terrainOf(province)` rotates lowlands, uplands, ridges on
  the province number. A fief's terrain is that of its province, so the
  `fiefs.terrain` column stays written at founding and is never read: the
  rate derivation and the map both call `terrainOf`.
- **`plotsPerProvince` is content**, 15 in `apps/api/content/fief.json`,
  read through the `BuildingCatalog` port (ADR 008), the same value the
  founding uses to lay out the lowest free plot.
- **A new sign-up takes the lowest free plot of kingdom 1.** S2 adds no
  choice of plot and no second kingdom: only kingdom 1 exists, the map reads
  the viewer's own kingdom and no kingdom is browsed.
- The domain reads the map through a **`KingdomMapReader` port**
  (`addressOf`, `lastOccupiedProvince`, `holdersIn`) and the
  **`readProvinceMap` use case**, which applies the bound, the plot count and
  the terrain and marks the viewer's fief by player id. The api implements
  the port **lock-free over the `fiefs` address columns**, on the pool and
  outside any transaction: no table, no column, no migration. The map
  resolves nothing and reads no stock (ADR 005, N2).
- The wire `ProvinceMap` is `{ kingdom, province, lastProvince, terrain,
  plots }`, each plot `{ plot, fief }` with `fief` null on a free plot or
  `{ name, isOwn }` on a held one. **No player id crosses the wire**; the
  viewer's fief is marked server-side (ADR 010, no Spanish).
- The web **reads the map when the screen opens and on each province
  change**, with no timer and no re-read while the province stays the same.
  A fief founded while the screen is open shows on the next change.

## Considered options

- **The whole kingdom on one screen.** Rejected: the kingdom grows one
  province per 15 fiefs with no upper bound, the plot count is content and
  the lore's map is a sheet showing one province (`docs/lore/world.md`).
- **Clamp a province past the bound to `lastProvince`**, or answer the
  viewer's own province. Rejected: a refusal names the bound and the web
  reads it from the wire; a silent clamp would show a province the player
  did not ask for.
- **A bound of the last held province, with no empty one beyond.** Rejected:
  the lore shows the land no lord has reached yet, and a player looking for
  where the next fief will be founded needs to see it.
- **Terrain per plot, or terrain as content behind the port (ADR 008).**
  Rejected: moving the terrain would change the rates of fiefs already
  founded, a migration this ADR avoids, and a per-plot terrain multiplies
  the content by the plot count for a bonus no plot has asked for.
- **Read `fiefs.terrain` back instead of deriving it.** Rejected: the column
  stores what `terrainOf` answers, and reading it would make the row a
  second source of truth for a value the province number already fixes.
- **A table of provinces, or a materialized `lastProvince`.** Rejected: a
  `max(province)` over `fiefs` answers the bound in one query, and a table
  seeded in advance would fix the kingdom's size before any lord reaches it.
- **Let the map read through `FiefRepository`.** Rejected: the map needs
  three narrow reads over every fief of a province and never a fief; a
  dedicated reader port keeps the repository's `occupiedPlots` for the
  founding and the map's queries lock-free (ADR 004).
- **Carry the player id on the wire and mark the viewer's fief in the web.**
  Rejected: the id of another player is nothing the web needs, and a boolean
  the use case sets keeps the rule in the domain.
- **A choice of plot at sign-up.** Rejected as out of scope of #142; the map
  is read to plan, never acted on, until a ticket says otherwise.

## Consequences

- PRD S2 is amended by row: the map shows one province at a time, the
  player's own first, browsable from province 1 to one past the last
  province holding a fief.
- `packages/domain` gains `ProvinceMap`, the `KingdomMapReader` port and
  `readProvinceMap`; `terrainOf` takes a province number, no longer
  `Coordinates`; `DomainError` gains `ProvinceNotFound` with the province
  asked and `lastProvince`.
- `apps/api` gains `DrizzleKingdomMapReader` on the pool, `GET /map` and
  `GET /map/:province`, and `MemoryKingdomMapReader` for the route tests. The
  schema is untouched: migration 0009 remains the last.
- `fiefs.terrain` is a column no code reads. Dropping it is a migration a
  later ticket may take; keeping it costs one enum value per row.
- The lowest free plot and the map share `plotsPerProvince`; changing the
  content value moves where the next fief is founded and how many plots the
  map draws, and a value lower than an existing fief's plot draws a map that
  omits that fief. That change is a content edit no ticket has asked for.
- The map's one-province-per-read shape scales with the plot count, never
  with the kingdom: every read costs three queries over indexed columns
  (N2).
- Marches, distance and a second kingdom (W1, W2) will need the map to name
  a kingdom other than the viewer's; that is a future ADR, and this port
  already takes the kingdom as a parameter.
- Known gap: the loading line `Estamos leyendo el mapa…` shipped in #148 is
  not in `docs/lore/names.md`; the author accepts or replaces it there. The
  map's lore (`docs/lore/names.md`, The map) is a proposal until the author
  accepts it. The follow-ups of the #153 review are #154.

## Amendment (2026-09-29)

The map is no longer read-only. S13 (ADR 019) sends a forage march from a
free plot: the `dispatchMarch` use case reads `lastOccupiedProvince` and
`holdersIn` through `KingdomMapReader`, on the pool and lock-free as this
ADR keeps it, to bound the target and refuse a held plot, and the web
offers *Enviar una marcha* on every free plot of `/mapa`, never on a held
one nor on the viewer's own, as Decision 14 of #255 fixes it (#264, not
yet shipped). That lifts "Nothing is started from the map"
and the rejection "the map is read to plan, never acted on, until a ticket
says otherwise"; the march is the one order the map takes. Nothing else
here changes: the map still shows one province at a time, bounded by
`lastProvince`, the terrain still derives from the province number, the
reader still reads no stock and resolves nothing, and no plot is reserved
or depleted by a march.

## Second amendment (2026-09-29)

The map shows more than fiefs and takes a second order. S15 (ADR 020)
places a bandit camp on a content fraction of the free plots by a hash of
the coordinates, as `terrainOf` derives the terrain: `readProvinceMap`
answers each free plot's `camp`, its tier and its strength at the read
instant, or null on a held plot or a free plot without one, reading the
camps' last battles through `CampRegistry` on the pool, lock-free and
resolving nothing, as this ADR keeps the reader. The `dispatchAttack` use
case reads `lastOccupiedProvince` and `holdersIn` as `dispatchMarch` does,
to bound the target and refuse a held plot first, and the web offers
*Atacar el campamento* on a camp's plot of `/mapa` in place of *Enviar una
marcha*, never on a held one nor on the viewer's own, as Decision 4 of
#292 fixes it (#303, not yet shipped). Nothing else here changes: the map
still shows one province at a time, bounded by `lastProvince`, the terrain
still derives from the province number, no plot is reserved or depleted,
and a fief founded on a camp's plot erases the camp, since the founding
still takes the lowest free plot.

## Third amendment (2026-10-02)

A plot can be reserved, a lord can hold two fiefs, and the map takes a
third order. S18 (ADR 023) lets a lord send one settler on a founding
march to a free plot with no camp, and the founding reserves its plot
from the dispatch until it is recalled or applied. That lifts "no plot
is reserved or depleted" from the two amendments above as far as a
founding goes; a forage and an attack still reserve nothing. The port
gains `reservationsIn(kingdom, province)`, which answers each founding
march neither recalled nor applied as `{ plot, playerId }`, on the pool
and lock-free as this ADR keeps the reader, and `readProvinceMap`
answers each plot's `reservation`: `{ isOwn }` on a reserved plot,
`isOwn` true for the viewer's own founding, and nothing on a held plot;
a reserved plot answers no camp. The wire plot is `{ plot, fief, camp,
reservation }`, `reservation` null or a strict `{ isOwn }`: the founder
is never named, and still no player id crosses the wire. The web shows
the plot as *reservada*, the founder's with the marker *Tu fundación*,
and offers no action on it to anyone; on a free plot with no camp and
no reservation it offers *Fundar un feudo* beside *Enviar una marcha*.

"A new sign-up takes the lowest free plot of kingdom 1" now skips a
reserved plot: `FiefRepository.occupiedPlots()` answers the held plots
and the reserved ones, so `lowestFreeCoordinates` never places a new
lord where a settler is bound. A lord's second fief does not take the
lowest free plot: it stands on the plot its founding was sent to, the
first plot a lord chooses, within the bound of this ADR. A reservation
does not move `lastProvince`, which still reads the fiefs alone; a fief
founded on the empty province past the last held one moves it, from the
read that applies its arrival.

Every fief of the viewer is marked `isOwn`, so a lord of two fiefs reads
both as own, in either's map, and a march to either is refused
`MarchToOwnPlot` (ADR 019 as amended). The map is read from a fief:
`addressOf` takes a `FiefId` and answers the address with its holder,
`readProvinceMap({ playerId, fiefId, province? })` opens on that fief's
province and refuses `FiefNotFound` for a fief that is not the
viewer's, and the routes are `GET /fiefs/:fiefId/map` and
`/map/:province` in place of `GET /map`, with the web's
`/feudo/$fiefId/mapa` in place of `/mapa`. The read costs five queries,
the address, the last held province, the holders, the reservations and
the camps' last battles, where this ADR counted three and the camps of
the second amendment added a fourth. Nothing else
here changes: one province at a time, bounded by `lastProvince`, the
terrain derived from the province number, the reader lock-free, reading
no stock and resolving nothing, and only kingdom 1.
