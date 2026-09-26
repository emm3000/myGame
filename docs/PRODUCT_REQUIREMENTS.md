# Product requirements

A persistent browser game in a medieval setting on OGame's loop: a fief produces resources over time; the player spends them on buildings that produce more. Server-authoritative, resource-lean, Spanish UI addressed as tú. Terms: `CONTEXT.md`. World: `docs/lore/`.

## Must have (MVP)

| Id | Requirement |
|---|---|
| M1 | A player creates an account, signs in and signs out. |
| M2 | A new player receives one fief at free coordinates with starting stocks. |
| M3 | The fief shows wood, stone, iron, gold and food with current amount, rate per hour and capacity, correct on any read whatever the time elapsed. |
| M4 | Five buildings with levels: sawmill, quarry, iron mine, farm, warehouse. Each level has a cost, a duration and an effect read from content, not code. |
| M5 | A fief has one build slot; the enqueue debits resources atomically and refuses with a named reason when the slot is busy, resources are short or free peasants are too few. |
| M6 | A finished upgrade is applied on the next read of the fief, and the fief's rates, capacity and peasants change accordingly. |
| M7 | Peasants are supplied by the fief and its farm and occupied by buildings (ADR 007); an upgrade is staffed by the delta, releasing the current level's occupancy and charging only the increase, and a fief cannot enqueue a level whose increase its free peasants cannot staff. |
| M8 | The fief screen updates its countdown and amounts client-side between reads, from the server's last state and rates, never by polling faster than once a minute. |

## Should have

| Id | Requirement |
|---|---|
| S1 | The library and two arts that raise production. |
| S2 | A kingdom map showing the player's province and its plots. |
| S3 | A chronicle of the fief's events (upgrades finished, arts learned). |
| S4 | Every building, resource and unit has an image generated to `docs/art/art-bible.md`. |
| S5 | A build queue: upgrades wait behind the busy slot and start in order. |
| S6 | Cancelling the upgrade in progress with a refund. |
| S7 | Password reset and email verification. |

## Won't have (this phase)

| Id | Requirement | Reason |
|---|---|---|
| W1 | Units, armies, marches, combat | A second game system; comes after the economy is fun on its own. |
| W2 | Houses, messaging, diplomacy | Needs players. |
| W3 | Trade or market | Needs more than one player and the gold economy tuned. |
| W4 | New land (second fief) | Multiplies every screen; after the first fief is complete. |
| W5 | Real-money purchases | Free game. |
| W6 | Native mobile clients | The web is responsive; a native client is a separate product. |
| W7 | Background job runner or scheduler | ADR 005; a job is admitted only with a measurement. |
| W8 | OAuth or magic-link sign-in | Email and password need no third party. |
| W9 | Population growth or famine | ADR 007; peasants are derived, food is a stock. |

ADRs amend this table by row id.

## Non-functional

| Id | Requirement |
|---|---|
| N1 | The server is the only source of truth; the client never computes a value the server did not sign off on, except display interpolation (M8). |
| N2 | Resource-lean: the api idles at zero CPU with no requests; a fief read is one round trip to the store; no process advances state on a timer. |
| N3 | A fief read answers in under 100 ms on the reference host, excluding network. |
| N4 | Every mutation on a fief is one transaction; two concurrent mutations serialize. |
| N5 | Content (buildings, costs, durations) is data the domain reads, changeable without a code deploy; display names are copy under N6 (ADR 010). |
| N6 | UI copy is Spanish, tú, and lives in one copy layer; identifiers are English. |
| N7 | Every image ships with the prompt that produced it and complies with the art bible. |

## Acceptance criterion

A new player signs up, sees a fief with five resources accruing, enqueues a sawmill upgrade, closes the browser, returns after the duration has elapsed, and sees the upgrade applied, the wood rate raised, and every amount equal to what the formulas in ADR 005 predict for the elapsed time, on a server that made zero requests to itself while the browser was closed.
