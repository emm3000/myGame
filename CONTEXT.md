# CONTEXT.md

Glossary of the game's domain. One line per term, the term as code and docs use it, and the OGame concept it replaces where one exists. Names a player sees come from `docs/lore/` first and enter here second; their Spanish labels are in `docs/lore/names.md`. Decisions behind the terms: `docs/adr/`.

## Holdings

- **Player** — an account; owns one or more fiefs. Identified by `PlayerId`.
- **Fief** — the holding a player develops: land, buildings, stores, peasants. Replaces *planet*. One per player in the MVP.
- **Coordinates** — `kingdom:province:plot`, the fief's place on the map. A new fief takes the lowest free plot. Replaces *galaxy:system:position*.
- **Kingdom** — the great region a fief lies in, a number in the data and a name on screen (Vadoalto is kingdom 1). Provinces and plots inside it are numbered. Replaces *galaxy*.
- **Terrain** — what a province is made of: lowlands, uplands or ridges. It raises the starting rate of the resource it favours and forbids nothing.
- **New land** — a second fief founded elsewhere. Replaces *colony*. Not in the MVP.

## Resources

- **Resource** — one of wood, stone, iron, gold, food. Each has an amount, a rate per hour and a capacity on a fief.
- **Wood / Stone / Iron** — the building materials, produced by the sawmill, the quarry and the iron mine. Replace *metal / crystal / deuterium*.
- **Gold** — the scarce currency for upkeep and trade, accruing from the fief's tolls and tithes at its base rate; no building produces it. Replaces the premium resource but is earned in play.
- **Food** — a stored resource like the others, produced by farms and spent on building costs. It is not eaten down over time in this phase.
- **Peasants** — the workforce. The fief supplies a base number and each farm level adds more; each building level occupies some. Free peasants = supplied − occupied, a derived number that never grows on its own. An upgrade charges only the increase in occupancy against the free peasants, releasing the current level's occupancy. Replaces *energy*.
- **Warehouse** — the building that sets a resource's capacity.
- **Base rate** — the rate per hour every fief earns of each resource from founding, with no building; a producer's rate and the terrain bonus add on top of it.
- **Accrual** — the amount a resource gains between two instants, computed on read (ADR 005).

## Buildings

- **Building** — a structure on a fief with a level; each level has a cost, a build duration and an effect.
- **Sawmill / Quarry / Iron mine / Farm** — the producers.
- **Library** — where arts are studied. Replaces *research lab*.
- **Barracks** — where units are trained. Replaces *shipyard*. Not in the MVP.
- **Build slot** — the single place on a fief where one upgrade builds at a time; nothing waits behind it. A slot with an upgrade in progress is **busy**. Replaces *build queue*.
- **Enqueue** — the single atomic mutation that debits resources and starts an upgrade in the free slot. Staffs the upgrade by the delta: it releases the current level's occupancy and charges only the increase against the free peasants, so a level-2 upgrade of a building already at level 1 needs `occupancy(2) − occupancy(1)` free peasants, not `occupancy(2)`. Refused with a named reason when the slot is busy, resources are short or free peasants are too few.
- **Resolve** — applying a finished upgrade to the fief, on read. Nothing can be cancelled in this phase.

## Knowledge and arms

- **Art** — a researched improvement (smithing, masonry, alchemy, tactics). Replaces *technology*. Not in the MVP.
- **Unit** — infantry, archers, cavalry, rams. Replace *ships*. Not in the MVP.
- **Army** — units on a march. Replaces *fleet*. Not in the MVP.
- **March** — an army's movement between coordinates, with a duration. Replaces *mission*. Not in the MVP.
- **Scout** — the unit that reveals another fief. Replaces *espionage probe*. Not in the MVP.

## Society

- **House** — a group of players under one banner. Replaces *alliance*. Not in the MVP.
- **Season** — a world-wide modifier over time (winter lowers harvests). A lore hook, not in the MVP.

## Time

- **Instant** — a point in time from the `Clock` port; the domain never reads the wall clock.
- **Duration** — a length of time in seconds; build times and marches are durations.

## Avoided words

`planet`, `colony`, `metal`, `crystal`, `deuterium`, `energy`, `fleet`, `ship`, `mission`, `alliance`, `tech`, `mine` alone (say which one), `tick` (there is no tick), `queue` (there is one slot, nothing waits), `population` (peasants are derived, never grown).
