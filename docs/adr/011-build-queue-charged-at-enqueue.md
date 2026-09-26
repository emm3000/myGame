---
status: accepted
date: 2026-09-25
---
# The build queue is charged at the enqueue and fixed per entry

S5 lets upgrades wait behind the busy build slot. M5 gave a fief one slot and
nothing behind it, so an enqueue on a busy slot was refused. The owner decided
the queue's shape on 2026-09-25; this ADR records it and amends PRD M5.

## Decision

- A fief holds one upgrade in progress in its build slot and at most a cap of
  upgrades waiting behind it in its build queue, in order. The cap is content:
  `buildQueueCap` in `apps/api/content/fief.json` (4 today), read by the
  domain through `FiefSettings` (ADR 008), so changing it needs no deploy
  (N5).
- An enqueue starts the upgrade in the idle slot or appends it to the queue.
  Either way it debits the full cost at that instant, in the same atomic
  mutation (N4).
- Each waiting entry stores its building, its target level, the cost it
  debited and its duration in seconds, all fixed at the enqueue. A later
  content change touches neither what an entry refunds nor how long it
  takes. The chain is deterministic: an entry starts the instant the one
  before it finishes, so its finish is the previous finish plus its own
  duration, and lazy resolution (ADR 005) walks the chain on read with no
  background job.
- A new entry is validated against the projected fief: its built levels plus
  the upgrade in the slot plus every entry already waiting. The target level,
  the catalog's top level and the peasants an entry needs are all judged on
  that projection, so the same building may be chained level after level.
- Any entry can be cancelled with a full refund of the cost it stored.
  Cancelling the upgrade in the slot starts the next entry at that instant.
  After any cancel the remaining entries are revalidated against the new
  projection, and every entry that no longer fits (a target level with no
  level below it, too few peasants) is cancelled in cascade with its own
  full refund.

## Considered options

- **Charge when the entry starts**, as OGame's queue does. Rejected: the
  stocks at a future start depend on accrual, capacity and every refund in
  between, so an entry could fail mid-chain on a read long after the player
  left. That makes the resolution walk decide refusals nobody can see, and
  the chain stops being a pure function of what was stored.
- **Read cost and duration from the catalog when the entry starts.**
  Rejected for the same reason the busy slot stores its cost (S6): a content
  change would silently reprice or retime upgrades already paid for.

## Consequences

- PRD M5 is amended: the fief has one build slot and a build queue behind it
  of at most the content cap; the enqueue starts in the idle slot or appends
  to the queue and is refused with a named reason when the queue is full,
  resources are short or free peasants are too few.
- `Fief` carries its build queue, empty when founded. `Fief.restore` keeps the
  stored order and refuses an entry with a target level below 1, a negative
  cost or a negative duration. It reads no catalog, so it cannot check the
  cap, and nothing refuses entries stored behind an idle slot; the enqueue and
  the resolution walk keep that state from arising.
- Postgres stores the entries in `fief_queue_entries`, one row per entry keyed
  by `(fief_id, position)`, replaced whole on every save in the same
  transaction as the fief row. The fief read stays one query (N2).
- Enqueueing into the queue, walking it on read and cancelling a waiting entry
  ship as separate slices (#90, #91, #92); until then the queue is stored and
  restored but stays empty in play.
