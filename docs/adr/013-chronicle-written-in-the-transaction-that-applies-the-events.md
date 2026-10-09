---
status: accepted
date: 2026-09-28
---
# The chronicle is written in the transaction that applies the events

## Context

PRD S3 gives the fief a chronicle: what finished and what was undone while
the lord looked elsewhere (`docs/lore/chronicle.md`). Nothing shipped before
S3 could answer it. A finish applied by the resolve (ADR 005) leaves no trace
on the fief once the slot idles, and a cancel's refund merges into the stocks
(ADR 011, ADR 012), so no read can derive the chronicle from the fief's stored
state. The obvious remedies are a background job that logs what it finds or a
log appended after the fact, and both stamp the moment of writing, not the
moment of the happening. The owner decided the shape at the grilling of
2026-09-26 (#128) and confirmed four readings on 2026-09-28; this ADR records
them after PRs #135 to #139 shipped.

## Decision

- The chronicle records **four kinds of event**: an upgrade finished, an art
  learned, an upgrade cancelled and a study cancelled. Every event names its
  building or its art and the level reached or the level cancelled; the two
  cancels carry the refund, resource by resource. There is no event for an
  enqueue or a study start: the player did those.
- The **resolve and the two cancels answer the events they produced beside
  the fief**, as `ChangedFief` (`fief`, `events`). The resolve pushes one event
  per finish its walk applies, in the order they finished. A cancel produces
  one event for the entry named and one more for every entry its cascade
  cancels, each with its own refund. The entries a legacy queue restart drops
  (a queue stored behind an idle slot, `CONTEXT.md`, Resolve) are refunded
  without an event.
- Each event is **stamped with the instant it happened**: `finishesAt` for a
  finish, the cancel instant for a cancel, never the `now` of the read that
  wrote it. The chronicle of a fief read a week after its sawmill finished
  dates the finish a week ago.
- The events are **written in the same transaction that applies them**. A
  `ChronicleWriter` port in `packages/domain` receives them; the use case
  calls it right after the fief is saved and answers its refusal as its own,
  so a refused record rolls the whole mutation back. The api binds the writer
  to the transaction the mutation runs in, beside the fief repository. A read
  that finds nothing to resolve runs no transaction and writes nothing; a
  read that finds a finish reruns the resolve inside one and writes it. No cron,
  no job (W7, ADR 005).
- The **domain never reads the chronicle**. No rule depends on it, so no use
  case takes a reader (ADR 004). `ChronicleReader` is an api-side port beside
  `Accounts`, implemented by the same adapter as the writer; the route that
  answers it resolves the fief first, so every finish that has passed is
  written before the chronicle is read.
- **Retention is the last 100 events per fief.** The insert prunes what
  exceeds 100 in the same transaction, keeping the newest by instant and, on a
  tie, the last written. The read answers the same 100, newest first.
- The wire carries **data, never a sentence** (ADR 010): kind, building or
  art, level, instant and refund. The sentence of each kind is web copy from
  `docs/lore/names.md`.
- The web shows the chronicle on `/cronica`, the game's second screen,
  reached from a navigation bar the signed-in layout gains (Feudo | Crónica).
  The screen **reads once when it opens**: no re-read, no countdown, no
  pagination. What finishes while it is open shows the next time it opens.

## Considered options

- **Derive the chronicle on read from the fief**, as the stocks are derived
  (ADR 005). Rejected: the fief stores what stands, not what stood. An applied
  finish and a merged refund are gone from it, and storing what they undid
  would rebuild the chronicle under another name.
- **Rebuild the fief from its events** (event sourcing). Rejected: the fief
  row stays the one source of truth, and the chronicle is a record of it, not
  a source for it. Pruning to 100 events is then harmless.
- **A job that logs finishes as they pass**, or an outbox drained after the
  transaction. Rejected by W7 and ADR 005, and a job stamps the moment it
  runs; only the transaction that applies a finish knows its `finishesAt`.
- **Stamp events with the read's `now`.** Rejected: a lord who returns after
  a week would read that every work finished on the day of the return.
- **An event for the enqueue and the study start.** Rejected: the player
  ordered those in the fief's presence and the busy slot shows them; the
  chronicle records endings, never orders (`docs/lore/chronicle.md`).
- **One event per cancel, with the cascade's refunds summed.** Rejected: each
  cascaded entry is an entry the player enqueued and paid for, and the lore
  wants each line to say what it sent back to the stores.
- **A reader port in `packages/domain`.** Rejected: the domain holds rules,
  and no rule reads the chronicle. A port with no domain caller is ceremony
  (ADR 004).
- **Unbounded retention with pagination.** Rejected as out of scope of #128:
  100 per fief bounds the table by the number of fiefs and no lord has yet
  missed an older line.

## Consequences

- PRD S3 is amended by row: the chronicle records an upgrade finished, an art
  learned, an upgrade cancelled and a study cancelled, each with the instant
  it happened.
- `packages/domain` gains `FiefEvent`, `ChangedFief` and the `ChronicleWriter`
  port. `resolveUpgrade`, `cancelUpgrade` and `cancelStudy` take `chronicle`
  and record only after they save; a read with nothing to resolve and a
  refused cancel record nothing. The resolve's answer is `ChangedFief` plus
  `hasChanged`.
- Postgres stores the events in `fief_events` (migration 0009), one row per
  event keyed by an identity, with the kind as an enum, a check that a row
  names a building or an art and never both or neither, and an index on
  `(fief_id, occurred_at, id)` for the read and the prune. The rows of a
  deleted fief go with it.
- The writer must be built on the transaction, never on the pool: bound
  outside it, its insert blocks on the fief row the mutation holds locked,
  since the foreign key check takes a share lock the update lock excludes.
- A plain read of the fief writes when a finish has passed. That was already
  so (ADR 005 resolves on read); the chronicle adds rows to the same
  transaction, nothing else.
- The retention cap is a constant of the api and of the contracts, not
  content: the domain never reads it, so ADR 008's port has nothing to hand
  it, and changing it is a deploy.
- Every read of the chronicle costs a read of the fief plus one query, never
  more (N2).
- Known gap: the loading line `Estamos leyendo la crónica…` shipped in #134
  is not in `docs/lore/names.md`; the author accepts or replaces it there.
  The chronicle's lore (`docs/lore/chronicle.md`, the chronicle section of
  `names.md`) is a proposal until the author accepts it.
