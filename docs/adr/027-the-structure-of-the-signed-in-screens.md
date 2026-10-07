---
status: accepted
date: 2026-10-06
---
# The structure of the signed-in screens

## Context

Until S22 the fief screen alone held the resource bar, the map and the
chronicle showed no amount and no slot, every countdown and every amount
repainted once a second, a blocked action was a `disabled` button whose
reason a screen reader never reached, nothing told a returning player
what had happened while away, and nothing named what to build next.
`docs/research/engaging-strategy-ui.md` (2026-10-06) ranked the
evidence: keep the system's status always visible, meet WCAG 2.2 AA,
give a specific near-term goal with feedback, teach in context and skip
the tutorial, design the return visit, respect the player's time; and it
named the hooks to refuse, streaks, appointments and penalties for
absence. It also set the one accessibility decision the redesign could
not skip: SC 2.2.2 Pause, Stop, Hide applies to every ticking countdown
and resource counter, so the slice had to repaint once a minute, add a
pause control, or argue that the ticking is essential. The obvious
designs pull in what the PRD rules out: a server that pushes a finish
to the browser or mails a reminder (W7, N2); a stored snapshot of each
fief's stocks at the last visit, so a digest can say what was gained;
a browser that computes what the server did not answer (N1); a
threshold, a goal list or a hint order written in code (N5); a modal or
a tutorial. The owner grilled and confirmed sixteen decisions on
2026-10-06 (#463), answered the open question on the fill instant the
same day, and approved the design at fief mockup v30 and Design System
v25 (#466). This ADR records what S22 shipped: PRs #479 to #491 for
#464, #465 and #467 to #476 and #478, the lore proposals of #464 (PR
#480) and the design of #466. Where the code stands over #463's text it
records the code: the fill instant is stored per resource, a levy shows
no seconds, the goal's dismissal travels with the fief read, *lista*
rounds up to the next whole minute, the two bar hints sit under the
status block and not inside the bar, and a digest read costs 2N + 4
round trips. The slice is structure only; the visual look is a later
slice (Decision 1).

## Decision

- **One live read per fief, shared by every signed-in fief screen**
  (Decision 2; #469, PR #483). The fief layout
  `apps/web/src/routes/_signedIn/feudo.$fiefId.tsx`, keyed by the fief
  id, runs the one `useLiveFief` and shares its handle through
  `LiveFiefContext`; the fief screen, the bar, the strip and the map's
  forms read it through `useLayoutFief`, so a dispatch answered from the
  map shows in the bar. Above the `Outlet` of `/feudo/$fiefId`,
  `/feudo/$fiefId/mapa` and `/feudo/$fiefId/cronica` the layout renders
  `FiefStatus`: the `ResourceBar`, moved out of `FiefScreen`, a 3x2 grid
  at 390 px of the five resources and the peasants, and the new
  `SlotsStrip`. The block is `sticky` from the `md` breakpoint and
  scrolls away below it (Decision 4).
- **The strip shows a slot only once it can be used** (Decision 3 and
  the Defaults of #463). `slotsStripCellsOf` builds the cells: build
  always, with *Obras en espera:*, the count and the countdown to the
  last waiting finish; study from library level 1; recruit and march
  from barracks level 1; the cargo only while one is on its way. An idle
  cell reads *Sin obra*, *Sin estudio*, *Sin leva* or *Sin marcha*; a
  busy one its heading, what it holds, ` · ` and the countdown, with a
  track. Each cell is a link to `/feudo/$fiefId` with the hash of its
  section (`sectionAnchors`), and the sections carry two scroll-margin
  tokens, `scroll-mt-status` at 448 px and `scroll-mt-status-wide` at
  376 px, sized over the tallest busy block, so a section reached by its
  hash lands under the block and never behind it. The sections keep the
  detail and the actions: the cancel, the waiting queue, the recall.
  The design system names no route: the strip takes `to` and `params`.
- **Live values repaint at most once a minute, seconds only in a
  countdown's last minute, one repaint at each levy delivery and march
  arrival or departure** (Decision 5; #471, PR #484). `useLiveFief` holds no
  `setInterval` at one second: `repaintDelayMsOf` schedules the next
  repaint at the lesser of one minute, the delay to the nearest
  countdown's last minute, and the next discrete change of state. The
  countdowns it reads are the build slot's, each waiting upgrade's, the
  study's, the levy's end, the march's displayed countdown, the
  incoming cargo's and the season's: inside the last minute of any of
  them it repaints every second, so the season line ticks its last
  minute as a slot does, though no player set the season running. The
  discrete changes are a levy's next delivery and a march's arrival and
  departure: each is one repaint when it happens, 45 s apart for a levy
  of infantry at barracks 1, never a second-by-second tick.
  `liveFiefAt` interpolates the amounts by whole minutes, so an amount
  never moves between two minute repaints even while a slot ticks its
  seconds. The clock lives in the fief layout, so the map and the
  chronicle repaint at the same cadence. The re-read schedule is
  unchanged: `rereadIntervalMs` is 60 s, the ceiling M8 put on polling.
  The season countdown under a day reads `formatTimeLeft`, whole
  minutes and seconds only in its last minute.
- **Why that satisfies SC 2.2.2.** The criterion asks that information
  which updates on its own, beside other content, can be paused,
  stopped, hidden or slowed, unless the updating is essential to the
  activity. Its purpose, in the Understanding document, is that content
  which keeps changing does not distract a reader and can be read in
  full before it changes. The bar's amounts and every countdown outside
  its last minute hold still for a whole minute and are read in full
  many times over between two changes, and nothing on screen ticks in
  the meantime; that is the "control the frequency" the criterion
  offers, taken once for every player in place of a control each would
  have to find. The seconds of a
  countdown's last minute are the one ticking the slice keeps, for the
  activity where they are essential: the player who waits for a finish
  is watching that finish, the ticking is bounded at 60 s and ends when
  the finish applies. That holds for a slot the player set running and
  for the season's end, which the player did not start but waits for
  the same way, since it turns every rate and duration on the fief. A
  levy's delivery and a march's arrival or departure are not ticking:
  each is a discrete change of state painted once when it happens, as a
  re-read's answer is, and between two of them nothing ticks.
  Two gaps are accepted and recorded here. The minute repaint is
  aligned to the read instant, not to each countdown's own minute
  boundary, so a line such as *14 min* can be up to 59 s stale. And the
  seconds of a last minute update for up to 60 s with no control, by
  the exception above.
- **Every finish reads relative, and with the local clock when more than
  an hour away** (Decision 6; #464, #471). `formatFinish` in
  `apps/web/src/time/` is the one reading: *0:42* in the last minute,
  the whole minutes under an hour (*14 min*), `formatDuration` from an
  hour on, and past an hour ` · ` plus `formatClock`, *16:04* today,
  *mañana 04:10*, *8 oct 08:10*, in the browser's zone, converted from
  the server's instant: `LiveFief.at` is the instant the live values
  are derived at, so the clock end is the server's finish. The build
  cell and the waiting-queue title read when the queue empties. The
  design system takes the formatted text and never formats a finish;
  durations on forms and card actions keep `formatDuration`.
- **A levy shows no seconds** (the owner's decision on #471,
  2026-10-06). The recruit card drops the countdown to the next unit:
  it reads the units delivered on its order line, *Leva en marcha: 5 de
  12 infantes*, repainted once at each delivery, and *Leva completa en*
  the order's end through `formatFinish`, with seconds only in the
  order's own last minute. The strip's recruit cell read the order's end
  alone already.
- **A store's fill instant is answered, shown within 8 h, and stored
  once reached** (Decision 7, the owner's answer on full since; #465,
  #467, PRs #479 and #481). `deriveFullAt(fief, catalog)` in
  `packages/domain/src/fief/deriveFullAt.ts` answers per resource the
  instant the stock reaches the warehouse capacity from the fief as
  stored, walking the season segments `materializeStocks` walks and
  flooring at each boundary: the crossing instant inside its segment,
  `null` for a rate of 0 in every season, and for a store already at or
  above the capacity the stored `fullSince`, or `storedAt` when none is
  stored, as for a store full since before migration 0028. The overview
  answers it as
  `resources.<kind>.fullAt`. A cell whose `fullAt` falls within 8 h of
  `readAt` reads *lleno 19:00*, or *lleno mañana 03:00*, in place of its
  rate, the 8 h a web constant in `FiefStatus`; a full store reads
  *lleno* in rust, as shipped before. `Fief.fullSince` (`FullSince`, an
  instant or `null` per resource) is stored in the five nullable
  `fiefs.full_since_<resource>` columns of migration 0028, and
  `rebaseFullSince(before, after, catalog)` runs at every re-base, each
  step of the resolve walk, `Fief.accruedTo` and the seven mutating use
  cases before their save: a store at or above the capacity after the
  re-base keeps `deriveFullAt` of the fief before it, the stored instant
  or the crossing, capped at the re-base instant, so a refund, a loot or
  a cargo that pushes a store over answers its own instant; a store
  below the capacity clears to `null`. A read that applies a finished
  upgrade therefore keeps the real instant a store filled before it,
  which the state before #467 could not say. ADR 005's stored tuple is
  now `(amount, at, ratePerHour, capacity, fullSince)`
  (`.claude/rules/architecture.md`) and is amended here.
- **One action component on every card and form** (Decision 8; #472,
  PR #487). `CardAction` is the action of the building, art and unit
  cards (`type` `button`) and of the four march forms (`submit`);
  `SubmitAction` is gone. A blocked, waiting or max-level button is
  never `disabled`: `Button`'s `availability`, `blocked` or `waiting`,
  sets `aria-disabled="true"`, keeps the button in the tab order and
  swallows its click, so Enter, Space and a form submit through it send
  nothing; waiting adds `aria-busy`. The blocked look is a dashed
  `line-strong` border on `surface-sunken` with `ink-muted` text, the
  Design System v25 pair, the border at 3:1 and the text at 4.7:1 on
  Parchment and 7.6:1 on Ledger, so a blocked button is never told
  apart by colour alone.
  The reason reads beside the button and is its accessible description
  (`aria-describedby`); the accessible name stays the label.
- ***lista* names the minute the resources arrive, and nothing else**
  (Decision 8 and the Defaults of #463). `readyLineOf` adds *lista
  22:02*, *lista mañana 01:47* or *lista en 24 min* to a building, art
  or recruit card whose every reason left is a short resource with a
  rate above 0 and a cost within the capacity. For each short resource
  it takes the earliest whole minute after `readAt` at which
  `amountAfter`, the minute accrual `liveFiefAt` uses, floors to the
  cost, one minute later when the floor falls short; the instant is the
  latest of those across the short resources, and its clock reading is
  rounded up to the next whole minute when the read carries seconds, so
  *lista* never names a minute before the button unlocks. A full queue, short peasants, a
  level, a lock or a cost above the capacity show no *lista*, and a
  march form never does: `MarchActionState` has no `ready`. It is
  display interpolation from the read's rates (M8); the server refuses
  (N1).
- **The digest is what happened since the last *Entendido*, and the
  acknowledgement is written by a POST alone** (Decision 9; #467, #470,
  #473, #478, PRs #481, #482, #486 and #488). `players
  .digest_acknowledged_at` is `NOT NULL`, one instant per player:
  migration 0028 adds it nullable, sets `now()` on every row and then
  `NOT NULL`, a hand-written data step as 0019's, and
  `DrizzleAccounts.addPlayer` writes the sign-up instant for a new
  player. `POST /digest/acknowledgement` stores the clock's instant
  through the api-side port `DigestAcknowledgements`
  (`apps/api/src/digest/`) and answers 204; no GET writes it, which a
  test asserts. `GET /digest` (`apps/api/src/routes/digest.ts`) answers
  the `DigestSchema` of `packages/contracts`, a strict `{
  acknowledgedAt, isDue, fiefs }`, each fief `{ id, name, events,
  stores }`: the chronicle events whose `occurredAt` is after the
  acknowledgement, in the chronicle's order, and the stores at or above
  the capacity at the read whose `deriveFullAt` instant over the
  resolved fief is after it, each with its `fullSince`, so a store
  already full at the acknowledgement is not news, since the bar shows
  it. It spans every fief of the lord through `currentFiefsOfPlayer`,
  shared with `GET /fiefs`, so a fief founded by the resolve is
  included. `isDue` is true when some fief answers an event or a store
  and the acknowledgement is at least `digest.absenceSeconds` before
  the read, 3600 in `apps/api/content/fief.json`, validated by
  `FiefContentSchema`, served by `JsonBuildingCatalog.digestTerms()` and
  never read by the domain (N5). The digest is a read adapter,
  `apps/api/src/digest/digestOf.ts`: the domain never reads the
  chronicle (ADR 013, `CONTEXT.md`), and no use case exists for it. It
  holds no resource snapshot: what a fief gained is what the bar shows.
  With nothing to resolve one read of N fiefs is 2N + 4 round trips, the
  session renewal, the acknowledgement, two `fiefsOf` and one fief read
  and one chronicle read per fief, 8 for two fiefs, asserted in
  `routes/digest.test.ts`; a finish to apply adds its resolve
  transaction, as any read does. The chronicle keeps 100 events per
  fief, so a long absence answers the latest 100.
- **The digest is a card on the fief screen, read once per visit**
  (#473). `useDigest` reads `GET /digest` once on mount, never on a
  timer nor on a repaint, and `FiefScreen` shows the design-system
  `DigestCard` while `isDue`: one heading per fief with news, by name, a
  fief with nothing left out, its events as the chronicle draws them
  through `chronicleRowOf`, amounts included, and one *Almacén lleno:*
  row per filled store at its `fullSince`, newest first. *Entendido*
  posts the acknowledgement once and hides the card; a refusal keeps it
  with its line. A fief switch remounts the route, so the next read
  answers not due. Never a modal.
- **The next goal is content, evaluated by the server, dismissed on the
  fief** (Decision 11 and the Defaults of #463; #468, PR #485; the
  owner's decision on #468). `goals` in `apps/api/content/fief.json` is
  the ordered list, each `{ building, level }`, nine as shipped: sawmill
  1, farm 1, quarry 1, warehouse 1, iron mine 1, sawmill 2, farm 2,
  library 1, barracks 1; `FiefContentSchema` validates it and
  `BuildingCatalog.fiefSettings().goals` answers it. `nextGoalOf(fief,
  catalog)` in `packages/domain/src/fief/nextGoalOf.ts` answers the
  first goal whose built level is below the goal's, or none: `underway`
  while the slot or the queue holds the next level, otherwise `pending`
  with `missing`, the resources the next level's cost exceeds at the
  read, through `shortfallOf`, the rule `InsufficientResources` shares,
  and the free peasants the projected fief lacks for its increase. The
  overview answers `goal`, `{ position, count, building, level, state,
  missing }` or `null`. *Descartar* posts `POST
  /fiefs/:fiefId/guidance/dismissal`, one `UPDATE ... WHERE id AND
  player_id RETURNING` through `GuidanceDismissals`
  (`apps/api/src/guidance/`), 404 `FiefNotFound` for another lord's
  fief, into the nullable `fiefs.guidance_dismissed_at` of migration
  0028. The dismissal travels with the fief read: `Fief
  .guidanceDismissedAt` is restored from the row the fief read already
  selects, never written by `save`, and `fiefOverviewOf` answers `goal:
  null` once it is set, so a fief read stays one round trip (N2). The
  port has no `isDismissed`: reading it through the port added a second
  statement and broke the N2 test. The web `GoalCard` reads *Meta 2 de
  9*, the goal's line and its state: underway, the resources or the
  peasants short, or *Tienes lo que hace falta.*, except while the
  queue is full, when it reads the `QueueFull` refusal instead.
- **A hint is one line, once per player, the first time a concept
  matters** (Decision 12 and the Defaults of #463; #474, #478, PRs #482
  and #489). `HintKindSchema` in `packages/contracts` fixes seven kinds
  and their order: `peasants`, `seasons`, `queue`, `library`,
  `barracks`, `marches`, `fullStore`. A seen hint is a row of
  `player_seen_hints` (migration 0028, keyed by player and hint),
  written by `POST /hints/:hint` through `SeenHints`
  (`apps/api/src/hint/`) with `ON CONFLICT DO NOTHING`, 400 for an
  unknown hint; sign-up, sign-in and `GET /auth/session` answer
  `Player.seenHints`. The `_signedIn` layout owns `useHints` and shares
  it through `HintsContext`: hidden is the session's `seenHints` plus
  every hint dismissed on this visit, so *Entendido* hides a hint at
  once on every screen and fief with no session re-read. `fiefHintOf`
  answers the first unseen hint, in the schema's order, whose trigger
  holds on the live read, and the triggers read the overview alone
  (N1): `peasants` a building card blocked by peasants, `seasons` a
  `multiplierPercent` other than 100, `queue` the build slot busy,
  `library` and `barracks` their building at level 1, `fullStore` a
  store at its capacity; `marchesHintOf` holds on the map while some
  unit is at home. One hint per screen: `peasants` and `fullStore`
  right under the sticky block, outside it, so the block never grows
  past the scroll margins, where the Design System had put them inside
  the bar, a placement changed on review; `seasons` under the season
  line, `queue` under the build slot, `library` and `barracks` under
  their headings, `marches` on the map above the province grid; the
  chronicle shows none. The design-system `Hint` is a `<p role="note">`
  with a quiet *Entendido* button; it never takes focus when it appears
  and is never a modal. The copy is the lore's, in `copy.hints`.
- **The switcher badges each other fief's free slots and full stores**
  (Decision 10; #465, #475, PRs #479 and #490). Each entry of `GET
  /fiefs` answers `freeSlots`, in the order `build`, `study`, `recruit`,
  `march`, with study from library level 1 and recruit and march from
  barracks level 1, and `fullStores`, the resources at or above the
  capacity, both from `fiefListOf`. `FiefSwitcher` draws one `Chip` per
  free slot, reading the strip's idle lines, and one per full store,
  *Almacén lleno: piedra*, on every fief but the current one, each a
  text beside an icon and part of the entry's accessible name. The
  list is read on each navigation, never on a timer, as before.
- ***Avisarme* is a browser notification kept in the browser, sent only
  after the re-read confirms the finish** (Decision 13; #476, PR #491).
  `NoticeToggle`, a `role="switch"` in the strip, is off by default;
  turning it on calls `Notification.requestPermission()`, and only a
  grant keeps it on, stored as `mygame.notices` in `localStorage`;
  anything else, the API absent included, leaves it off with the lore's
  denied line. `useLiveFief` hands every `GET` answer and the overview
  before it to `useFinishNotices`, never the first read of a mount, and
  an `adopt`, the answer to the player's own POST, moves the baseline
  without a notice. `finishNoticesOf(previous, next)` answers one
  notice per finish whose instant is at or before the re-read's
  `readAt` and whose effect the re-read shows: the level reached, the
  order gone and its units counted, the march gone, the cargo gone and
  the amounts risen. A cancel or a recall happens before the instant
  and a lost attack ends before `returnsAt`, so none notifies, and an
  attack not yet fought or a founding still on the way sends nothing,
  since the read before the outcome cannot tell a won, a lost or a
  turned-back march. The body is `chronicleRowOf`'s heading and subject,
  letter for letter as the roll's line, the title the fief's name and
  the `tag` the fief id and the row key. No service worker, no push, no
  server timer (W7, N2). Only while the tab is open, and only for the
  fief on screen.
- **The three stores are api-side ports, not domain** (#478, PR #482).
  `DigestAcknowledgements`, `GuidanceDismissals` and `SeenHints` join
  `Accounts`, `AccountTokens`, `Mailer` and `ChronicleReader` as the
  ports defined in `apps/api`, each with a memory and a Drizzle adapter
  under one contract suite run against both, wired by `composeServer`
  on the pool outside any transaction. None is a game rule: no use case
  reads them, and the one the fief read needs, the dismissal, travels
  on the fief row.
- **One migration, alone in its wave** (the Defaults of #463, ADR 006;
  #467). Migration 0028 holds every store of the slice: the
  acknowledgement, the table `player_seen_hints`, the dismissal and the
  five `full_since_<resource>`. It applies on a database at 0027 with no
  reset, and no earlier migration is edited.
- **Design first, lore first** (Decisions 14 and 15; #466, #464, PR
  #480). The bar, the strip, the action card, the digest, the goal
  card, the hints, the switcher badges and *Avisarme* were drawn on the
  fief mockup at version 30 and the Design System at version 25, desktop
  and mobile, light and dark, with Impeccable's `critique` as a second
  opinion never installed in the repo, and the owner approved them
  before any web ticket started. Every Spanish line, the finish's
  readings, the idle cells, the reasons and *lista*, the digest, the
  nine goals and their states, the seven hints and *Avisarme*, is a
  proposal for the author under *The fief's status* in
  `docs/lore/names.md`, mirrored in `apps/web/src/copy.ts` until
  accepted (ADR 010).

## Considered options

- **A pause control for the live counters**, the second of the three
  routes the research named. Rejected by Decision 5: a control the
  player must find and press, on every visit, to make a bar readable is
  a worse page than one whose amounts and minute countdowns hold still
  for a minute; and the minute was already the game's cadence, the
  ceiling M8 put on polling.
- **A written argument that every countdown is essential**, the third
  route. Rejected: the argument holds for the last minute of a finish
  the player is watching, and the slice keeps exactly that; it does not
  hold for a resource amount that drifts by a few units a second beside
  a card the player is reading.
- **Minute repaints aligned to each countdown's own boundary.**
  Rejected by the owner on #471: one timer aligned to the read instant
  is one rule; aligning each line to its own finish is one timer per
  countdown, and the cost is a line up to 59 s stale, recorded above.
- **Seconds on a levy's next unit.** Rejected by the owner on #471: a
  levy delivering a man every 34 s would tick its seconds without end
  under the one-second rule for a last minute; it repaints once at each
  delivery instead.
- **A stored snapshot of each fief's stocks at the last visit**, so the
  digest can say what was gained. Rejected by Decision 9: a second
  stored copy of state ADR 005 derives from `(amount, at, rate,
  capacity)`, one more column set to migrate and to keep in step with
  every mutation, for a number the bar already shows on the same
  screen.
- **The acknowledgement written by the read.** Rejected by Decision 9:
  a GET that writes is a read that mutates, and a read in another tab,
  a prefetch or a reload would close a digest nobody read. The POST is
  the one act that says the player read it.
- **The digest's threshold in code, or the digest read from a timer.**
  Rejected by N5 and N2: the hour is `digest.absenceSeconds` in content,
  and the digest is read once on the fief screen's mount, never on the
  minute re-read.
- **Server push, a service worker or a mail reminder for a finish.**
  Rejected by W7 and N2, and by the research's own limit: a notification
  scheduled from the known finish instant and sent after the re-read
  confirms it is display, within N1; anything that reaches a closed tab
  needs a process the api does not have.
- **A notification at the finish instant, before the re-read.**
  Rejected by Decision 13: the browser knows the instant and not the
  outcome; a cancel, a recall or a lost battle makes the instant a lie.
  The same rule as the live region the research asked for: *terminado*
  only once the server has said so.
- **The dismissal read through its port.** Overturned by the owner on
  #468: it added a second statement to `GET /fiefs/:id` and broke the
  one-round-trip test (N2). The column is restored with the fief row.
- **A goal computed from the stored state alone, with no stored fill
  instant.** The tickets' default, overturned by the owner on #463: a
  read that applies a finish saves the fief at the read instant, so a
  store that filled before it read full since the read. The instant is
  stored per resource and kept across every re-base.
- **The fill instant computed from the stored fief rather than the
  accrued one.** Not taken; see the gap on `fullAt` below.
- **`disabled` buttons.** Rejected by Decision 8: a disabled control
  leaves the tab order and announces nothing, so a keyboard or
  screen-reader player never learns why the action is unavailable.
  `aria-disabled` keeps it reachable with its reason as its description.
- ***lista* on a march form, or for any blocker time does not solve.**
  Rejected by the Defaults of #463: a march form's blockers are units
  short or a plot's state, which no hour brings; peasants, a level, a
  lock, a full queue and a cost above the capacity are the same.
- **Goal kinds other than a building at a level, daily quests,
  streaks.** Out of scope of #463, and the last two are the hooks the
  research names as dark: they raise return rates by working against
  the player, and the game refuses them on purpose.
- **A tutorial, a modal, a hint that takes focus.** Rejected by
  Decision 12 and the research's seventh principle: teach in context,
  one line, dismissible, never in the way.
- **The hints inside the bar**, as the Design System drew them.
  Changed on review of #474: a hint inside the sticky block deepens it
  past the scroll margins the strip's links are sized over. The two bar
  hints sit right under the block instead.
- **Server-side state for *Avisarme*'s preference.** Rejected by
  Decision 13: the permission is the browser's, per device, and so is
  the toggle.

## Consequences

- PRD M8 is amended: the bar and the strip are on every signed-in fief
  screen, and the countdowns and amounts they show repaint at most once
  a minute, except every second in a countdown's last minute, the
  season's included, and once at a levy's delivery and at a march's
  arrival or departure. Row S22 is added
  under Should have, citing this ADR. No Won't-have row changes: the
  slice binds M3, M8, N1, N2, N5 and N6 and keeps W7.
- `CONTEXT.md` gains **Digest**, **Acknowledgement**, **Goal**,
  **Guidance** and **Hint**.
- ADR 005 is amended: the stored tuple carries `fullSince`, kept across
  every re-base; the rule is in `.claude/rules/architecture.md` and
  `packages/domain/CLAUDE.md` since #467.
- The api still idles with no timer (N2): the digest, the goal, the
  hints and the badges are answered on read, the fill instant is stored
  by the mutation that reaches it, and the notification is the
  browser's. A fief read is still one round trip; a digest read is 2N +
  4.
- **The content of the slice sits in the api image.** `goals` and
  `digest.absenceSeconds` are content under N5, and ADR 026 recorded
  that `apps/api/Dockerfile` copies `apps/api/content` into the image,
  so in production changing a goal or the hour is a CI build and a
  deploy until the owner picks one of ADR 026's two remedies. Neither
  N5 nor ADR 008 is amended here.
- The three stores and the dismissal are per player or per fief and
  are never reset: a schema change is a migration (`CLAUDE.md`).
- Migration 0028 makes `players.digest_acknowledged_at` `NOT NULL`
  without a default, and `deploy.sh` runs the migrate image before the
  new api replaces the old one (ADR 026), so sign-up fails in the
  seconds between those two steps of that one deploy. Accepted while
  there are no third-party players; the same window applies to any
  future `NOT NULL` column without a default.
- A store already full before migration 0028 has no `full_since`, so
  its fill instant falls back to the fief's last save and it can show
  once as digest news after the deploy. A one-off, accepted while the
  author is the only player.
- Known gap: `fullAt` is computed from the fief after the read accrued
  it, with the stocks floored at the read, so it can come out up to
  `3_600_000 / rate` ms late and move between reads. Computing it from
  the stored fief would fix that.
- Known gap: if the player switches fief while the *Entendido* POST is
  still in flight, the new fief's screen can read the digest before the
  server stores the acknowledgement, and the card shows once more.
  Acknowledging it again is harmless: the server stores a later
  instant.
- Known gap: *Avisarme* notifies only the fief on screen. A notice
  comes from comparing a read with the re-read after it, and the first
  read of a mount sends none, so a fief switch loses the notices of the
  fief left behind and of a finish that lands between the switch and
  the switch back. Moving between the fief, the map and the chronicle
  keeps the layout mounted and loses nothing. It also misses a levy
  whose units of that kind leave the count in the same read gap, dead
  in a battle or a settler that founds, and a cargo when the resources
  are spent in another tab between two reads. Missed notices, never
  false ones.
- Focus after a removal (WCAG 2.4.3, #493): a button that removes
  itself or its card on success moves focus to the title of the nearest
  region that stays, focusable by script only (`tabIndex={-1}`, no new
  Tab stop) and ringed on `focus-visible`: the fief name for the
  digest's *Entendido*, the goal's *Descartar* and the `peasants`,
  `fullStore` and `seasons` hints; the slot's title for the `queue`
  hint and every cancel and recall; the section heading for `library`
  and `barracks`; the province heading for `marches` and the four march
  forms. A refusal keeps the card and focus on its button; a cancel or
  recall waits with `aria-disabled`, never `disabled`, which would take
  its focus. A hint still never takes focus when it appears.
- Known gap: `/forgot-password` and `/reset-password` replace their
  form on success, the banner's resend and the map's previous and next
  go `disabled` while busy or at an end, and a cancel or recall that
  leaves without a press (a finish, the stay ending by interpolation)
  still drops focus to `body`.
- Known gap: the strip's cargo cell has no track, because
  `IncomingCargoSchema` answers `arrivesAt` and no departure, the gap
  the S19 cargo card already had. A departure on the wire is the
  owner's call.
- Known gap: the scroll margins were measured on the demo fief; a long
  origin name in the cargo cell or a march of several kinds could make
  the sticky block taller and cover the linked section again. At 768
  px with five busy cells the strip's time spans run past the cell
  edge.
- Known gap: a goal two levels away names the next level's shortfall,
  not the goal level's; `missing` does not report a full queue, which
  the card covers by reading the refusal instead. A goal naming a
  building level the content lacks, or one whose building lacks any
  level from 1 up to it, no longer reaches a read:
  `JsonBuildingCatalog.fromDirectory` refuses such content at start-up
  (#501), so the api does not boot on it.
- Known gap: *lista* reads the rates of the read, so a season that
  turns first moves the instant only at the next read.
- Known gap: the free-slot rules and the "at or above capacity" check
  of the list are game rules living in `apps/api/src/fief/fiefListOf.ts`
  rather than in `packages/domain`.
- Known gap: the lore proposals of #464 wait for the author, among them
  the clock end's comma, *lista* on a masculine art, the idle cells'
  words, *Siguiente meta* and a lost attack's notice.
- Out of scope of #463, each a future ADR, an amendment of this one or
  a ticket: the visual look, server push or mail reminders, a resource
  snapshot, daily quests or streaks, a tutorial or a modal, goal kinds
  other than a building level, and any change to a game rule, a formula
  or content other than `goals` and `digest`.
