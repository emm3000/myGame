---
status: accepted
date: 2026-09-28
---
# Arts are studied in a study slot of their own on the library

## Context

PRD S1 gives the fief a library and two arts that raise production. The
obvious design reuses what M5 and ADR 011 already built: an art level is one
more kind of entry for the build slot and the build queue, and a finished
study is applied by the same walk that applies a finished upgrade. That would
let studies wait behind upgrades and upgrades behind studies, and every queue
invariant (the cap, the projection, the cascade) would have to learn about
arts. The owner decided the shape at the grilling of 2026-09-26 and confirmed
two defaults at the ticketing (#106); this ADR records both, after PRs #115 to
#121 shipped them.

## Decision

- The library is the sixth building, upgraded through the build slot and the
  build queue like the other five, occupying peasants (ADR 007) and holding
  no rate.
- Arts are studied in a **study slot** of their own on the library: one
  study at a time, no queue behind it. The build slot and the build queue are
  untouched by a study, and a study is untouched by them.
- A study starts against the fief's **built** library level, never the
  projected one. The level gates it: each art level line in content names
  the library level it requires, and a fief whose built library is below it is
  refused `LibraryLevelTooLow`. The level shortens it: the study takes
  `ceil(duration / (1 + level))` seconds, whole seconds rounded up, the
  content duration divided by one plus the built library level. The duration
  is fixed at the start, like a queue entry's (ADR 011): a library finished
  while a study runs does not shorten that study.
- Studying costs materials plus gold, the first gold sink, debited in full at
  the start in the same atomic mutation (N4), and occupies no peasants. The
  busy study slot stores its art, its target level, its start, its finish and
  the cost it debited, mirroring the busy build slot.
- Each art level line in content declares the percent in force at that level,
  as ADR 008 reads building effects, and names the one resource it raises. An
  art at level 0 reads no line. An art above it multiplies that resource's
  rate, after base, producers and terrain have been summed, by the percent of
  its level line, computed as `rate * (100 + percent) / 100` and never as
  `rate * (1 + percent / 100)`, which falls short in floating point: 200/h at
  15 % would give 229.99…, and one hour would floor to 229 instead of 230.
- A read resolves the build slot, the build queue and the study slot on **one
  chronological timeline** (ADR 005). While the earliest finish among the busy
  build slot and the busy study slot has passed, the stocks accrue to that
  finish at the building and art levels in force before it, then that finish
  applies: an upgrade raises its building and starts the next waiting entry
  at that instant, a study raises its art and idles the study slot. On a tie
  the upgrade applies first.
- A study cancels with a full refund of the cost it stored, added to the
  stocks at the cancel instant even above the capacity, where they freeze
  (ADR 005, amendment). There is no cascade: the study slot has no queue, and
  the build slot and the build queue stay as they were. A study that has
  finished by the cancel instant is applied first and the cancel is refused
  `StudyNotFound`, never swapped for anything else.

## Considered options

- **Studies as entries of the build slot and the build queue.** Rejected: a
  study is scholars' work, not masons' (`docs/lore/arts.md`), and OGame keeps
  research apart from construction for a reason. One shared queue makes a
  long study block every upgrade behind it, and the queue's projection and
  cascade would have to judge art levels and library requirements too.
- **A study queue behind the study slot.** Rejected as YAGNI: two arts of ten
  levels each do not need a queue, and adding one later is ADR 011 again with
  `art` in place of `building`.
- **Gate and divide by the projected library level**, so a player can start a
  study the instant the library upgrade is enqueued. Rejected by the owner:
  the shortened duration would be a promise the projection might not keep
  once a cancel cascades, and the built level is the only one a read can
  never contradict.
- **A rate bonus per art level as a flat amount per hour**, like a producer.
  Rejected: an art improves how the same ore or stone is worked, so it scales
  with what the fief already makes, and a percent stays meaningful as
  producers grow.
- **Two walks on read**, the upgrades first and then the study. Rejected: a
  study that finished before an upgrade would accrue the stretch between
  them at the wrong art level, and lazy evaluation must be exact (ADR 005).

## Consequences

- PRD S1 stays as written; no row is amended. M4's five buildings are the
  MVP's; S1 adds the library as the sixth.
- `Fief` carries `artLevels`, every art at 0 on founding, and `studySlot`,
  idle on founding. `Fief.restore` refuses a negative or fractional art
  level and validates a busy study slot with the same rules as the busy build
  slot (a finish before `storedAt`, a start after the finish, a negative
  cost).
- Postgres stores the art levels in `fief_arts`, one row per fief and art,
  and the study slot in nullable columns of `fiefs` plus five
  `study_cost_*` columns, like the build slot (migrations 0006 and 0008). The
  fief read stays one query (N2).
- The tie rule changes no amount: after both finishes apply at the same
  instant the fief is the same whichever went first, since the stretch between
  them has no length. It is fixed so the walk is deterministic and a test can
  pin it.
- Two arts never raise the same resource today. If a later art shared a
  resource, its multiplier would compound with the other's in the order the
  arts are listed, not add to it.
- Known gap: neither `Fief.restore` nor the study finish checks a stored
  study's target level against the current art level or the catalog. A
  stored study whose target level the catalog lacks makes every read after
  its finish fail with `UnknownArtLevel`, like the building gap ADR 011's
  queue carries.
- Known gap: the start and cancel of a study open the same way as the enqueue
  and the cancel of an upgrade (load the fief, materialize the stocks at
  `now`, mutate, save), four copies awaiting one shared opening.
- A study queue, an art that shortens a build, and arts for wood, food or
  gold are open questions of `docs/lore/arts.md`, each a future ADR.
