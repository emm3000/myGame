# Product requirements

Townword, a persistent browser game for learning American English on OGame's loop: a town produces resources over time; the player spends them on buildings that produce more, and the words the player retains earn the skills that raise production. Server-authoritative, resource-lean, English as the target with a scaffold language the player picks (ADR 035). The M and S rows below describe the town the code is; a row whose slice has not shipped says so, and the slice that ships it removes the mark (ADR 041). Terms: `CONTEXT.md`. Setting: `docs/setting/` (ADR 035).

## Must have (MVP)

| Id | Requirement |
|---|---|
| M1 | A player creates an account, signs in and signs out; from ADR 038's step 4, sign-up also picks a scaffold language, `es` or `none`. |
| M2 | A signed-in player who holds no town names one on the first visit; it is founded at the lowest free site of region 1 with starting stocks, and a second town is refused (ADR 040). |
| M3 | The town shows money, food, power and material with current amount, rate per hour and capacity, correct on any read whatever the time elapsed. |
| M4 | Seven buildings with levels: homes, farm, factory, power station, storage, school and office. Each level has a cost, a duration, people and an effect read from content, not code (ADR 040). |
| M5 | A town has one build slot and a waiting list of at most the content cap behind it (ADR 011); starting building work charges resources atomically, starts in the idle slot or joins the waiting list, and refuses with a named reason when the list is full, resources are short or free people are too few. |
| M6 | Finished building work is applied on the next read of the town, and the town's rates, capacity and people change accordingly. |
| M7 | People are supplied by the town and its homes and occupied by buildings (ADR 007); building work is staffed by the delta, releasing the current level's occupancy and charging only the increase, and a town cannot start a level whose increase its free people cannot staff. |
| M8 | The town home shows the stocks and the slots with their countdowns and updates them client-side between reads, from the server's last state and rates, never by polling faster than once a minute and repainting at most once a minute, except every second in the last minute of a countdown, the season's included (ADR 027). |

## Should have

| Id | Requirement |
|---|---|
| S1 | The school and the lessons whose retained words earn the skills that raise production (ADR 035, ADR 036, ADR 039). |
| S2 | A map showing one area at a time and its sites, the player's own first, browsable from area 1 to one past the last area holding a town (ADR 014, ADR 040). *not yet shipped (ADR 041)* |
| S3 | Town News: the town's events, each with the instant it happened (building work finished or stopped, a lesson studied or stopped, a skill earned, the town becoming a city), the stops with their refund, shown on the Report since the player last closed it (ADR 013, ADR 040). |
| S4 | Every place, resource and season is drawn to `docs/art/art-bible.md`. Amended by ADR 043: in the town a place has one hand-written silhouette and a resource has its icon, never an image. |
| S5 | A waiting list: building work waits behind the busy slot and starts in order. |
| S6 | Stopping the building work in progress, or one waiting, with a full refund. |
| S7 | Password reset and email verification: single-use mailed links, a reset only to a verified email, an unverified email a banner and never a block (ADR 015); from ADR 038's step 4, each mail in the player's scaffold language. |
| S8 | Seasons: one global calendar in content turns spring, summer, fall and winter over every town; each season scales production rates by whole percents, a read accrues each season segment at its own rates, and the town home shows the season with a countdown to the next (ADR 016). |
| S9 | Seasons on durations: content gives each season a build and a study percent, summer shortens building and winter shortens lessons; a duration is fixed with the season in force when the work starts and never retimed, and the overview answers the effective durations and the season's percents (ADR 017). |
| S10 | Hiring at the office: one hiring order at a time of workers, paid and staffed in full at the order, delivered one at a time on read and closed at its last delivery with a Town News line; every hire occupies people and eats nothing (ADR 018, ADR 040). *not yet shipped (ADR 041)* |
| S11 | Stopping the hiring order in progress: the player keeps the hires delivered by the stop instant, the undelivered ones are refunded in full and their people freed, an order named by its kind and start so a stale tab is refused, and Town News records one line with the delivered and stopped counts (ADR 018 as amended). *not yet shipped (ADR 041)* |
| S12 | A season on hiring: content gives each season a hire percent; a hire's duration is fixed with the season in force at the order for all its hires and never retimed, and the overview answers the scaled terms and the season's percent (ADR 017 as amended, ADR 040). *not yet shipped (ADR 041)* |
| S13 | Jobs: a team of workers goes from the town to a free site of the region, the road timed by the areas and the sites crossed, works there for a chosen whole count of hours and returns with pay fixed at dispatch from the terrain, the hours and the carry, never money; one team out at a time, the people away still counted and occupied, the phases derived on read, the pay credited at the return even above storage with a Town News line (ADR 019, ADR 040). *not yet shipped (ADR 041)* |
| S14 | Calling a job back: a team outbound or working is called back and turns back, walking the time it walked outbound or the full road from the site; the partial pay is proportional to the whole milliseconds worked, capped at the even carry share and never money, credited at the return even above storage, and Town News says the job was called back; a call back while returning, or naming another job, is refused (ADR 019 as amended, ADR 040). *not yet shipped (ADR 041)* |
| S15 | Clean-ups of waste sites: waste sits on a content fraction of the free sites, placed by a hash of the address, in three sizes, regrowing lazily from the last clean-up; the map shows each site's size; a team whose strength covers the waste cleans it and returns with money and material, and the site's waste starts again from 0; a team too small comes back with nothing; nobody is lost; Town News records the clean-up on the instant of the arrival (ADR 020, ADR 040). *not yet shipped (ADR 041)* |
| S16 | Trucks, a second hire kind: content gives each kind its strength, its carry, its road percent and the office level it needs; a truck is hired from built office level 3 and refused below it; a job or a clean-up sends a count per kind, at least one hire in all, its road timed by the slowest kind sent; the pay is capped by the summed carry, and the team's strength sums over the kinds (ADR 021, ADR 040). *not yet shipped (ADR 041)* |
| S17 | A season on jobs: content gives each season a road percent, fall shortens the road of every job and clean-up; each resource of a job's pay is scaled by the season's production percent, inside the carry share and never money; both are fixed with the season in force at dispatch and never retimed, the pay percents stored on the job so a call back's partial pay keeps them (ADR 022, ADR 040). *not yet shipped (ADR 041)* |
| S22 | The structure of the signed-in screens: one live read of the town feeds the stocks and the slots on the town home and the school; values repaint at most once a minute, except every second in the last minute of a countdown, the season's included; every finish reads relative time plus the local clock when more than an hour away, and a store reads the hour it fills within 8 h; a blocked action stays focusable, is announced unavailable with its reason, and names the minute the resources arrive when only they are short; the Report holds the reviews due and the Town News since the player's last close, an instant stored by that POST alone. The next goal from the content's ordered list, evaluated by the server, and one dismissible tip the first time each concept matters, seen tips stored per player, are *not yet shipped (ADR 041)* (ADR 027, ADR 040, ADR 042). |

