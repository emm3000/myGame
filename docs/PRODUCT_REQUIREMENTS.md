# Product requirements

A persistent browser game in a medieval setting on OGame's loop: a fief produces resources over time; the player spends them on buildings that produce more. Server-authoritative, resource-lean, Spanish UI addressed as tú. Terms: `CONTEXT.md`. World: `docs/lore/`.

## Must have (MVP)

| Id | Requirement |
|---|---|
| M1 | A player creates an account, signs in and signs out. |
| M2 | A new player receives one fief at free coordinates with starting stocks. A lord's second fief is never given: it is founded by a settler and starts with the same stocks (ADR 023). |
| M3 | The fief shows wood, stone, iron, gold and food with current amount, rate per hour and capacity, correct on any read whatever the time elapsed. |
| M4 | Five buildings with levels: sawmill, quarry, iron mine, farm, warehouse. Each level has a cost, a duration and an effect read from content, not code. |
| M5 | A fief has one build slot and a build queue of at most the content cap behind it (ADR 011); the enqueue debits resources atomically, starts in the idle slot or appends to the queue, and refuses with a named reason when the queue is full, resources are short or free peasants are too few. |
| M6 | A finished upgrade is applied on the next read of the fief, and the fief's rates, capacity and peasants change accordingly. |
| M7 | Peasants are supplied by the fief and its farm and occupied by buildings (ADR 007); an upgrade is staffed by the delta, releasing the current level's occupancy and charging only the increase, and a fief cannot enqueue a level whose increase its free peasants cannot staff. |
| M8 | Every signed-in fief screen, the fief, the map and the chronicle, carries the resource bar and the slots strip and updates their countdowns and amounts client-side between reads, from the server's last state and rates, never by polling faster than once a minute and repainting at most once a minute, except every second in the last minute of a countdown, the season's included, and once at a levy's delivery and at a march's arrival or departure (ADR 027). |

## Should have

