# Names the player reads

Status: accepted by the author on 2026-09-22. The Spanish labels below are the words a player sees; the English term stays the identifier in code and in `CONTEXT.md`.

## Resources

| Term | Label | Note |
|---|---|---|
| wood | madera | timber from the pine and oak stands |
| stone | piedra | cut in the upland quarries |
| iron | hierro | smelted from the ridge ores |
| gold | oro | tolls, tithes and trade; never dug |
| food | comida | what the farms bring in and the peasants eat |
| peasants | campesinos | the hands of the fief; shown as free of supplied |

## Buildings

| Term | Label |
|---|---|
| sawmill | aserradero |
| quarry | cantera |
| iron mine | mina de hierro |
| farm | granja |
| warehouse | almacén |

## The fief

- A **fief** is a *feudo*. The screen title is the name the player gave the fief when founding it, unchanged.
- The **build slot** is *la obra*: a busy slot has *una obra en marcha*; a free slot *no tiene obra*.
- The **build queue** is *las obras en espera*: the upgrades waiting behind *la obra en marcha*, listed in order. Proposal for the author, not yet accepted.
- A **level** is *nivel*; a building at level 3 reads *nivel 3*.

## The first kingdom

Kingdoms are named by their landmark; provinces and plots are numbered (`world.md`, The land). The first kingdom is **Vadoalto**, named for the high ford where the old crown road crossed the river. The House of the Ford holds its toll bridges.

A fief's address is shown as the kingdom's name followed by province and plot: `Vadoalto 3:12`. Stored coordinates stay `kingdom:province:plot` with the kingdom as a number; the name is a label for kingdom `1`, and every later kingdom adds one line here before it opens.

## Open questions

- The names of the second and third kingdoms, one per remaining house.
- Whether *obra* survives once a fief can hold more than one slot.
