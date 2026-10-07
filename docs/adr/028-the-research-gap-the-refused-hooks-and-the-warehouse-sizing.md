---
status: accepted
date: 2026-10-07
---
# The research gap, the refused hooks and the warehouse sizing

## Context

S22 (ADR 027) rebuilt the signed-in screens on the research note
`docs/research/engaging-strategy-ui.md` (commit 8819fc1) and S23 (#497)
closed its review gaps. A read-only gap analysis on 2026-10-07 crossed
every concrete recommendation of the note, its Open questions, its
OGame table and its Hooks to avoid against ADR 027, the shipped
`apps/web` code, the PRD and the lore, and found seven gaps and two
recommendations to refuse (#521). Three were accessibility gaps under
N8: no `aria-live` region anywhere, so a finish was told only by the
opt-in browser notice (WCAG 4.1.3); the short mark on a cost line was
`text-rust` alone (1.4.1); and reflow at 320 px was never verified,
only 390 px (1.4.10). Two were Fitts gaps under the note's sixth
principle: the refund was stated only after a cancel, and the map's
march form rendered after the whole plot grid, up to eight rows below
the tapped plot on a phone. Two were missing rules: the hooks the note
refuses lived only in ADR 027's Considered options, and warehouse
capacity had no recorded sizing although the note's eleventh principle
and its Open questions name the capacity cap as the one Playing by
Appointment pressure the game keeps. The owner delegated every decision
of the slice to the orchestrator (`/goal` on 2026-10-07: "cierra ese
gap, si necesitas grillas o decisiones, toma la recomendada"), who
grilled them and recorded seven decisions and two rejections on #521,
then four more on the points the tickets raised. This ADR records what
S25 shipped: the lore of #522 (PR #528), the design of #523 (fief
mockup v31, Design System v26 unchanged), the fief screen of #524 (PR
#529), the map of #525 (PR #530) and the widths of #526 (PR #531); it
states the reading of the sizing rule and measures the content against
it, and changes no content.

## Decision

- **A finish is announced to assistive technology from the re-read,
  never from the countdown** (#521, Decision 1; #524, PR #529).
  `LiveRegion` is a visually hidden `aria-live="polite"` div the fief
  layout `apps/web/src/routes/_signedIn/feudo.$fiefId.tsx` renders from
  the mount, empty. `useFinishAnnouncement` runs on the same `GET`
  re-reads as *Avisarme*'s `notifyBetween`, never behind its early
  return, and writes the bodies `finishNoticesOf` answers for that
  re-read, *Obra terminada: aserradero, nivel 3.*, letter for letter the
  roll's line, without the fief's name; the next re-read with no finish
  empties it, and an `adopt` and the first read of a mount say nothing.
  The source is the re-read, as ADR 027 rules for the notices: nothing
  is announced when the client-side countdown reaches zero. The region
  carries no `role`.
- **A short cost line carries a hidden word, and every cost line a
  hidden name** (#521, Decision 2 and the follow-up's Decision 2; #522,
  PR #528; #524, PR #529). After its figure each `CostList` line holds
  a visually hidden resource name, *500 de madera*, *1 campesino*, so a
  screen reader never hears an amount alone, and while the line is
  short a visually hidden *, falta*, the lore's one invariable noun.
  `CardCost` carries `spokenName` and `shortMark` in place of
  `isShort`; the rust colour follows `shortMark` and the icon is
  unchanged. The chronicle's rows name their amounts the same way. The
  reason beside the button still repeats the resource.
- **The refund is stated beside every cancel control, before the
  cancel** (#521, Decision 3 and the follow-up's Decision 1; #522, PR
  #528; #524, PR #529). `CancelRow` holds the refund line in `caption`
  `ink-muted` and then the quiet button, in a `flex-wrap` row after a
  `line` hairline, right-aligned; the line is reading order, not part
  of the button's accessible name, and the button keeps `Button`'s 44 px
  size, which the mockup's small size draws too. An upgrade, in the slot
  and in every waiting row, states the rule in words with no figures,
  *Si la cancelas, recuperas todo lo que costó, y lo mismo por cada obra
  en espera que caiga con ella.*, because `BusySlotSchema` and
  `WaitingUpgradeSchema` carry no stored cost and S25 changes no api; a
  study carries its figures from the art card's `nextLevel.cost`; a
  levy carries the undelivered count and `recruitTerms[unit].cost`
  times the units not yet delivered at the live clock, *Si la cancelas,
  recuperas lo de 8 infantes de vuelta al campo: 160 de madera, 80 de
  hierro y 240 de comida.* Figures come from data the card already
  holds, never a new api read.
- **The march form opens right after the row of the tapped plot, at
  every width** (#521, Decision 4; #523; #525, PR #530). The panel is
  an `li` of the plots' list spanning every column (`col-span-full`),
  placed right after the last tile of the row that holds the tapped
  plot: `panelPlaceOf(position, columns, plotCount)` is the pure rule
  and `useMapColumns` reads the column count from `breakpoints.lg`, 2
  below and 5 from it, so one rule lands right at both counts. Measured
  with Playwright at 390 and 1280 px for plots 3 and 15, the panel's top
  is below the tapped tile's bottom and above every later row. The
  expanded action alone carries `aria-controls` naming the panel's id,
  beside the `aria-expanded` it kept; opening a form moves focus to its
  `h4` title (`tabIndex={-1}`, no new Tab stop), closing it from the
  same action leaves focus on the action, and a send moves it to the
  province `h3` as ADR 027 rules. A refusal reads inside the panel.
  After a send `useMapMarch` keeps the sent plot, so `MarchSent` sits in
  the same slot until the next toggle or province change. Inside the
  panel the form's fields and preview take the panel's width; the
  form's image and `MarchSent` keep `max-w-form`, 640 px.
- **The three signed-in screens reflow at 320 px, and the strip holds
  five busy cells at 768 px** (#521, Decision 5; #523; #526, PR #531).
  Measured first in headless Chromium against a fief with five busy
  strip cells, blocked cards with *lista*, the goal card, the map with
  a form open and the chronicle, then fixed only what a measurement
  proved: `scrollWidth` reads 320 on the three screens, nothing but an
  `sr-only` span overflows its box, and every target is at least 44 px.
  The bar keeps three columns and `numeral-lg` at 320 px, the shape
  #523 measured (`57 650`, warehouse level 10's capacity, is 56 px in a
  79 px cell); the one overflow, the *Campesinos* label, came from the
  peasants cell's left rule and inset, which now apply from `md` alone.
  The strip's time pieces travel as data: `formatFinishPieces` answers
  the time left and, more than an hour away, the clock, `formatFinish`
  joins them with ` · ` for every other screen, and `BusyLine` draws
  each piece as its own `inline-block`, so a narrow cell breaks the
  line between them and a clock wraps inside its own box. The plot
  tile's label is `whitespace-nowrap` and its terrain wraps under it,
  and *Campamento de bandidos* breaks as *Campa-mento* under
  `hyphens-auto` on the `lang="es"` document. The header's address link
  takes a 44 px box through negative margins, so nothing around it
  moves. No new breakpoint, no token change: breakpoints stay
  Tailwind's defaults and the Design System stays at v26.
- **The refused hooks are a product rule** (#521, Decision 6). Streaks
  and consecutive-day bonuses, daily quests, appointment rewards,
  click-to-collect and season-only rewards are the Won't-have row W10
  of the PRD, with the note's Hooks to avoid as the reason: each raises
  return rates by becoming the game's goal instead of the player's, and
  a player away for a week comes back to more, never to a broken
  streak. The game refuses them on purpose, as ADR 027's Considered
  options already said of daily quests and streaks.
- **A store fills from empty in no less than 12 h at the highest rate
  reachable with the warehouse at that level** (#521, Decision 7 and
  the follow-up's Decision 3). *The highest rate reachable with the
  warehouse at that level* is read as the base rate plus the rate of
  the resource's producing building at the same level as the
  warehouse, in the neutral season, with no terrain bonus and no art: a
  player who upgrades in step. Of the factors `deriveResourceRates`
  reads, the building level is counted, the art levels, the terrain
  bonus and the season multiplier are not: the arts raise a rate by at
  most half, the terrain by 2 to 5 units an hour and the season by a
  quarter, so they are measured once below, at the tightest row,
  instead of in every cell. No content gates a producer's level on the
  warehouse's; but accrual never brings a store past its capacity, so a
  producer level whose cost exceeds the capacity is never reached by
  waiting, and a player who lets a producer outrun the warehouse chose
  the faster fill. Gold has no producer, so its rate is the base rate
  alone. The capacity is `deriveWarehouseCapacity(level, catalog)`,
  `startingCapacity` at level 0 and the level's `capacity` after; the
  rate is `deriveResourceRates` over every producer at the warehouse's
  level, both arts at 0, in summer, the terrain's bonus taken out; the
  hours are the capacity over the rate. The content as shipped
  (`apps/api/content/fief.json`, `warehouse.json`, `sawmill.json`,
  `quarry.json`, `iron-mine.json`, `farm.json`) measures:

  | Warehouse | Capacity | Wood / h | Stone / h | Iron / h | Gold / h | Food / h | Wood | Stone | Iron | Gold | Food |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | 0 | 1 000 | 10 | 10 | 5 | 2 | 10 | 100 h | 100 h | 200 h | 500 h | 100 h |
  | 1 | 1 500 | 40 | 30 | 15 | 2 | 35 | 37.5 h | 50 h | 100 h | 750 h | 42.9 h |
  | 2 | 2 250 | 76 | 54 | 27 | 2 | 65 | 29.6 h | 41.7 h | 83.3 h | 1 125 h | 34.6 h |
  | 3 | 3 400 | 119 | 83 | 41 | 2 | 101 | 28.6 h | 41 h | 82.9 h | 1 700 h | 33.7 h |
  | 4 | 5 050 | 170 | 116 | 58 | 2 | 143 | 29.7 h | 43.5 h | 87.1 h | 2 525 h | 35.3 h |
  | 5 | 7 600 | 230 | 156 | 78 | 2 | 193 | 33 h | 48.7 h | 97.4 h | 3 800 h | 39.4 h |
  | 6 | 11 400 | 300 | 203 | 102 | 2 | 252 | 38 h | 56.2 h | 111.8 h | 5 700 h | 45.2 h |
  | 7 | 17 100 | 382 | 258 | 129 | 2 | 320 | 44.8 h | 66.3 h | 132.6 h | 8 550 h | 53.4 h |
  | 8 | 25 650 | 478 | 322 | 161 | 2 | 400 | 53.7 h | 79.7 h | 159.3 h | 12 825 h | 64.1 h |
  | 9 | 38 450 | 589 | 396 | 198 | 2 | 492 | 65.3 h | 97.1 h | 194.2 h | 19 225 h | 78.2 h |
  | 10 | 57 650 | 717 | 482 | 241 | 2 | 599 | 80.4 h | 119.6 h | 239.2 h | 28 825 h | 96.2 h |

  Every row clears 12 h. The tightest is wood at warehouse level 3,
  28.6 h, where the sawmill's curve outruns the warehouse's by the
  most; from level 4 on the capacity grows faster than every rate, so
  the hours rise with the level. Under the broadest reading at that
  level, the terrain bonus, both arts at level 10 and the season that
  raises the resource, the tightest cell is food on lowlands in spring,
  132.5 / h, 25.7 h; wood stays at 28.6 h since no terrain and no art
  raises it. The rule holds with more than twice the margin at every
  level, so no content ticket follows. A new fief, with 500 wood and
  stone, 200 iron, 50 gold and 300 food in a capacity of 1 000, fills
  wood and stone at the base rate in 50 h, food in 70 h, iron in 160 h
  and gold in 475 h.
- **Design first, lore first** (#521, wave 1; #522, PR #528; #523). The
  map panel after the tapped row at 390 and 1280 px, the cancel row
  with its refund line, the short-cost card with what a screen reader
  hears and the three screens at 320 px were drawn on the fief mockup
  at version 31 (the platform's own counter reads 32, drifted by one
  since #466 and #505), Parchment and Ledger, and the Design System
  stayed at version 26 because no token changed. Every Spanish line,
  the hidden names, *falta*, the three refund lines and the announced
  finish (the *Avisarme* table's lines, body alone), is a proposal for
  the author under *The short word, the refund line and the
  announcement* in `docs/lore/names.md`, mirrored in
  `apps/web/src/copy.ts` until accepted (ADR 010); the four form titles
  serve as the panel's heading, which `MarchForm` already rendered as
  the heading its form is labelled by.

## Considered options

- **Progress of each short resource toward an unaffordable cost**, the
  note's ninth principle, moderate evidence. Rejected on #521: the
  reason line already says what is short, *Te faltan 30 de hierro.*
  (`copy.fief.tooExpensive`), and *lista 22:02* names the minute the
  resources arrive (ADR 027), so a bar per cost line adds a second
  progress semantics beside the capacity track for no new information.
  #521 quoted the reason as *Necesitas N y tienes M*; that is the
  peasants' line, *Necesitas 3 campesinos libres y tienes 2.*, and the
  march form's, *Necesitas 11 jinetes en casa y tienes 10.*, not the
  resource reason the rejection rests on.
- **Mid-goal framing, the done distance first and the remaining
  distance in the second half**, the note's ninth principle after
  Bonezzi, Brendl and De Angelis 2011, moderate evidence from consumer
  loyalty. Rejected on #521: a countdown that flips what it counts
  half-way through is a second time format, against ADR 027's one
  reading of every finish.
- **The note's other Open questions**: early churn, the SDT levers,
  player motivation profiles and relatedness without social features.
  They stay open with the note's own reasons: with one player nothing
  can be measured, and W1 and W2 hold. The two the note asked an ADR
  for are answered: live counters under WCAG 2.2.2 by ADR 027, capacity
  sizing here.
- **`grid-auto-flow: row dense` on the plots' list**, as #523 drew it,
  so the tiles after the panel backfill its row. Rejected by the
  orchestrator on #525: the DOM order and the drawn order stay the
  same, so the tab order is tile, panel, next tile with no reordering
  the eye cannot follow; the panel sits after the last tile of its row
  instead.
- **Two columns on the bar at 320 px, or the numeral one step down**,
  #521's recommended default and its fallback `repeat(auto-fit,
  minmax(96px, 1fr))`. Rejected by #523's measurement and confirmed by
  #526's: no value the content can show overflows a 79 px cell in
  `numeral-lg`, and the one overflow was the peasants cell's rule and
  inset, not the numeral. The fallback would have cost a size token
  and Design System v27.
- **Figures on the upgrade's refund line.** Rejected by the follow-up's
  Decision 1: the wire carries no stored cost for the busy slot or a
  waiting upgrade, and adding it is an api change outside S25; the
  line states the rule in words.
- **A smaller cancel button.** Not added: the mockup's small size draws
  the same 44 px quiet button, and a smaller target would fall under
  the floor every other control keeps.
- **A `role="status"` on the live region.** Not set: `aria-live=
  "polite"` alone carries the announcement, and the role collides with
  `MarchSent` and `NoticeBanner`, which the route tests query by it.
- **Counting the arts, the terrain and the season in the sizing
  table.** Rejected by the follow-up's Decision 3: the rule measures a
  player who upgrades in step, and the three factors raise a rate by a
  bounded share, so one measurement at the tightest row says whether
  they change the verdict. They do not.
- **Fixing a content row inside this ticket.** Refused by #521: the
  ADR measures and reports, and a row under 12 h is a content ticket
  the orchestrator files. None was needed.

## Consequences

- PRD: the Won't-have row W10 is added, citing the research note's
  Hooks to avoid and this ADR. No other row changes: the slice binds
  N8 and keeps W7.
- ADR 027 is amended in three lines: the *Avisarme* decision and the
  Considered option on a notification before the re-read each name the
  live region of #524, and the Considered option on daily quests and
  streaks points to W10. Its Known gap on the strip at 768 px was
  closed by #526 in PR #531.
- `apps/web/CLAUDE.md` names the `aria-live="polite"` region under the
  notices and the panel's `aria-controls` under the map.
- `CONTEXT.md` is unchanged: the live region, the hidden word, the
  refund line and the panel are screen vocabulary, not domain terms.
- The api is unchanged: no wire shape, no use case, no content. The
  announcement, the refund figures and the panel are display over data
  the read already carries (N1).
- No test enforces the sizing rule: the table above is measured by
  hand through `deriveWarehouseCapacity` and `deriveResourceRates`, so
  a content ticket that changes a capacity, a base rate or a producer's
  rate re-measures it here.
- Known gap (the review of PR #529): when two consecutive re-reads
  announce the same text, the region's content does not change, so a
  screen reader may not announce the second finish. A fix would key the
  text by the finish instant or clear the region between re-reads.
- Known gap (the review of PR #530): at 1280 px the capped march art,
  640 × 480, still sits between the tapped tile and the controls, so
  the submit button of an attack or a transport form lands about 850
  px below the tile; the focused title scrolls the controls into view.
  A shorter art ratio on wide screens would bring them closer.
- Known gap (the re-check of PR #531): the ` · ` glyph is written twice,
  as the join in `formatFinish.ts` and as the piece prefix in
  `SlotsStrip`'s `BusyLine`; the pieces could carry their own.
- Known gap: between a levy's `endsAt` and the re-read that fires at
  that instant the busy slot and its cancel stay drawn, as on trunk,
  and the refund line would read 0 units for that moment.
- Known gap: a fief name has no maximum length on the wire (#506), so a
  single long word in the cargo cell's origin can still widen a strip
  cell; measured with *Sotoverde del Páramo* only.
- Known gap, carried from ADR 027 and outside the research note: focus
  still drops to `body` after `/forgot-password` and `/reset-password`
  replace their form, and after the map's `disabled` previous and next.
- Out of scope of #521, each a future ADR or an amendment of this one:
  a stored cost on the busy slot and the waiting upgrades, a shorter
  art on wide screens, any change to a capacity or a rate, and the
  note's open questions above.