| Id | Requirement |
|---|---|
| S1 | The library and two arts that raise production. |
| S2 | A kingdom map showing one province at a time and its plots, the player's own first, browsable from province 1 to one past the last province holding a fief (ADR 014). |
| S3 | A chronicle of the fief's events, each with the instant it happened: an upgrade finished, an art learned, an upgrade cancelled and a study cancelled, the two cancels with their refund (ADR 013). |
| S4 | Every building, resource, bandit camp tier and art, and the convoy of a transport (ADR 024), has an image generated to `docs/art/art-bible.md`; units, seasons and the march keep their hand-drawn SVG icon, as the camp keeps its icon on the map's plot tile. |
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
| S16 | Cavalry, a second unit kind: content gives each kind its strength, its carry, its road percent and the barracks level it needs; the rider is recruited from built barracks level 3 and refused below it; a march or an attack sends a count per kind, at least one unit in all, its road timed by the slowest kind sent; the forage gathers per head whatever the kind and every loot is capped by the summed carry; a battle sums the strength over the kinds and a winner's losses fall on the infantry first, always leaving one unit; the units away and the chronicle count each kind, and the army section shows a card per kind, the rider's locked below its level (ADR 021). |
| S17 | A season on marches: content gives each season a road percent, autumn shortens the road of every march and attack; each resource of a forage loot is scaled by the season's production percent, spring raising the food and winter lowering it, inside the carry share and never gold; both are fixed with the season in force at dispatch and never retimed, the loot percents stored on the march so a recall's partial loot keeps them; the battle and the attack loot read no season, and the map's march and attack forms preview the season and mark the line it changes (ADR 022). |
| S18 | A second fief, founded by a settler: the settler is a third unit kind, recruited from built barracks level 5, of strength 0 and carry 0, that no forage and no attack takes; one settler alone is sent from the map on a founding march to a free plot with no camp, the lord naming the new fief; the plot is reserved from dispatch, shown reserved on the map, skipped by sign-up and refused to every other march until the founding is recalled or applied; at the arrival, applied on read, the fief is founded with the starting stocks of M2 and nothing built, and the settler leaves the origin's count; a lord holds at most the content's cap of fiefs, 2, and nothing travels between them; every fief is read at its own id and URL, the header switches between a lord's fiefs, the map marks each of them as own, and the chronicle records the founding sent and the fief founded (ADR 023). |
| S19 | Transport between a lord's fiefs: a party of infantry and cavalry carries an amount of each resource from one of a lord's fiefs to the other, sent from the other fief's plot on the map as the fourth march order; the cargo is at least 1 and at most the party's summed carry and the stocks, debited at dispatch, and a settler carries none; the road is one way with no stay, timed as every march's and fixed at dispatch; the destination shows the cargo on its way with a countdown and credits it at the arrival, applied on its own read, even above the capacity, and the party returns empty; a transport recalled before its arrival carries its cargo home and the destination reads none; a mutation over both fiefs locks the lord's fiefs in a fixed order; the chronicle records the transport sent on the origin and received on the destination, and one generated image shows the convoy; units never move between fiefs (ADR 024). |
| S20 | Archers, a fourth unit kind: the archer is third in the kinds' order, before the settler, with its terms in content, an infantry's strength and pace and half its carry; it is recruited from built barracks level 2 and refused below it; archers march beside infantry and cavalry on a forage, an attack and a transport, never on a founding; a winner's losses fall on the infantry, then on the cavalry, then on the archers, with no new formula, so a won battle that sent archers brings at least one home; the units away, the march card and the chronicle count three kinds in a party, and the army section shows the archer's card third of four, locked below its level (ADR 025). |
| S22 | The structure of the signed-in screens: one live read per fief feeds a resource bar and a slots strip on the fief, the map and the chronicle, sticky on desktop, a slot shown once its building can use it and each cell linking to its section; values repaint at most once a minute, except every second in the last minute of a countdown, the season's included, and once at a levy's delivery and at a march's arrival or departure; every finish reads relative time plus the local clock when more than an hour away, and a store reads the hour it fills within 8 h; a blocked action stays focusable, is announced unavailable with its reason, and names the minute the resources arrive when only they are short; the digest of every fief's events and filled stores since the player's last *Entendido*, an instant stored by that POST alone and due after the content's absence, with each store's fill instant stored per resource and kept across every re-base; the next goal from the content's ordered list, evaluated by the server and dismissed per fief; one dismissible hint the first time each concept matters, seen hints stored per player; the switcher badging each other fief's free slots and full stores; and an opt-in browser notification per finished slot, sent only after the re-read confirms it and kept in the browser (ADR 027). |

## Won't have (this phase)

| Id | Requirement | Reason |
|---|---|---|
| W1 | Armies, marches, combat. ADR 018 admits recruiting units in a barracks slot (S10), ADR 019 forage marches to a free plot (S13), ADR 020 attacks on bandit camps (S15), ADR 021 a second unit kind, cavalry (S16), and ADR 025 archers (S20); rams, armies, PvP, scouting and marches that meet another lord stay out. | A second game system; comes after the economy is fun on its own. |
| W2 | Houses, messaging, diplomacy | Needs players. |
| W3 | Trade or market | Needs more than one player and the gold economy tuned. |
| W4 | New land. ADR 023 admits a second fief, founded by a settler (S18), and ADR 024 transport between a lord's fiefs (S19); more than two fiefs stay out. | Multiplies every screen; after the first fief is complete. |
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
| N3 | A fief read answers in under 100 ms on the reference host, the production server (ADR 026), excluding network. |
| N4 | Every mutation on a fief is one transaction; two concurrent mutations serialize. |
| N5 | Content (buildings, costs, durations) is data the domain reads, changeable without a code deploy; display names are copy under N6 (ADR 010). |
| N6 | UI copy is Spanish, tú, and lives in one copy layer; identifiers are English. |
| N7 | Every image ships with the prompt that produced it and complies with the art bible. |
| N8 | Every signed-in screen meets WCAG 2.2 AA (ADR 027). |

## Acceptance criterion

A new player signs up, sees a fief with five resources accruing, enqueues a sawmill upgrade, closes the browser, returns after the duration has elapsed, and sees the upgrade applied, the wood rate raised, and every amount equal to what the formulas in ADR 005 predict for the elapsed time, on a server that made zero requests to itself while the browser was closed.
