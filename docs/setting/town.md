# The town

Status: proposal. Every row whose source reads *proposal* is invented here and waits on the owner's acceptance on the pull request; every other row restates the ADR or the code it names (`docs/setting/README.md`, Authorship).

The player is the new **mayor** (2779) of a small present-day **town** (364) in a neutral, unnamed English-speaking country, and grows it into a **city** (269) (ADR 035). The country is never named; the town carries the name the player gives it, shown as written in every language (ADR 040, `decisions.md` §10.4). No real place, brand, politics or person appears, and nothing is magic (`docs/setting/README.md`, Rules).

Every rank is the `SFI Rank` of `apps/api/content/lessons/ngsl-1.2.csv`. *Mayor*, *storage* and *truck* are ADR 035's game nouns. A word marked **graded reading only** is on no screen: it is not in `docs/setting/chrome.md`, so it waits for the graded texts of `decisions.md` §14, order 2, and is taught by the band lesson that holds it, never by a chrome lesson (ADR 037).

## The town

| Name | Rank | What the player sees | Source |
|---|---|---|---|
| town | 364 | The header's label beside the name the player gives the town; *Name your town* founds it on the first signed-in visit. | ADR 040 |
| city | 269 | The header reads *city* once the town's supplied people reach the content's count; nothing else changes. | ADR 040 |
| mayor | 2779 | The player, met once as *You are the mayor.* on the naming screen and addressed as *you* everywhere else; never given a name. | ADR 040, `chrome.md` |
| people | 57 | *People: 24 free, 96 at work*: supplied by a base count and the homes, occupied by every building level and every hire. | ADR 040 |

## The seven places

A new town starts with homes and the school at level 1 (ADR 040). Each place is one illustration, grown through five tiers over ten levels, with no people in it (`docs/art/art-bible.md`, Framing); the picture named here is a proposal, which the art ticket draws as hand-written SVG (`docs/art/art-bible.md`, Model and size).

| Content id | Label | Rank | What the player sees | Source |
|---|---|---|---|---|
| `homes` | *Homes* | home 161 | A short row of brick houses; each level raises the people the town supplies. | ADR 040; picture: proposal |
| `farm` | *Farm* | 1083 | A red barn beside rows of crops; produces food. | ADR 040; picture: proposal |
| `factory` | *Factory* | 1530 | A low brick works with one chimney; produces material. | ADR 040; picture: proposal |
| `powerStation` | *Power station* | power 331, station 709 | A small station with steel poles and power lines; produces power. | ADR 040; picture: proposal |
| `storage` | *Storage* | 2707 | A wide shed with large doors; one capacity for all four stocks. | ADR 040; picture: proposal |
| `school` | *School* | 146 | A two-floor school with tall windows; runs one lesson at a time, shortens it and raises the learning cap with its level. | ADR 040; picture: proposal |
| `office` | *Office* | 343 | An office block with a glass front; hires workers from level 1 and trucks from level 3. | ADR 040; picture: proposal |

Money has no place: it comes from **tax** (787, graded reading only), a base rate in content (ADR 040, `decisions.md` §9). The money card shows *Money* alone.

## The map

The map is region : area : site (ADR 040), one area at a time, browsed with *Previous area* and *Next area* up to one past the last area holding a town (ADR 014).

| Name | Rank | What the player sees | Source |
|---|---|---|---|
| region | 677 | *Region 1*: the one region every town is founded in, at its lowest free site, as `lowestFreeCell` places a fief in kingdom 1 today. | ADR 040, `packages/domain/src/grid/lowestFreeCell.ts` |
| area | 204 | *Area 3* with its terrain, its sites listed under it. | ADR 040 |
| site | 494 | *Site 12*: free, a town with its name, or a waste site with its size and waste. How many sites an area holds is the town's content; a province holds 15 plots today (`apps/api/content/fief.json`, `plotsPerProvince`). | ADR 040 |

### The three terrains

An area's terrain is set by its number (ADR 040). The rotation below keeps the order of `terrainOf`, which rotates the medieval terrains by province today (`packages/domain/src/fief/terrainOf.ts`), each mapped to its successor as ADR 035's table pairs them; the town's rotation lands with its slice, so the order is a proposal until then.

