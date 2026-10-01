# The world

Status: seed. Every fact below is a proposal until the author accepts it.

## Premise

The old crown fell a generation ago and no one has claimed it. What remains is a wide land of river valleys, pine hills and iron ridges, cut into kingdoms by geography more than by law, each kingdom into provinces, each province into plots a lord can hold. Anyone who can feed peasants and raise a wall can call a plot a fief. The player is one such lord, starting with a hall, a few fields and the loyalty of a small village, in a land where every neighbour is doing the same.

## The land

- **Kingdoms** are the great regions, named by their landmark. Provinces within them are numbered; plots within a province are numbered. A fief's address is `kingdom:province:plot`; the first kingdom is Vadoalto (`names.md`).
- A **province** is one stretch of a kingdom, numbered along the old crown road, and holds a fixed count of plots. A **plot** is one numbered piece of a province; it is free until a lord founds a fief on it, and one fief holds one plot.
- **Terrain belongs to the province**, never to a single plot: every plot of a province shares its ground. **Lowlands** give food and wood. **Uplands** give stone. **Ridges** give iron. A province's terrain tilts the starting rates of every fief founded in it; it never forbids a building.
- The crown road climbs and falls as it runs through a kingdom, so the provinces follow it in turn: lowlands, then uplands, then ridges, then down into the next lowlands (`packages/domain/src/fief/terrainOf.ts`, the code wins).
- The **kingdom map** is the sheet in the hall that shows one province at a time: each plot with the name of the fief that holds it, the bandit camp that squats on it (proposal S15, below), or empty when no one does. It shows every province up to the last one that holds a fief and one more beyond it, the land no lord has reached yet. It is read to plan, and two things alone are ordered from it: a forage march to a free plot (proposal S13, below) and an attack on a bandit camp (proposal S15, below). Nothing else is started from the map.
- Roads are old and slow. Distance on the map is time on the road.

