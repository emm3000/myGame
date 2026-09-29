# CONTEXT.md

Glossary of the game's domain. One line per term, the term as code and docs use it, and the OGame concept it replaces where one exists. Names a player sees come from `docs/lore/` first and enter here second; their Spanish labels are in `docs/lore/names.md`. Decisions behind the terms: `docs/adr/`.

## Holdings

- **Player** — an account; owns one or more fiefs. Identified by `PlayerId`.
- **Fief** — the holding a player develops: land, buildings, stores, peasants. Replaces *planet*. One per player in the MVP.
- **Coordinates** — `kingdom:province:plot`, the fief's place on the map. A new fief takes the lowest free plot of the first kingdom. Replaces *galaxy:system:position*.
- **Kingdom** — the great region a fief lies in, a number in the data and a name on screen (Vadoalto is kingdom 1). Provinces and plots inside it are numbered. Replaces *galaxy*.
- **Province** — a numbered region of a kingdom with `plotsPerProvince` plots and one terrain, set by its number and shared by every plot in it. Replaces *system*.
- **Plot** — the numbered place in a province that one fief holds; free until a fief is founded on it, held after. Replaces *position*.
- **Terrain** — what a province is made of: lowlands, uplands or ridges. It adds to the rate of the resource it favours, on top of the base rate and the producers, and forbids nothing.
- **Kingdom map** — the read-only view of one province at a time: its terrain and every plot with the name of the fief holding it, the viewer's own marked. Browsable within the viewer's kingdom from province 1 to `lastProvince`, the last province holding a fief plus one; a province outside that range is refused `ProvinceNotFound` (ADR 014). Replaces *galaxy view*.
- **New land** — a second fief founded elsewhere. Replaces *colony*. Not in this phase (W4).

## Resources

- **Resource** — one of wood, stone, iron, gold, food. Each has an amount, a rate per hour and a capacity on a fief.
- **Wood / Stone / Iron** — the building materials, produced by the sawmill, the quarry and the iron mine. Replace *metal / crystal / deuterium*.
- **Gold** — the scarce currency for upkeep and trade, accruing from the fief's tolls and tithes at its base rate; no building produces it. Replaces the premium resource but is earned in play.
- **Food** — a stored resource like the others, produced by farms and spent on building costs. It is not eaten down over time in this phase.
- **Peasants** — the workforce. The fief supplies a base number and each farm level adds more; each building level occupies some. Free peasants = supplied − occupied, a derived number that never grows on its own. An upgrade charges only the increase in occupancy against the free peasants, releasing the current level's occupancy. Replaces *energy*.
- **Warehouse** — the building that sets a resource's capacity.
- **Base rate** — the rate per hour every fief earns of each resource from founding, with no building; a producer's rate and the terrain bonus add on top of it.
- **Accrual** — the amount a resource holds at a later instant, computed on read segment by segment: the span since the stored instant is split at every season boundary it crosses, and each segment accrues at the rates in force at its start as `max(amount, min(capacity, amount + rate × elapsed))`, floored on its own. A stock under the capacity fills up to it, a stock above it (after a refund) freezes, neither accruing nor clamped (ADR 005, ADR 016).

## Buildings

- **Building** — a structure on a fief with a level; each level has a cost, a build duration and an effect.
- **Sawmill / Quarry / Iron mine / Farm** — the producers.
- **Library** — the building where arts are studied, one at a time in its study slot. Its built level, never the projected one, gates which art levels can be studied and shortens every study. Replaces *research lab*.
- **Barracks** — where units are trained. Replaces *shipyard*. Not in this phase (W1).
- **Build slot** — the single place on a fief where the upgrade in progress builds; one upgrade at a time. A slot with an upgrade in progress is **busy**.
- **Build queue** — the ordered upgrades waiting behind the busy slot, at most the content cap. Each entry keeps the building, the target level, the cost it debited and the duration fixed at its enqueue, and starts the instant the one before it finishes.
- **Enqueue** — the single atomic mutation that debits resources and either starts an upgrade in the idle slot or appends it to the build queue. The target level and the peasants are judged on the fief as it will stand once the slot and the queue finish. Staffs the upgrade by the delta: it releases the current level's occupancy and charges only the increase against the free peasants, so a level-2 upgrade of a building already at level 1 needs `occupancy(2) − occupancy(1)` free peasants, not `occupancy(2)`. Refused with a named reason when the build queue is full, resources are short or free peasants are too few.
- **Resolve** — applying the finished upgrades and the finished study to the fief, on read, in the order they finished: each stretch accrues to the next finish at the rates in force, set by the building and art levels before it, then that finish applies. A finished upgrade raises its building and the next waiting upgrade starts at that instant; a finished study raises its art and leaves the study slot idle. An upgrade and a study that finish at one instant both apply there, the upgrade first. A build queue left behind an idle build slot, which only a cancel stored before #92 left, restarts at the stored instant, the cancel instant. Every waiting upgrade that no longer fits the fief as projected (a level whose lower level was cancelled, too few free peasants) is dropped first, with a full refund.
- **Cancel** — the single atomic mutation that removes one entry, named by its building and target level, which no other entry of the slot or the queue shares: the upgrade in the busy slot or a waiting entry of the build queue. It refunds 100 % of the cost the entry stored at the enqueue, added to the stocks at the cancel instant even above the capacity, where they freeze. Cancelling the upgrade in the slot starts the next waiting entry at the cancel instant, or leaves the slot idle; cancelling a waiting entry closes the gap, so the entries after it keep their order and finish earlier. Then it cancels in **cascade**: the remaining entries are walked in order on the projection, and every one that no longer fits (its target level is not the projected level plus one, or the projected free peasants cannot staff its increase) is cancelled too, with its own full refund. Every finished upgrade is resolved first; an entry that has finished by then, or that the slot and the queue no longer hold, is refused, never swapped for a neighbour. It touches no peasant count, since occupancy derives from built levels. Cancelling the **study** in the study slot, named by its art and target level, refunds 100 % of the cost the study stored at its start the same way, even above the capacity; there is no cascade, since the study slot has no queue, and the build slot and the build queue stay untouched. A study that has finished by then is applied first and refused, never cancelled.

