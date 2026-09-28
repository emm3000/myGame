# The world

Status: seed. Every fact below is a proposal until the author accepts it.

## Premise

The old crown fell a generation ago and no one has claimed it. What remains is a wide land of river valleys, pine hills and iron ridges, cut into kingdoms by geography more than by law, each kingdom into provinces, each province into plots a lord can hold. Anyone who can feed peasants and raise a wall can call a plot a fief. The player is one such lord, starting with a hall, a few fields and the loyalty of a small village, in a land where every neighbour is doing the same.

## The land

- **Kingdoms** are the great regions, named by their landmark. Provinces within them are numbered; plots within a province are numbered. A fief's address is `kingdom:province:plot`; the first kingdom is Vadoalto (`names.md`).
- A **province** is one stretch of a kingdom, numbered along the old crown road, and holds a fixed count of plots. A **plot** is one numbered piece of a province; it is free until a lord founds a fief on it, and one fief holds one plot.
- **Terrain belongs to the province**, never to a single plot: every plot of a province shares its ground. **Lowlands** give food and wood. **Uplands** give stone. **Ridges** give iron. A province's terrain tilts the starting rates of every fief founded in it; it never forbids a building.
- The crown road climbs and falls as it runs through a kingdom, so the provinces follow it in turn: lowlands, then uplands, then ridges, then down into the next lowlands (`packages/domain/src/fief/terrainOf.ts`, the code wins).
- The **kingdom map** is the sheet in the hall that shows one province at a time: each plot with the name of the fief that holds it, or empty when no one does. It shows every province up to the last one that holds a fief and one more beyond it, the land no lord has reached yet. It is read to plan, never acted on: nothing is ordered from the map.
- Roads are old and slow. Distance on the map is time on the road.

## Where resources come from

- **Wood** from the pine and oak stands; the sawmill turns them into timber.
- **Stone** from the upland quarries; the quarry cuts it.
- **Iron** from the ridge mines; the iron mine smelts it. Iron is scarce and every tool and blade needs it.
- **Gold** from tolls, tithes and trade; there is no gold mine. It is earned, not dug.
- **Food** from the farms; peasants eat it, and a fief that cannot feed its people cannot grow.
- **Peasants** are the people of the fief. Every building needs hands; every unit is a hand taken from the fields.

## Houses (placeholders)

Three houses claim history in the land. Names and sigils are open.

- **House of the Ford** — river lords, traders, holders of the old toll bridges. Lean towards gold and food.
- **House of the Quarry** — upland builders, masons, keepers of the walls that outlived the crown. Lean towards stone and defence.
- **House of the Ridge** — ironmongers, hard people from the mines. Lean towards iron and arms.

In the MVP houses are flavour in the lore only; mechanics for houses are a later phase.

## Seasons

Four seasons cycle over the world. Winter lowers harvests, spring raises them, summer speeds building, autumn favours trade. A lore hook; not in the MVP.

Proposal (S8, #183): the seasons turn together over the whole land every seven days, spring first, and the year is counted from the first spring; winter lowers the harvest, spring raises it, autumn favours trade and gold; summer's speed on building comes later. No named calendar or era: a season is known by its name and the year by its number (`names.md`, The seasons).

## Open questions

- The name of the game and of the land.
- The names of the three houses, their sigils and their colours.
- What ended the crown, and whether it can be claimed.
- Whether magic exists at all, and if so how little.
- The unit of gold and what a peasant eats per day in game terms.
