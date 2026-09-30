# Product requirements

A persistent browser game in a medieval setting on OGame's loop: a fief produces resources over time; the player spends them on buildings that produce more. Server-authoritative, resource-lean, Spanish UI addressed as tú. Terms: `CONTEXT.md`. World: `docs/lore/`.

## Must have (MVP)

| Id | Requirement |
|---|---|
| M1 | A player creates an account, signs in and signs out. |
| M2 | A new player receives one fief at free coordinates with starting stocks. |
| M3 | The fief shows wood, stone, iron, gold and food with current amount, rate per hour and capacity, correct on any read whatever the time elapsed. |
| M4 | Five buildings with levels: sawmill, quarry, iron mine, farm, warehouse. Each level has a cost, a duration and an effect read from content, not code. |
| M5 | A fief has one build slot and a build queue of at most the content cap behind it (ADR 011); the enqueue debits resources atomically, starts in the idle slot or appends to the queue, and refuses with a named reason when the queue is full, resources are short or free peasants are too few. |
| M6 | A finished upgrade is applied on the next read of the fief, and the fief's rates, capacity and peasants change accordingly. |
| M7 | Peasants are supplied by the fief and its farm and occupied by buildings (ADR 007); an upgrade is staffed by the delta, releasing the current level's occupancy and charging only the increase, and a fief cannot enqueue a level whose increase its free peasants cannot staff. |
| M8 | The fief screen updates its countdown and amounts client-side between reads, from the server's last state and rates, never by polling faster than once a minute. |

## Should have

| Id | Requirement |
|---|---|
| S1 | The library and two arts that raise production. |
| S2 | A kingdom map showing one province at a time and its plots, the player's own first, browsable from province 1 to one past the last province holding a fief (ADR 014). |
| S3 | A chronicle of the fief's events, each with the instant it happened: an upgrade finished, an art learned, an upgrade cancelled and a study cancelled, the two cancels with their refund (ADR 013). |
| S4 | Every building and resource has an image generated to `docs/art/art-bible.md`; units, camps, seasons and the march keep their hand-drawn SVG icon. |
| S5 | A build queue: upgrades wait behind the busy slot and start in order. |
| S6 | Cancelling the upgrade in progress with a refund. |
| S7 | Password reset and email verification: single-use mailed links, a reset only to a verified email, an unverified email a banner and never a block (ADR 015). |
| S8 | Seasons: one global calendar in content turns spring, summer, autumn and winter over every fief; each season scales production rates by whole percents, a read accrues each season segment at its own rates, the fief header shows the season, the year and a countdown, and the resource bar marks the resource the season changes (ADR 016). |
| S9 | Seasons on durations: content gives each season a build and a study percent, summer shortens building and winter shortens study; a duration is fixed with the season in force at the enqueue or the study start and never retimed, the overview answers the effective durations and the season's percents, and the buildings and arts section headers mark the season that shortens them (ADR 017). |
| S10 | Units recruited in a barracks slot: the barracks is the seventh building, whose built level gates recruiting and shortens every unit's training; one order at a time of N infantry, paid and staffed in full at the order, delivered one unit at a time on read and closed at its last delivery with a chronicle line; every unit occupies peasants and eats nothing (ADR 018). |
| S11 | Cancelling the recruit order in progress: the lord keeps the units delivered by the cancel instant, the undelivered units are refunded in full and their peasants freed, an order named by its unit and start so a stale tab is refused, and the chronicle records one line with the delivered and cancelled counts (ADR 018 as amended). |
| S12 | A season on unit training: content gives each season a train percent, spring shortens training; a unit's duration is fixed with the season in force at the recruit order for all its units and never retimed, and the overview answers the scaled terms and the season's train percent (ADR 017 as amended). |
| S13 | Forage marches: infantry march from the fief to a free plot of the kingdom, the road timed by the provinces and the plots crossed, forage there for a chosen whole count of hours and return with a loot fixed at dispatch from the terrain, the hours and the carry; one march at a time, the men away still counted and occupying their peasants, the phases derived on read, the loot credited at the return even above the capacity with a chronicle line; sent from a free plot on the map and shown in the army section (ADR 019). |
| S14 | Recalling a march: a march outbound or foraging is recalled (from the army-section button, Decision 8 of #277) and turns back, walking the time it walked outbound or the full road from the plot; the partial loot is proportional to the whole milliseconds foraged, capped at the even carry share and never gold, credited at the return even above the capacity, and the chronicle line says the march was recalled; a recall while returning, or naming another march, is refused (ADR 019 as amended). |
| S15 | Attacks on bandit camps: a camp sits on a content fraction of the free plots, placed by a hash of the coordinates with a tier and a strength that regrows lazily from its last battle; the map shows each camp's tier and strength; the march slot sends an attack with no stay, the camp's strength fixed at dispatch; the battle is fought at the arrival, deterministic, the loser falling whole and the winner losing by the rival's share of strength squared, the dead leaving the count and a won attack returning with the survivors and a loot of 60 per strength point in thirds with gold, capped by the survivors' carry; a chronicle line dated by the arrival; a forage to a camp's plot, an attack on a plot without a camp and a recall at or after the battle are refused (ADR 020). |

## Won't have (this phase)

| Id | Requirement | Reason |
|---|---|---|
| W1 | Armies, marches, combat. ADR 018 admits recruiting units in a barracks slot (S10), ADR 019 forage marches to a free plot (S13) and ADR 020 attacks on bandit camps (S15); armies, PvP, scouting and marches that meet another lord stay out. | A second game system; comes after the economy is fun on its own. |
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