## Won't have (this phase)

| Id | Requirement | Reason |
|---|---|---|
| W1 | Armies, combat. ADR 035 re-cuts this row: hiring workers and trucks at the office (S10, S16), jobs at a free site (S13) and clean-ups of waste sites with no battle and no losses (S15) are in; attacks, battles and archers are cut; armies, PvP, scouting and trips that meet another mayor stay out. | A second game system; comes after the economy is fun on its own. |
| W2 | Houses, messaging, diplomacy | Needs players. |
| W3 | Trade or market | Needs more than one player and the money economy tuned. |
| W4 | New land. ADR 035 re-cuts this row: a player holds one town, which grows into a city; a second holding, a settler and transport between holdings are cut. | Multiplies every screen; after the first town is complete. |
| W5 | Real-money purchases | Free game. |
| W6 | Native mobile clients. ADR 034 admits a native client per platform beside the web: Jetpack Compose on Android first, then SwiftUI on iOS and macOS; Windows, Linux, a store listing before parity, push notifications and offline play stay out. | The web is responsive; a native client is a separate product. |
| W7 | Background job runner or scheduler | ADR 005; a job is admitted only with a measurement. |
| W8 | OAuth or magic-link sign-in | Email and password need no third party. |
| W9 | Population growth or famine | ADR 007; people are derived, food is a stock. |
| W10 | Daily streaks and consecutive-day bonuses, daily quests, appointment rewards, click-to-collect and season-only rewards | The Hooks to avoid of `docs/research/engaging-strategy-ui.md`: a streak becomes the game's goal instead of the player's, and a player away for a week comes back to more, never to a broken streak; an appointment or a season-only reward is Playing by Appointment; click-to-collect is Grinding; a daily quest list is what the note's fourth principle refuses for one goal derived from state (ADR 028). |

ADRs amend this table by row id.

## Non-functional

| Id | Requirement |
|---|---|
| N1 | The server is the only source of truth; the client never computes a value the server did not sign off on, except display interpolation (M8). |
| N2 | Resource-lean: the api idles at zero CPU with no requests; a town read is one round trip to the store; no process advances state on a timer. |
| N3 | A town read answers in under 100 ms on the reference host, the production api function on Vercel with its Neon database (ADR 031), excluding network. |
| N4 | Every mutation on a town is one transaction; two concurrent mutations serialize. |
| N5 | Content (buildings, costs, durations, and the learning content: the lexicon of words with their frames, glosses and definitions, the lessons in their order, the grammar inventory and the texts) is data the domain reads, changeable without a code deploy. Learning content is drafted offline, never generated at runtime, and ships only through the content gate, a test in `pnpm gate` on order, frames, coverage, glosses and grammar, and the owner's review and merge (ADR 035, ADR 037). |
| N6 | Every learning and game text is American English, the target. The player's scaffold language, `es` or `none` at launch, supports each word by its stability: shown beside it under 7 days, on tap from 7, an English definition on tap from 30; under `none` the support is the English definition. Under `es` the game's chrome is Spanish until every chrome lesson is studied, both languages until their skills are earned, English after; under `none` it is English. Account screens, refusals, review verdicts and mail are always in the scaffold language. Spanish addresses the reader as tú, never vos. Every string a client or a mail shows comes from one message catalog per language, and refusals cross the wire as a kind and its parameters, never as prose (ADR 038); until those ship, the shipped copy is Spanish in one layer per client. Identifiers are English (ADR 035). |
| N7 | Every image ships with its source and complies with the art bible: a town illustration is hand-written SVG, so the file is its source (ADR 030, amendment of 2026-11-05). |
| N8 | Every signed-in screen meets WCAG 2.2 AA (ADR 027). |

## Acceptance criterion

A new player signs up, names the town, sees four resources accruing, starts building work on the farm, closes the browser, returns after the duration has elapsed, and sees the work applied, the food rate raised, and every amount equal to what the formulas in ADR 005 predict for the elapsed time, on a server that made zero requests to itself while the browser was closed. A review that fell due meanwhile is waiting on the Report, and no card changed while the browser was closed (ADR 036).