- Events of other fiefs, notifications and filtering are out of scope of
  #128; a chronicle that records what other fiefs do to this one is an open
  question of `docs/lore/chronicle.md`, a future ADR.

## Amendment (2026-09-29)

The chronicle records a fifth kind of event, recruits delivered (S10, ADR
018): the units one recruit order delivered, one event per order and never
per unit, naming the unit and the count and stamped with the order's end,
the instant of the last delivery, never the `now` of the read that closed
it. It carries no level and no refund. The resolve answers it beside the
finishes of the same walk, after the upgrade and the study of a tied
instant, and the api writes it in the transaction that closes the order.
`fief_events` gains a nullable `unit` and a nullable `count`, its `level`
turns nullable, and the check `fief_events_one_subject` replaces
`fief_events_building_or_art`: exactly one of `building`, `art` and `unit`,
a `level` on a building or art row only, a `count` on a unit row only
(migration 0012). Nothing else here changes: the events are still written
in the transaction that applies them, the chronicle still records endings
and never orders, the domain never reads it, and retention stays at 100.

## Second amendment (2026-09-29)

The chronicle records a seventh kind of event, march returned (S13, ADR
019), after the sixth, recruits cancelled, that the amendment of ADR 018
records: the infantry one forage march brought home, one event per march,
naming the plot (province and plot), the infantry and the loot, resource
by resource, and stamped with the march's return, `returnsAt`, never the
`now` of the read that closed it. It carries no level, no unit and no
refund on the wire. The resolve answers it beside the finishes of the same
walk, after the upgrade, the study and the recruits delivered of a tied
instant, and the api writes it in the transaction that closes the march.
`fief_events` gains a nullable `province` and a nullable `plot`, a
march-returned row is stored as a unit row with the infantry in `count`
and the loot in the `refund_*` columns, and the check
`fief_events_one_subject` is replaced: `province` and `plot` both null, or
both from 1 on a unit row only (migration 0014). Nothing else here
changes: the events are still written in the transaction that applies
them, the chronicle still records endings and never orders, the domain
never reads it, and retention stays at 100.