## Knowledge and arms

- **Art** — craft knowledge a fief holds at a level; each level multiplies one resource rate by the content's percent, on top of base, producers and terrain. It occupies no peasants. Replaces *technology*.
- **Smithing** — the art that raises the iron rate.
- **Masonry** — the art that raises the stone rate.
- **Study** — the timed act that raises an art one level, paid in materials and gold at its start; the library's built level gates it and shortens it. Cancelled with a full refund, like an upgrade, until it finishes.
- **Study slot** — the library's single place for the study in progress; one study at a time, no queue. A slot with a study in progress is **busy**.
- **Unit** — infantry, archers, cavalry, rams. Replace *ships*. Not in this phase (W1).
- **Army** — units on a march. Replaces *fleet*. Not in this phase (W1).
- **March** — an army's movement between coordinates, with a duration. Replaces *mission*. Not in this phase (W1).
- **Scout** — the unit that reveals another fief. Replaces *espionage probe*. Not in this phase (W1).

## The chronicle

- **Chronicle** — a fief's record of its latest 100 events, written in the same act that applies them, the resolve or the cancel; the domain never reads it (ADR 013).
- **Event** — one happening of one of four kinds: an upgrade finished, an art learned, an upgrade cancelled, a study cancelled. It names its building or art and its level, the refund for a cancel, and is stamped with the instant it happened: the finish for a finish, the cancel instant for a cancel, never the instant of the read that wrote it. Every upgrade a cascade cancels is an event of its own, with its own refund; an upgrade the resolve drops from a restarted build queue is refunded without one.

## The account

- **Verified email** — a player's email once proven to receive mail, by following the verify link sent to it. It gates only a password reset, never sign-in or play; until then the signed-in shell shows a banner that resends the link (ADR 015).
- **Account token** — a single-use link token of kind `verify` or `reset`, mailed to a player and stored as a digest, never in clear. A verify token lives 24 hours, a reset token 1 hour; issuing one retires the player's earlier token of that kind, and one unknown, expired, used or of the other kind is refused as `TokenInvalid` (ADR 015).

## Society

- **House** — a group of players under one banner. Replaces *alliance*. Not in this phase (W2).

## Time

- **Instant** — a point in time from the `Clock` port; the domain never reads the wall clock.
- **Duration** — a length of time in seconds; build times, study times and marches are durations. A build or study duration is fixed once, at the enqueue or the study start, from the content's seconds and the percents in force at that instant, the season's for both and the built library's for a study, rounded up to whole seconds in one step; it never changes while the work waits or runs (ADR 011, ADR 012, ADR 017).
- **Season** — one of spring, summer, autumn, winter, in force over the whole world at once for a fixed number of days set by the content's calendar, from its start, included, to the instant it ends, excluded. Each season scales every resource's rate by a whole percent from content, applied last (winter lowers food, spring raises it, autumn raises gold), and scales build and study durations by a build and a study percent from content, fixed at the enqueue or the study start (summer shortens building, winter shortens study); there is no season before the calendar's epoch (ADR 016, ADR 017).
- **Year** — four seasons, counted from the first spring at the calendar's epoch: *año 1* is the first. There is no named calendar and no era (ADR 016).

## Avoided words

`planet`, `colony`, `galaxy` (say kingdom), `galaxy view` (say kingdom map), `metal`, `crystal`, `deuterium`, `energy`, `fleet`, `ship`, `mission`, `alliance`, `tech`, `technology`, `research` (say study), `mine` alone (say which one), `tick` (there is no tick), `population` (peasants are derived, never grown), `log`, `history`, `feed` (say chronicle), `confirmed email` (say verified email), `recovery` (say reset).
