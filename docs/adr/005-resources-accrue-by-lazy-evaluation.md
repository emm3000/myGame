---
status: accepted
date: 2026-09-21
---
# Resources accrue by lazy evaluation, never by a ticking process

A fief produces wood while its owner sleeps. The obvious design, a scheduler
that adds production to every fief every minute, is the classic source of
drift, double-counting after a restart and a server that burns CPU for
players who are not there. The server must stay cheap.

## Decision

Resource state is stored as `(amount, at, ratePerHour, capacity)`. Reading a
fief computes `min(capacity, amount + ratePerHour * hours(at, now))` and
writes nothing. A mutation first materializes the amount at `now`, applies
the change, and stores `(newAmount, now)` in the same transaction. Build
queue items whose finish time has passed are resolved on the next read of
that fief, in order, and only for that fief. There is no cron, no
`setInterval`, no worker that scans fiefs.

`now` comes from the `Clock` port; the domain never reads the wall clock.

## Consequences

- Idle players cost nothing.
- Correctness is a pure function of stored state and `now`; tests advance a
  fixed clock instead of sleeping.
- Anything that must happen without a read (a march arriving, a market
  order) is a future ADR; it will be resolved on the read of the affected
  party, or by a scheduled job justified by a measurement, never by default.
- Every mutation on a fief runs in one transaction that reads, materializes
  and writes; two concurrent mutations serialize on the fief row.