## Third amendment (2026-09-29)

The chronicle records an eighth kind of event, battle fought (S15, ADR
020): the battle one attack fought at its camp, won or lost, one event per
attack, naming the plot (province and plot), the camp's tier, the infantry
lost and the strength the camp lost, both counts written even when one is
0, and stamped with the attack's arrival, `arrivesAt`, never the `now` of
the read that fought it. It carries no level, no `unit` field (the infantry
lost is stored in `count`) and no refund. The resolve answers it beside the finishes of the
same walk, after the upgrade, the study and the recruits delivered of a
tied instant and before the march returned, and the api writes it in the
transaction that fights the battle. A won attack goes on to write a march
returned at the return, with the survivors and the loot; a lost attack
writes the battle alone. `fief_events` gains a nullable `camp_tier` and
`camp_lost` and a `won` boolean defaulting to false, a battle row is stored
as a unit row with the infantry lost in `count` and the target in
`province` and `plot`, and the check `fief_events_battle_terms` ties the
three columns to `battle_fought` by `kind::text` (migration 0017). Nothing
else here changes: the events are still written in the transaction that
applies them, the chronicle still records endings and never orders, the
domain never reads it, and retention stays at 100.

## Fourth amendment (2026-10-02)

The chronicle records a ninth and a tenth kind of event, founding sent
and fief founded (S18, ADR 023), and the first lifts "the chronicle
still records endings and never orders" for one order. `foundingSent`
is written when a founding march is dispatched, on the fief the settler
leaves, stamped with the dispatch instant: the plot is reserved from
that instant, and the line is the record of the claim. `dispatchFounding`
records it right after `fiefs.save`, in the transaction of the
dispatch, and a refusal records nothing. A forage and an attack still
write nothing when they leave. `fiefFounded` is stamped with the
founding's arrival, `arrivesAt`, never the `now` of the read that
applied it; the resolve answers it among the origin's events, after the
upgrade, the study, the recruits delivered and the battle of a tied
instant and before the march returned, and records the same event on
the new fief's id, its first, in the same transaction. Each names the
new fief, by the name its lord gave it, and its plot (province and
plot), with no level, no unit, no count and no refund. A founding
recalled, or turned home at a held plot, writes the march returned of
its return with one settler and no fief founded, and its founding sent
stays. `fief_events` gains a nullable `settler_count` (migration 0021)
and a nullable `fief_name`, the check `fief_events_founding_name` ties
`fief_name` to the two kinds by `kind::text`, and
`fief_events_one_subject` is rewritten to count `fief_name` as a
subject that carries `province` and `plot` (migration 0024). Nothing
else here changes: the events are still written in the transaction
that applies them, the domain never reads the chronicle, each fief has
its own, and retention stays at 100.

## Fifth amendment (2026-10-09)

The chronicle records an eleventh and a twelfth kind of event,
`transportSent` and `transportArrived`. ADR 024 owns them: when each is
written, what it is stamped with and what it carries. Migration 0026
adds both to `fief_event_kind` and extends `fief_events_founding_name`
to cover them. Nothing else here changes: the events are still written
in the transaction that applies them, the domain never reads the
chronicle, each fief has its own, and retention stays at 100.
