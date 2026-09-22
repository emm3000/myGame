---
status: accepted
date: 2026-09-22
---
# Peasants are a derived number and food is a plain stock

The lore says buildings take hands from the fields and a fief that cannot
feed its people cannot grow. The tempting design is a population that grows
over time toward a ceiling set by food, with peasants eating stored food and
famine when it runs out. That is a second simulation on top of resource
accrual, with its own growth curve, its own negative rates and its own
"what happens at zero" rules, and it would have to be lazily evaluated too.

## Decision

Peasants are not stored and never grow. A fief **supplies** a base number
of peasants plus what each farm level adds; each building level
**occupies** a number of peasants read from content. Free peasants are
`supplied − occupied`, computed on read like everything else. An enqueue is
refused with `NotEnoughPeasants` when the target level's occupancy exceeds
the free peasants after the upgrade.

Food is a stored resource exactly like wood, stone, iron and gold: it
accrues from farms at a rate per hour up to the warehouse capacity, and it is
spent only as a building cost. Nothing eats it down over time. The farm
therefore has two effects per level in content: a food rate and a peasant
supply.

## Consequences

- One accrual formula (ADR 005) covers all five resources; every rate is
  non-negative and no zero-crossing rule exists.
- The fief table stores no peasant count; only building levels, which
  already exist.
- Terrain and seasons can later tilt the farm's rate without touching this
  model.
- Reversing this means adding a population row with a stored-at instant and
  a growth formula, which is a schema migration and a new lazy formula, so it
  is deliberately postponed until the economy is fun without it.
