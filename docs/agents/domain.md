# Domain Docs

How the engineering skills consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root: the glossary, one line per term, medieval vocabulary mapped from the OGame concept it replaces.
- **`docs/adr/`**: read the ADRs that touch the area you are about to work in. Numbering is `NNN-<slug>.md`, three digits.
- **`docs/lore/`**: the world the glossary names come from. A term that a player sees is born in the lore first, enters `CONTEXT.md` second, and reaches code last.

This is a single-context repo: one `CONTEXT.md`, one `docs/adr/`. If the game grows a second bounded context (a market, a chronicle), a `CONTEXT-MAP.md` at the root points at one `CONTEXT.md` per context.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Do not drift to synonyms the glossary avoids, and do not drift back to the OGame word (`planet`, `deuterium`, `fleet`) once the glossary has replaced it.

If the concept you need is not in the glossary yet, that is a signal: either you are inventing language the project does not use (reconsider) or there is a real gap (file a docs ticket that loads `mattpocock-skills:domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR 005 (lazy evaluation), but worth reopening because…_

An ADR that shipped behavior contradicts is fixed by a docs ticket the same day, not left to drift (`docs/agents/multi-session.md`, Between tickets).