Proposal (S13, #255): a lord may send the fief's **infantry on a forage march**: from the fief to any free plot of the kingdom, where they forage for a whole count of hours and come back with what they carry. The road time follows the map: each province crossed and each plot crossed costs its own fixed stretch of road, and the way back costs the same as the way out. A march takes any number of the infantry at home; those away stay counted among the fief's hands and keep occupying their peasants, as they do at home. The march is sent from the map, the first of the two orders the map takes (proposal S15, below): the plot is checked free at the moment of dispatch and neither reserved nor depleted, so two lords may forage the same plot, and a fief founded there after the march left does not turn it back. The foragers go to a plot no lord holds and no bandits camp on: a forage march meets no one and fights no one. What the march will bring is settled when it leaves: the men carry back what the terrain and the hours allow, as much as their backs can hold, and nothing on the road or at the plot changes it but a recall from the hall (proposal S14, below). At the return the loot goes into the stores even above what they hold, where it sits frozen until the stores are drawn down, as a refund does. One march at a time, and the seasons neither slow the road nor the foraging. What the foragers find is the province's terrain, never a plot's:

| Terrain | Foragers bring | Note |
|---|---|---|
| lowlands | food and wood | the river plain: fields to glean and stands to cut |
| uplands | wood and stone | the plateau is bare on top; its gullies hold scrub oak and loose stone from the old quarry faces |
| ridges | stone and iron | the crags: rubble and surface ore |

Gold is never foraged: it is earned, not dug (Where resources come from). The uplands give stone to a fief founded there and stone and wood to a forager: a fief's rate needs a quarry and a sawmill, and the sawmill finds no stands on the plateau, while a forager takes the scrub of the gullies that no sawmill would bother with. The Spanish names of the march, its phases and its refusals are in `names.md` (The marches).

Proposal (S14, #277): a lord may **recall a march** while the men are on the road out or at the plot, never once they have turned for home. A messenger carries the word from the hall and the men obey where it finds them. Turned back on the road, they walk home the way they came, so the way home is as long as the way already walked, and they bring nothing: there was nothing to forage on the road. Recalled at the plot, they take the full road home and bring what the hours foraged gave, counted to the second and rounded down, never more than their backs hold, and still no gold; a recall in the very moment they reach the plot finds nothing foraged yet, and the way home is the whole road, which is also the way walked. Men already on the road back are past recalling, and the hall is told so. The men away stay counted and keep their peasants until the gate, as any march does. The recall is the lord's own act and the roll writes nothing for it; the return is written once, by the hour the men walk in, with what they brought (`chronicle.md`). The Spanish of the recall, its two refusals and its chronicle line are in `names.md` (The marches, The chronicle).

Proposal (S15, #292): not every free plot is empty. **Bandits** hold **camps** on some of them, about one free plot in five, and where they are is in the lay of the land, not in any lord's gift: a plot's camp has been there since before the crown fell and is found where it always was, until a lord founds a fief on that plot and drives the bandits off, since a hall with a village at its gate is no place for a hideout; the founding takes the lowest free plot as it always has, camp or no camp. A camp is of a **tier**, one of three, that never changes, and has a **strength**, the count of the men it holds, that changes only with a fight: a tier's strength is full at six, fifteen or forty, and after a fight what is left of it grows back at an even pace, the tier's full strength in six, twelve or twenty-four hours, as stragglers drift back from the hills and new ones join, so a camp beaten to nothing is full again after those hours and a camp left with something is full sooner; a camp never fought stands at full. The map shows each camp with its tier and its strength as they stand at the hour of the read (`names.md`, The map).

A lord may send the fief's **infantry to attack a camp**: the second order the map takes, on a camp's plot alone, sent as a forage march is, with the same road each way, one march at a time, the men away counted and keeping their peasants, and no stay: the men fight at the hour they arrive and turn for home in the same hour. A forage march to a camp's plot is refused, an attack on a plot without a camp is refused, and an attack on a held plot is refused as a forage march is (`names.md`, The marches). The bandits are counted men, and a fight between counted men has one end: each infantry counts one, each point of a camp's strength counts one, the stronger side wins, and a tie goes to the bandits, who hold the ground. The loser falls whole. The winner loses men by the rival's share of strength: the rival's strength over the winner's, squared, times the winner's own count, rounded up, and always keeps at least one; a camp that holds loses strength by the same measure and always keeps one. What the men will find is what the map showed the hour they left: the camp's strength is fixed at dispatch, as the forage loot is, so the hall reads the outcome, the losses and the loot on the form before the men go, and nothing on the road changes it but a recall before the battle (proposal S14, above); a march that has fought is past recalling. Two lords who attack one camp each fight the camp as they saw it when they left, and the last to arrive leaves it as they left it. The dead leave the fief's count at the hour of the battle and their peasants go back to the fields; a lost attack ends at the camp: no one walks home, the yard stands empty from that hour, and the roll writes the battle alone (`chronicle.md`).

The survivors of a won attack carry back the camp's hoard: sixty of loot for every point of strength the camp had when they left, in three even shares, the two resources the terrain gives a forager and gold, the tolls and tithes the bandits robbed from the road, never more than forty-eight per survivor, each share rounded down. A camp beaten while at nothing gives nothing, and a lost attack brings nothing home, since no one comes home. At the return the loot goes into the stores even above what they hold, as a forage does, and the roll writes the return as it writes any march back. The forage march of S13 still meets no one; the attack meets the bandits and no one else, and any march that meets another lord stays out of this slice.

| Tier | Full strength | Grows back to full in | Hoard at full |
|---|---|---|---|
| 1 | 6 | 6 hours | 360: 120 of each of the three |
| 2 | 15 | 12 hours | 900: 300 of each |
| 3 | 40 | 24 hours | 2 400: 800 of each |

The Spanish of the bandits, the camp, the attack, its refusals and its battle line are in `names.md` (The map, The marches, The chronicle).

Proposal (S16, #343): the yard arms a second kind of unit, the **rider**: a peasant on a horse with a lance, no knight and no lord's son. Riders are fewer and dearer than the infantry. A horse costs what a spear does not: iron for its shoes and its bit, gold for the dealer, since the land breeds few, and food to keep it through the year; and it takes two hands from the fields where a footman takes one, the one in the saddle and the one who keeps the horse. A rider is slower to train, more than three times a footman's drill, and only a barracks of level 3 has the ground to drill him, where the infantry need level 1; the level is the built one, as the library's is for a study, and spring shortens his training as it shortens any levy.

A march or an attack takes any count of each kind at home, at least one man in all: a **party**. Riders ride the road in half the time a footman walks it, and a mixed party rides at the footmen's pace, since a company is as fast as its slowest man; one footman among the riders is enough to slow them all. A rider carries 120 where a footman carries 48, for the horse bears the load, and the party carries the sum. At the plot a rider gathers no faster than a footman, since hands forage and horses do not, so the forage gives the same per head and hour whatever the kind, and never more than the party carries. In a fight a rider counts as two, and the party's strength is the sum of its men's; the stronger side wins and a tie is the bandits', as before. A winning party pays its losses in strength, the camp's strength squared over the party's own, rounded up, and the infantry pay first, one point a man, since they stand in front; the riders fall only once no footman is left to pay, two points a man, rounded up, for a rider does not half fall, and one man at least always comes home. With infantry alone this is the rule above, unchanged. A losing party falls whole, riders and all, and the camp loses as it did. The survivors carry the hoard, never more than their summed loads. The recall turns back the whole party, no kind alone; the camps, their regrowth and the seasons are as the proposals above leave them, and where those say infantry, read the party.

| Kind | Barracks | Peasants | Counts in a fight | Carries | Road |
|---|---|---|---|---|---|
| infantry | level 1 | 1 | 1 | 48 | the whole time |
| rider | level 3 | 2 | 2 | 120 | half the time |

The Spanish of the rider, the locked card, the party and its lines are in `names.md` (The army, The marches, The chronicle).

## Where resources come from

- **Wood** from the pine and oak stands; the sawmill turns them into timber.
- **Stone** from the upland quarries; the quarry cuts it.
- **Iron** from the ridge mines; the iron mine smelts it. Iron is scarce and every tool and blade needs it.
- **Gold** from tolls, tithes and trade; there is no gold mine. It is earned, not dug.
- **Food** from the farms; peasants eat it, and a fief that cannot feed its people cannot grow.
- **Peasants** are the people of the fief. Every building needs hands; every unit is a hand taken from the fields, and a rider two (proposal S16, The land).

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
- Where the horses come from: whether the land breeds them or a house trades them.
