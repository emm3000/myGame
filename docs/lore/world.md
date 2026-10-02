# The world

Status: seed. Every fact below is a proposal until the author accepts it.

## Premise

The old crown fell a generation ago and no one has claimed it. What remains is a wide land of river valleys, pine hills and iron ridges, cut into kingdoms by geography more than by law, each kingdom into provinces, each province into plots a lord can hold. Anyone who can feed peasants and raise a wall can call a plot a fief. The player is one such lord, starting with a hall, a few fields and the loyalty of a small village, in a land where every neighbour is doing the same.

## The land

- **Kingdoms** are the great regions, named by their landmark. Provinces within them are numbered; plots within a province are numbered. A fief's address is `kingdom:province:plot`; the first kingdom is Vadoalto (`names.md`).
- A **province** is one stretch of a kingdom, numbered along the old crown road, and holds a fixed count of plots. A **plot** is one numbered piece of a province; it is free until a lord founds a fief on it, and one fief holds one plot.
- **Terrain belongs to the province**, never to a single plot: every plot of a province shares its ground. **Lowlands** give food and wood. **Uplands** give stone. **Ridges** give iron. A province's terrain tilts the starting rates of every fief founded in it; it never forbids a building.
- The crown road climbs and falls as it runs through a kingdom, so the provinces follow it in turn: lowlands, then uplands, then ridges, then down into the next lowlands (`packages/domain/src/fief/terrainOf.ts`, the code wins).
- The **kingdom map** is the sheet in the hall that shows one province at a time: each plot with the name of the fief that holds it, the bandit camp that squats on it (proposal S15, below), the claim a settler on the road has laid on it (proposal S18, below), or empty when no one does. It shows every province up to the last one that holds a fief and one more beyond it, the land no lord has reached yet. It is read to plan, and three things alone are ordered from it: a forage march to a free plot (proposal S13, below), an attack on a bandit camp (proposal S15, below) and the founding of a second fief (proposal S18, below). Nothing else is started from the map.
- Roads are old and slow. Distance on the map is time on the road.

