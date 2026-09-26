---
status: accepted
date: 2026-09-25
---
# Display names are copy, not content

N5 listed names among the content the domain reads. The content files under
`apps/api/content/` (ADR 008) carry no display name, and the Spanish labels a
player sees live in the web copy layer next to every other user-facing
string, mirroring `docs/lore/names.md`. Issue #39 asked which of the two the
rule should follow.

## Decision

N5 stops naming names. Content is the data the domain computes with: costs,
durations, occupancy, effects. A display name is UI copy under N6: Spanish,
in the one copy layer, keyed by the English identifier the content and the
contracts use.

## Consequences

- Renaming a building or a resource is a copy change and a deploy, like any
  other string the player reads. The game has no third-party content editors
  and no second language, so the deploy costs nothing a file edit would save.
- The content schema and the contracts stay free of user-facing text; no
  Spanish enters `packages/contracts` or `apps/api/content/`.
- `docs/lore/names.md` remains the source the copy layer mirrors; a new name
  enters the lore first and the copy second.
- If a second language or live content editing is ever required, names move
  into content behind the same `BuildingCatalog` port, and this ADR is
  superseded.
