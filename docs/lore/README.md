# Lore

The world of the game, as a living document. Everything a player reads or sees is named here first.

## Structure

```
docs/lore/
  README.md      this file: how the lore is used
  world.md       the premise, the land, the houses, where resources come from
  <topic>.md     one file per topic as the world grows: houses, arts, seasons, places
```

Each page states what is decided and lists its open questions at the end. A question is resolved by editing the page, never by a code comment.

## How content reads from the lore

1. A name or a story beat is written here.
2. The term enters `CONTEXT.md` with its one-line meaning and the OGame concept it replaces.
3. Content data (`apps/api` content tables or files, the copy layer in `apps/web`) uses that term. The identifier is English; the Spanish label a player sees is the lore's word.
4. The art bible (`docs/art/art-bible.md`) describes how the thing looks; images are generated from that description.

A ticket that names something new for the player links the lore page that names it. A ticket that cannot is `needs-info` until the lore catches up.

## Voice

Grounded, low-magic, early-medieval. Names are short and pronounceable in Spanish. No real-world nations, religions or historical figures. Humour is dry, never parody.

## Authorship

The author writes or approves every lore change. A Claude session may draft a page when a ticket asks for it, loading `mattpocock-skills:domain-modeling` for the terms, and marks every invented fact as a proposal until the author accepts it.
