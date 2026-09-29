# The world

Status: seed. Every fact below is a proposal until the author accepts it.

## Premise

The old crown fell a generation ago and no one has claimed it. What remains is a wide land of river valleys, pine hills and iron ridges, cut into kingdoms by geography more than by law, each kingdom into provinces, each province into plots a lord can hold. Anyone who can feed peasants and raise a wall can call a plot a fief. The player is one such lord, starting with a hall, a few fields and the loyalty of a small village, in a land where every neighbour is doing the same.

## The land

- **Kingdoms** are the great regions, named by their landmark. Provinces within them are numbered; plots within a province are numbered. A fief's address is `kingdom:province:plot`; the first kingdom is Vadoalto (`names.md`).
- A **province** is one stretch of a kingdom, numbered along the old crown road, and holds a fixed count of plots. A **plot** is one numbered piece of a province; it is free until a lord founds a fief on it, and one fief holds one plot.
- **Terrain belongs to the province**, never to a single plot: every plot of a province shares its ground. **Lowlands** give food and wood. **Uplands** give stone. **Ridges** give iron. A province's terrain tilts the starting rates of every fief founded in it; it never forbids a building.
- The crown road climbs and falls as it runs through a kingdom, so the provinces follow it in turn: lowlands, then uplands, then ridges, then down into the next lowlands (`packages/domain/src/fief/terrainOf.ts`, the code wins).
- The **kingdom map** is the sheet in the hall that shows one province at a time: each plot with the name of the fief that holds it, or empty when no one does. It shows every province up to the last one that holds a fief and one more beyond it, the land no lord has reached yet. It is read to plan, and one thing alone is ordered from it: a forage march to a free plot (proposal S13, below). Nothing else is started from the map.
- Roads are old and slow. Distance on the map is time on the road.

Proposal (S13, #255): a lord may send the fief's **infantry on a forage march**: from the fief to any free plot of the kingdom, where they forage for a whole count of hours and come back with what they carry. The road time follows the map: each province crossed and each plot crossed costs its own fixed stretch of road, and the way back costs the same as the way out. A march takes any number of the infantry at home; those away stay counted among the fief's hands and keep occupying their peasants, as they do at home. The march is sent from the map, the one order the map takes: the plot is checked free at the moment of dispatch and neither reserved nor depleted, so two lords may forage the same plot, and a fief founded there after the march left does not turn it back. What the march will bring is settled when it leaves: the men carry back what the terrain and the hours allow, as much as their backs can hold, and nothing on the road or at the plot changes it but a recall from the hall (proposal S14, below). At the return the loot goes into the stores even above what they hold, where it sits frozen until the stores are drawn down, as a refund does. One march at a time, and the seasons neither slow the road nor the foraging. What the foragers find is the province's terrain, never a plot's:

| Terrain | Foragers bring | Note |
|---|---|---|
| lowlands | food and wood | the river plain: fields to glean and stands to cut |
| uplands | wood and stone | the plateau is bare on top; its gullies hold scrub oak and loose stone from the old quarry faces |
| ridges | stone and iron | the crags: rubble and surface ore |

Gold is never foraged: it is earned, not dug (Where resources come from). The uplands give stone to a fief founded there and stone and wood to a forager: a fief's rate needs a quarry and a sawmill, and the sawmill finds no stands on the plateau, while a forager takes the scrub of the gullies that no sawmill would bother with. The Spanish names of the march, its phases and its refusals are in `names.md` (The marches).

Proposal (S14, #277): a lord may **recall a march** while the men are on the road out or at the plot, never once they have turned for home. A rider carries the word from the hall and the men obey where it finds them. Turned back on the road, they walk home the way they came, so the way home is as long as the way already walked, and they bring nothing: there was nothing to forage on the road. Recalled at the plot, they take the full road home and bring what the hours foraged gave, counted to the second and rounded down, never more than their backs hold, and still no gold; a recall in the very moment they reach the plot finds nothing foraged yet, and the way home is the whole road, which is also the way walked. Men already on the road back are past recalling, and the hall is told so. The men away stay counted and keep their peasants until the gate, as any march does. The recall is the lord's own act and the roll writes nothing for it; the return is written once, by the hour the men walk in, with what they brought (`chronicle.md`). The Spanish of the recall, its two refusals and its chronicle line are in `names.md` (The marches, The chronicle).

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

Proposal (S8, #183): the seasons turn together over the whole land every seven days, spring first, and the year is counted from the first spring; winter lowers the harvest, spring raises it, autumn favours trade and gold. No named calendar or era: a season is known by its name and the year by its number (`names.md`, The seasons).

Proposal (S9, #199): summer shortens building and winter shortens study. A building work takes the season in force when it is ordered, a study the season in force when it starts, and neither changes with the season while it runs.

Proposal (S12, #247): spring shortens training. A levy takes the season in force when it is ordered, for every man of it, and does not change with the season while it runs (`names.md`, The seasons).

## Open questions

- The name of the game and of the land.
- The names of the three houses, their sigils and their colours.
- What ended the crown, and whether it can be claimed.
- Whether magic exists at all, and if so how little.
- The unit of gold and what a peasant eats per day in game terms.
