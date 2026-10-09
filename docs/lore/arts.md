# The arts

Status: proposal. Every fact below is a proposal until the author accepts it. The English terms `library`, `smithing`, `masonry` and `study` are fixed by the S1 tickets (#106); the Spanish labels a player reads are in `names.md`.

## What an art is

An art is craft knowledge: the way a thing is done well, written down so it outlives the hands that found it. It is not a spell and not a gift: there is no magic in the land (`world.md`, Premise), and nothing here needs any. A fief holds each art at a level. A higher level means its people work the same ore or the same stone to better effect, so an art raises a resource rate without adding a building or a hand. Knowledge occupies no peasants: the smith who learned a hotter fire still stands at the same forge.

An art raises one resource's rate and does nothing else, settled on 2026-10-09 under the owner's delegation (#540, Decision 1; #541): `deriveResourceRates` folds each art level in force into the percents of the one resource its level names, and a work's time is its content seconds by the season's build percent alone (`deriveBuildDurationSeconds`), so no art shortens a build, now or in a later slice; what shortens a work is the summer (`world.md`, Seasons). The arts are the two of S1, smithing for iron and masonry for stone. An art for wood, food or gold is not planned: `artKinds` names the two, and a third would be named here first (`README.md`) and would be a slice of its own, with its treatise, its level table and its resource, not a content edit.

## Where the library's knowledge comes from

When the crown fell, its scriptoria emptied. The treatises of the crown's masters, on furnaces, on mortar, on the cutting of stone, were carried off, sold by the quire or left to the damp. A **library** is a lord's attempt to gather them back: one lectern and a few scribes who copy whatever passing masters and travelling merchants will sell. Nothing is studied without one. A library starts as a wooden shed with one lectern and grows with its levels into the stone room of shelves with a tower. Accepted by the author on 2026-09-30.

Each level of the library adds shelves and scribes, so a larger library shortens every study: more hands copying, more masters willing to stay a season. The library also decides which treatises a fief can read at all. Each art level names the library level it needs, and a small library holds the primers only.

## Studying

A **study** is a lord's commission: a master is fetched, the treatise is copied, and the fief's craftsmen try its method until it holds. It takes time, and it costs materials for the trials and gold for the master, both paid the moment the commission is given. The library has one lectern, so one study runs at a time and none waits in line. The build slot and its queue are untouched: a study is scholars' work, not masons'.

A commission can be recalled before it finishes. The master leaves unpaid and the untouched materials return to the stores in full, as a cancelled upgrade does. A finished study cannot be recalled; what the craftsmen have learned, they keep.

The masters are never named and never shown on screen, settled on 2026-10-09 under the owner's delegation (#540, Decision 1; #541): a master is whoever sells the quire and stays the season, a passing hand the roll does not record, as the scribe of the hall has no face (`chronicle.md`, Who keeps it). The study's lines name the art and its level and no one else, *Estudio terminado: herrería, nivel 2.*, and a named master would ask for a story the library does not tell.

## The two arts of S1

### Smithing

**Smithing** is the art of ore and fire: charcoal that burns hotter, bellows that hold their breath, a bloomery that gives up more iron from the same load. Each level raises the fief's iron rate by the percent the content declares for that level. The hard people of the House of the Crag are held to know it best (`world.md`, Houses); a lore hook, not a mechanic.

### Masonry

**Masonry** is the art of stone: reading the grain and splitting along it with wedge and feather instead of hammering the face into rubble, so a quarry yields more dressed stone from the same rock. Each level raises the fief's stone rate by the percent the content declares for that level. The House of the Quarry kept it alive when the crown's masons scattered; a lore hook, not a mechanic.

## Open questions

None. The two this page held closed on 2026-10-09 under the owner's delegation (#540, Decision 1; #541): the masters read in Studying, and the arts there are and what an art does in What an art is.
