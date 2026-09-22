---
status: accepted
date: 2026-09-21
---
# A medieval setting over OGame's mechanics

OGame's loop is proven: a persistent holding produces resources over time,
the player spends them on buildings that raise production, and later on
research, units and expansion. Its setting is not what the author wants, and
an earlier attempt by the author (a sci-fi clone with an Android client) is
not reused beyond its technical lessons.

## Decision

The mechanics are OGame's; the world is medieval. Every OGame concept has one
medieval term, recorded in `CONTEXT.md`, and the code uses only the medieval
term. The lore under `docs/lore/` is the source of every name a player sees
and is a living document: content is written to fit the lore, never the
other way round.

| OGame | Here |
|---|---|
| planet | fief |
| colony | new land |
| metal, crystal, deuterium | wood, stone, iron |
| dark matter / premium | gold |
| energy | peasants (workforce) |
| mines, solar plant | sawmill, quarry, iron mine, farms |
| research lab, technologies | library, arts |
| shipyard, ships | barracks, units |
| fleet, mission | army, march |
| espionage probe | scout |
| alliance | house |
| galaxy : system : position | kingdom : province : plot |

Food is the population ceiling: buildings and units consume peasants,
peasants eat.

## Consequences

- Assets are generated to one art bible (`docs/art/art-bible.md`), which a
  medieval painted style serves better than sci-fi does for consistency.
- Seasonal events (winter lowering harvests) and house bonuses are lore hooks
  the mechanics can absorb later without new systems.
- The old project's gotchas that survive: a build enqueue is one atomic
  mutation, and queue resolution is scoped to the holding being read.
