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

## Amendment (2026-09-25)

Reading a fief now computes
`max(amount, min(capacity, amount + ratePerHour * hours(at, now)))`. Cancelling
an upgrade refunds its full cost (S6), and a refund may push a stock above the
capacity; clamping on the next read would destroy it. A stock at or above the
capacity reads back unchanged whatever the elapsed time, with no accrual and
no clamp, until spending brings it under; a stock under the capacity accrues
up to it as before.

## Amendment (2026-09-29)

A rate is no longer constant over a span. The season in force scales every
rate, and the season changes on a global calendar (ADR 016), so reading a
fief splits `[at, now]` at every season boundary it crosses and accrues
segment by segment: each segment takes the `ratePerHour` in force at its
start, applies the formula above over its own elapsed time, and floors its
result to a whole amount, so a stock is clamped to the capacity or frozen
above it within each segment, never once for the span. A span inside one
season accrues exactly as before. Nothing else here changes: the state stored
is still `(amount, at, ratePerHour, capacity)`, the rates are still derived
on read, and no process turns the season.

## Amendment (2026-10-06)

The stored state is `(amount, at, ratePerHour, capacity, fullSince)`:
`fullSince` is the instant a store reached its capacity, null while it is
under it (ADR 027). It is stored so that the instant survives the re-base a
read performs when it applies a finish, which would otherwise read a store
full since the read. Every re-base keeps it: a store at or above the
capacity after the re-base keeps the instant derived from the state before
it, capped at the re-base instant, and a store below the capacity clears it.
It is derived from the stored state when first reached and never advanced by
a process; the formula above is unchanged.
