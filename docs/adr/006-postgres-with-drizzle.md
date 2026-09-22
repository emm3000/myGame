---
status: accepted
date: 2026-09-22
---
# Postgres with Drizzle for persistence

The api needs a store for players, fiefs, buildings and queues that supports
the per-fief transaction ADR 005 requires and will survive the game growing
past one server.

## Decision

Postgres, accessed through Drizzle ORM with SQL-shaped migrations checked
into `apps/api`. Adapters in `apps/api` implement the domain ports; nothing
outside them imports Drizzle. Every schema change ships its migration and a
test that applies it to the previous version.

## Alternative rejected

SQLite (via `better-sqlite3` or libSQL) is leaner: no separate process, one
file, trivial backups, fast enough for a single server and thousands of
players. It loses on concurrent writers, on hosting options and on a later
move to more than one api process. It is the right call if the game stays on
one small box for its first year.

## Status

Accepted on 2026-09-22 after grilling. The deciding argument: moving from
SQLite to Postgres later is exactly the adaptation the workflow forbids
(ADR 002, rebuild never adapt), and one extra process is cheaper than that
rebuild. N4's serialization of concurrent mutations is a `SELECT ... FOR
UPDATE` on the fief row inside the mutation's transaction.
