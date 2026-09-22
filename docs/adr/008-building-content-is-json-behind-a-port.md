---
status: accepted
date: 2026-09-22
---
# Building content is JSON in the api, read by the domain through a port

N5 requires that buildings, costs, durations and names be data the domain
reads, changeable without a code deploy. Two places can hold that data: a
table in Postgres seeded by a migration, or files in the repository loaded
when the api starts. The table is editable at runtime but becomes a second
source of truth next to the file that seeds it, and every balance change is
a migration.

## Decision

Content lives as JSON files under `apps/api/content/`, one file per building.
The api parses them at start-up with the zod schema in `packages/contracts`
and hands the result to the domain through a `BuildingCatalog` port declared
in `packages/domain`. The domain never imports a file.

Each building lists its levels explicitly, level 1 to a cap the file itself
sets, and each level carries its cost in the five resources, its duration in
seconds, its peasant occupancy and its effect: a rate per hour for the
producers, a capacity for the warehouse, a rate plus a peasant supply for the
farm. No formula is hidden in code; a level is balanced by editing its line.
The first cap is 10.

The starting stocks, starting capacity, base peasant supply and the terrain
bonus of a new fief live in the same folder, in `fief.json`.

## Consequences

- Changing a number is a file change and a process restart, no build and no
  migration.
- A malformed file fails the api at start-up, never a request.
- Tests build a catalog in memory through the same port; no test reads
  `apps/api/content/`.
- If live editing without a restart is ever needed, the port stays and a
  table adapter replaces the file adapter, which is the point of the port.