| Terrain | Rank | Areas | What the player sees | Source |
|---|---|---|---|---|
| *Fields* | field 540 | 1, 4, 7 … | Flat green ground with crop rows; a town here gains food. | ADR 040; areas: proposal |
| *River* | 1176 | 2, 5, 8 … | A river across the ground; a town here gains power. | ADR 040; areas: proposal |
| *Hills* | hill 1670 | 3, 6, 9 … | Low rolling hills; a town here gains material. | ADR 040; areas: proposal |

The gain is the bonus to the town's own site (ADR 040). A job's pay is fixed at dispatch from the site's terrain, the hours, the team and its carry, and never holds money (ADR 040); which resources each terrain pays, and how much per hour, is the town's content. A pay may hold more than one resource, as *Pay: 40 food, 20 material* in `chrome.md` shows, and each medieval terrain yields two today (`apps/api/content/fief.json`, `yieldPerHour`).

### The waste sites

Waste sites sit on a content fraction of the free sites, placed by a hash of the address, in three sizes, as the camps are today (ADR 040, ADR 020, `packages/domain/src/camp/campOf.ts`). A site shows *Waste site*, *Size 2* and *Waste: 12*, the waste regrowing from 0 after a clean-up up to its size's top. A team whose strength covers the waste cleans it and comes back with money and material; a smaller team comes back with nothing; nobody is lost.

| Size | Rank | What the player sees | Source |
|---|---|---|---|
| *Size 1* | size 705 | The least waste, the quickest to grow back; a small team cleans it. | ADR 040, ADR 020's tiers |
| *Size 2* | size 705 | More waste, slower to grow back. | ADR 040, ADR 020's tiers |
| *Size 3* | size 705 | The most waste, the slowest to grow back; it needs a large team. | ADR 040, ADR 020's tiers |

Each size's top waste and regrowth time is the town's content; the medieval tiers hold 6, 15 and 40 strength, regrowing over 6, 12 and 24 hours (`apps/api/content/fief.json`, `camps.tiers`).

## The teams

| Name | Rank | What the player sees | Source |
|---|---|---|---|
| worker | 673 | *Hire 5 workers*: the cheap, slow, small carrier, hired from office level 1. | ADR 040 |
| truck | 2113 | The carrier that holds more and goes faster, hired from office level 3. | ADR 040 |
| team | 407 | *Send a team*: the hires sent out together, one team out at a time, on a **job** (231) for whole hours with **pay** (220) fixed at dispatch, or on a **clean-up** of a waste site. *Clean-up* is the design term, never screen copy: the screen says *Clean the waste* (clean 842). | ADR 040, `chrome.md` |

## The people in the news

Characters exist only to carry language, each with one fixed voice and kept within the curriculum (`decisions.md` §10.5). None has a text yet: until graded reading ships, every Town News item is a chrome template (ADR 040), and this page names the speakers, not their lines.

| Name | Rank | Who they are | Source |
|---|---|---|---|
| the writer | writer 1024, graded reading only | The one person who writes Town News once its items are graded texts: short, plain reports in the past tense, the town's events and each season's weather news. | `decisions.md` §1.3, §9, §10.5; voice: proposal |
| your neighbor | neighbor 1222, graded reading only | One person who lives in the player's area and asks the mayor, in the first person, to clean a waste site, telling its size in words; the request is the reading task the clean-up decision rests on. American spelling, as the NGSL 1.2 headword is. | `decisions.md` §1.4, §9, §10.5, ADR 040; one person, the area: proposal |
| a visitor | visitor 1398, graded reading only | Later, someone who comes to the town and asks for something in English, the first place for writing and interaction. Out of the rebuild. | `decisions.md` §9, §10.5 |

**Job notices** (*notice* 664, graded reading only) have no speaker: a notice is a short impersonal posting of the site, the hours and the pay, as a real job notice is, so the cast stays at the three above (proposal; the rejected alternative was one poster per terrain, a cast for story's sake, which §10.5 rejects).

**No character has a proper name** (proposal). A proper name is a token outside the lexicon, and check 4 admits an unknown token in a graded text only when it is a lexicon word with its glosses (ADR 037); among names, check 9 exempts only *Townword* and the player's town name (ADR 040). Each person is named by a role word instead, which is itself a headword the band lessons teach. Short proper names, the same in every language, are the alternative `decisions.md` §10.4 allows; they would need an ADR that exempts them from check 4, as ADR 040 exempts the town's name from check 9.