Proposal (S13, #255): a lord may send the fief's **infantry on a forage march**: from the fief to any free plot of the kingdom, where they forage for a whole count of hours and come back with what they carry. The road time follows the map: each province crossed and each plot crossed costs its own fixed stretch of road, and the way back costs the same as the way out. A march takes any number of the infantry at home; those away stay counted among the fief's hands and keep occupying their peasants, as they do at home. The march is sent from the map, the first of the orders the map takes (proposals S15 and S18, below): the plot is checked free at the moment of dispatch and neither reserved nor depleted, so two lords may forage the same plot, and a fief founded there after the march left does not turn it back. The foragers go to a plot no lord holds and no bandits camp on: a forage march meets no one and fights no one. What the march will bring is settled when it leaves: the men carry back what the terrain and the hours allow, as much as their backs can hold, and nothing on the road or at the plot changes it but a recall from the hall (proposal S14, below). At the return the loot goes into the stores even above what they hold, where it sits frozen until the stores are drawn down, as a refund does. One march at a time. The seasons touch a march in two things alone, its road and what it forages, each settled when the men leave (proposal S17, Seasons). What the foragers find is the province's terrain, never a plot's:

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

A march or an attack takes any count of each kind at home, at least one man in all: a **party**. Riders ride the road in half the time a footman walks it, and a mixed party rides at the footmen's pace, since a company is as fast as its slowest man; one footman among the riders is enough to slow them all. A rider carries 120 where a footman carries 48, for the horse bears the load, and the party carries the sum. At the plot a rider gathers no faster than a footman, since hands forage and horses do not, so the forage gives the same per head and hour whatever the kind, and never more than the party carries. In a fight a rider counts as two, and the party's strength is the sum of its men's; the stronger side wins and a tie is the bandits', as before. A winning party pays its losses in strength, the camp's strength squared over the party's own, rounded up, and the infantry pay first, one point a man, since they stand in front; the riders fall only once no footman is left to pay, two points a man, rounded up, for a rider does not half fall, and one man at least always comes home. With infantry alone this is the rule above, unchanged. A losing party falls whole, riders and all, and the camp loses as it did. The survivors carry the hoard, never more than their summed loads. The recall turns back the whole party, no kind alone; the camps and their regrowth are as the proposals above leave them; a season touches a party as it touches any march, by its road and its forage, whatever the kinds sent (proposal S17, Seasons); and where the proposals of the march and of the attack (S13, S14 and S15, above) say infantry, read the party.

| Kind | Barracks | Peasants | Counts in a fight | Carries | Road |
|---|---|---|---|---|---|
| infantry | level 1 | 1 | 1 | 48 | the whole time |
| rider | level 3 | 2 | 2 | 120 | half the time |

The Spanish of the rider, the locked card, the party and its lines are in `names.md` (The army, The marches, The chronicle).

Proposal (S18, #378): a lord may hold **two fiefs**, and no more. The second is never taken from anyone: it is founded on new land, a free plot of the same kingdom, by a **settler**. A settler is a peasant household sent out with a cart to raise a hall where there is none, and the yard arms it with no spear. It is the dearest thing a fief can send down the road: the cart is loaded with timber, cut stone, iron tools, a purse and food for the first winter, far more of each than any rider costs, and stone for the first time; and the household takes four hands from the fields, where a rider takes two and a footman one. Only a barracks of level 5 can fit out the venture, where the riders need level 3; the level is the built one, as for every kind, and the fitting out is the longest drill the yard knows, twenty-four times a rider's and eighty times a footman's, shortened by the barracks level and by spring as any levy is. A settler carries nothing and never fights: the cart is full of the household's own goods, so it brings no loot, and it counts for nothing against a camp. No forage march and no attack takes a settler, and the hall is told so when one is ordered to.

The **founding** is the third order the map takes: one settler, alone, sent from the fief to a free plot with no camp, on any province the map shows. A household is no match for bandits, so the plot of a camp is refused; a lord's first fief still takes the lowest free plot, camp or no camp, since a lord arrives with a village behind and drives the bandits off (proposal S15, above), and from S18 on that lowest free plot is the lowest that no settler has claimed. The lord names the new fief before the settler leaves. The settler walks the road of any march at a footman's whole pace, autumn shortening it as it shortens every road (proposal S17, Seasons), fixed when the settler leaves; the founding holds the fief's one march, so nothing else is sent until the settler arrives or comes home.

**The plot is claimed from the hour the settler leaves.** Until the settler arrives or is recalled, no forage march, no attack and no other founding is sent to it, by its claimant or by anyone, no new lord's first fief is set on it, and the map shows the claim to every lord, though not whose it is to any but its claimant. A founding still on the road counts as a fief toward the two, so a lord never has more fiefs and claims than two in all. The lord may recall the settler while on the road, as any march (proposal S14, above): the settler walks home the way already walked, the claim is lifted in the hour of the recall, not of the return, and the settler is kept in the yard with the four hands still held, ready to be sent again.

At the hour the settler reaches the plot **the fief is founded**, and no one walks back. The new land starts bare, as a lord's first fief does: the same stores a first fief opens with, nothing built, no unit, and no art, for the masters of the old library do not travel and what a fief knows it studies itself. It takes the terrain of its province as any fief does, counts its stores from the hour of the founding, and has its own hands, its own works, its own yard and its own roll (`chronicle.md`). In the fief the settler left, the settler leaves the count at that hour and the four hands the venture held go back to the fields, as a fallen man's do. Should another hall already stand on the plot when the settler arrives, which only a new lord arriving in the very moment the settler left can bring about, the settler founds nothing and turns home as if recalled there, kept.

**Nothing travels between a lord's own fiefs.** No march goes from one to the other, and none carries stores, men or arts between them: each fief stands on what it gathers and builds. A march sent to either of the lord's own plots is refused, from either fief. A second kingdom, a third fief, and taking a plot another lord holds stay out of this slice.

| Kind | Barracks | Peasants | Counts in a fight | Carries | Road |
|---|---|---|---|---|---|
| settler | level 5 | 4 | nothing | nothing | the whole time |

The Spanish of the settler, the founding, the reserved plot, the two fiefs in the header, the refusals and the roll's lines are in `names.md` (The fief, The army, The marches, The map, The chronicle).

## Where resources come from

- **Wood** from the pine and oak stands; the sawmill turns them into timber.
- **Stone** from the upland quarries; the quarry cuts it.
- **Iron** from the ridge mines; the iron mine smelts it. Iron is scarce and every tool and blade needs it.
- **Gold** from tolls, tithes and trade; there is no gold mine. It is earned, not dug.
- **Food** from the farms; peasants eat it, and a fief that cannot feed its people cannot grow.
- **Peasants** are the people of the fief. Every building needs hands; every unit is a hand taken from the fields, a rider two (proposal S16, The land) and a settler four (proposal S18, The land).

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

Proposal (S17, #365): the seasons reach a march in its road and its forage, and in nothing else. **Autumn shortens the road** by a quarter, for every march and every attack, whatever the kinds sent: the summer has dried the fords and packed the mud, the harvest carts have beaten the ruts flat, and the firm road that favours trade carries a company faster, on foot or mounted. The quarter comes off the road of the party's slowest kind, the way out and the way back alike, rounded up to the whole second once; no other season changes the road. **The forage follows the harvest**: the men glean the fields the season swells or strips, so what they bring of each resource rises and falls as the fief's own harvest of it does. Spring brings a quarter more food and winter a quarter less, counted with the hours and rounded down once, and never more than their backs hold. Food is foraged on the lowlands alone, so a forage on the uplands or the ridges brings the same in every season; and gold is never foraged, so autumn, which favours gold, adds nothing to a forage.

Both are fixed when the men leave, with the season in force at that hour, as a building work, a study and a levy fix theirs: a march that is out when the season turns keeps its road, its return and its loot. A recall brings the men home sooner and with less, as it always has (proposal S14, The land), but it reads no season anew: it changes neither the road fixed when the men left nor the season's measure of their forage. Men turned back on the road walk home the way they walked out; men recalled at the plot walk home the road fixed when they left and bring what the hours foraged give at the season they left in, never at the season the word finds them in. The battle, the hoard an attack carries home and the hours of a stay are as in any season. Before the first spring there is no season, and a march is as the map and the terrain give it. The Spanish of the two marks and the worked numbers are in `names.md` (The seasons, The marches).

## Open questions

- The name of the game and of the land.
- The names of the three houses, their sigils and their colours.
- What ended the crown, and whether it can be claimed.
- Whether magic exists at all, and if so how little.
- The unit of gold and what a peasant eats per day in game terms.
- Where the horses come from: whether the land breeds them or a house trades them.
- Whether anything ever travels between a lord's own fiefs, and whether a lord ever holds more than two (S18).
- Who a settler's household is, and why the hands it held go back to the old fief's fields once the new hall stands.
