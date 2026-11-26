---
status: accepted, the titles drawn in What happened amended to Town News and What your town earned by the amendment of 2026-11-26
date: 2026-11-25
---
# Today and the navigation bar, the Android shell

## Context

On 2026-11-25 the owner used the Android client and said the design
still did not work: *el diseño sigue sin convencerme, no entiendo como
navegar, a donde ir nada*. Asked what failed, the owner named three
things.

- **Nothing says whether a control is working or blocked.** *No se que
  pueda hacer, si algo esta cargando o bloqueado*, with the request for
  a moving mark, three dots, that says something is happening.
- **The places cannot be seen.** The owner asked for a classic bottom
  navigation bar and a home of cards *donde tenga cada opcion, que pueda
  hacer que no puedo hacer*.
- **The dock.** *Me ocupa mucho espacio, y el boton no me dice que hace
  exactamente, simplemente esta un boton.*

This is the third time the same complaint reaches an ADR. ADR 042
answered *en qué momento aprendo inglés* with the next step. ADR 047
put the next step on a dock and the town on a pager. ADR 051 cut the
dock to one button after *takes too much space*. The dock is 84 dp at
rest since then (ADR 051), and the owner still finds it too large and
mute.

ADR 047's direction was picked from a static canvas (#1160). A still
picture cannot show that a pager hides six of its seven pages, nor that
one button changes meaning in the same spot. So this decision was taken
on a clickable prototype of a new player's first session, on the canvas
https://claude.ai/artifact/QsoXLU92BPEX7cFGXa4VVp. Its four still
boards are **A**, a grid of places; **B**, rows with their own buttons;
**C**, one status and one button, dark; and **D**, *Today*, which groups
the screen by what the player can do. The owner asked for color after
seeing them in black and white (*blanco y negro es muy muerto*), then
approved the prototype, board `Prototype`, which is D as the home with
A as the town: *eso era lo que buscaba*. The same day the owner approved
its three additions: the wait, the return on the second day and a
caught-up state with something to read.

What trunk holds, checked at `43c23eb1a`:

- **The town home is a pager.** `TownHome` (`TownScreen.kt:179`) draws a
  `HorizontalPager` (`:189`) of seven `TownPage`s in `streetOrder`
  (`TownStreetStrip.kt:16`), and opens on the next step's place
  (`openingPage`, `:213`). A place that is not on screen is reached by a
  swipe or by the street strip's 48 dp silhouettes.
- **There is no navigation bar.** `rg
  'NavigationBar|BottomNavigation|NavigationRail|NavigationSuite'` over
  `apps/android` finds only system-bar theme tests. The client runs
  Navigation 3 at 1.2.0 on one `NavBackStack` that `Navigator` mutates
  by hand (`AppNavigation.kt:53`, `Navigator.kt:12`).
- **The dock reaches far.** Thirty-three production files use a dock
  type (`MyGameDock`, `MyGameDockGo`, `TownDock`, `TaskDock`,
  `TaskDockHook`, `TownStatusUiState.Dock`, `openFromDock`), and 99 test
  or fixture files name `Dock`. The fold lives in `MyGameDock.kt:64-91`
  and `FramedScreen.kt:74-155`.
- **Three kinds of signed-in screen.** `FrameKind { Home, Place, Task }`
  (`FrameKind.kt:3`): the town is Home; Settings, the Report, Town News,
  the school, a school text and the region map are Place; the placement,
  a lesson's words, the reviews and the holdout check are Task.
- **Busy and blocked look alike, and neither speaks.** `MyGamePill`
  draws both in `ink-muted` on `surface-sunken` (`MyGamePill.kt:70-82`).
  Busy adds a still hourglass and a hairline; blocked a dashed frame
  (`:98`, `:262-272`). The busy description and the blocked reason go to
  semantics only (`:87`). Two callers draw the reason as text beside the
  button, `NextLevel.kt:65-71` in `warning-ink` and `LessonRows.kt:148`;
  the dock does not.
- **A loading screen is blank for 400 ms.** `MyGameSkeleton` draws
  nothing for `REVEAL_MILLIS`, then pulsing blocks for at least 250 ms
  (`MyGameSkeleton.kt:56`, `MyGameTransitions.kt:11-12`). The owner
  asked for a skeleton only on a slow cold read (#917), and the two
  figures came with it (`3019fff83`, `1d61fecab`). No ADR records them.
- **The server already answers the first card.** `TownOverview.nextStep`
  is one of `reviews`, `holdoutCheck`, `lessonRunning`, `releasedLesson`,
  `lessonToStudy` and `caughtUp` (`NextStep.ts:63-71`). `lessonRunning`
  and `caughtUp` carry the goal and the newest text, and the overview
  carries `nextDueAt` (`TownOverview.ts:154`).
- **Countdowns need no new field.** The overview sends instants,
  `LessonUnderStudy.finishesAt` and `BuildingWork.finishesAt`, and the
  client's projection counts down from them. The time a resource
  shortfall is covered is computed on the device too
  (`TownSnapshot.readyTimeOf`, `TownUiStateMapping.kt:111`).
- **Nothing says what a town gained while the player was away.** The
  stocks are stored with one `stored_at` (`townTables.ts:48`) and
  derived on read. Town News holds events and no production. ADR 042
  ruled that a return visit shows *no greeting, no count of days away,
  no streak* (lines 349-350).
- **Some reads already write.** `GET /town` persists a settle that is
  due (`resolveTownReading.ts:79-83`), and `GET /report` writes
  `players.report_served_at` (`accountTables.ts:26`).
- **A word is read only until its first review.** `readableWordsOf`
  admits a word while its lesson runs or while its card has no
  `lastReviewAt` (`readableWordsOf.ts:12-15`, ADR 042, lines 58-59). A
  text, though, shows a card word with its gloss beside it under 7 days
  of stability, at any time (ADR 049, lines 155-159). The first text
  opens at lesson 31 (`texts.json`, PRD S25).
- **The Report holds no fact the new screens lack.** It draws the
  reviews due or the time of the next one, the Town News since its last
  close, and rows to all the news, the reminder offer and Settings
  (`ReportScreen.kt:124-210`).
- **Blocks already carry color.** ADR 043's block is a flat card on one
  of four hues with `on-block` text, and `block-peach` is one of them
  (`tokens.ts:48`). `warning-soft` is drawn by nothing in either client:
  a shortfall is words in `warning-ink`.
- **The web has neither a dock nor a pager.** It stays parked (ADR 047,
  *One source while the web is parked*).

## Decision

### The navigation bar

**A navigation bar with four tabs stands at the foot of every signed-in
screen that is not a task screen: Today, Town, Learn and Me.** It
replaces the dock, the pager and the street strip.

- **The open tab is told by shape.** It draws a bar on its top edge and
  its label in bold; the others draw neither (ADR 050, *Shape says the
  role*).
- **Learn carries a count** while reviews are due, the count the next
  step's `reviews` already holds.
- **A task screen draws no bar.** The placement, a lesson's words, the
  reviews and the holdout check keep the back link in their header and
  draw their way on in flow at the foot of their content, as a signed-out
  form does today.
- **A tab is a place the player can always go.** No tab is hidden,
  disabled or reordered by the game's state.
- **The town's naming comes before the bar.** A town with no name shows
  the naming alone, with no bar, as it shows no dock today. Today
  follows it.
- **The ring keeps its header.** It is drawn in the header of each tab's
  root and of a place's page, and hidden as ADR 047 hides it.
- **The status line under a header is deleted.** A running lesson is a
  row of *In progress* on Today and Learn's own row. Its finish is
  Learn's count and Today's first card.

| Tab | What it holds |
|---|---|
| **Today** | what the player can do now, what is in progress and what is locked |
| **Town** | the stocks and the seven places |
| **Learn** | the lessons, the reviews, the texts and the learning card with its counts: today's school screen without the building's level and work. No screen lists the words held |
| **Me** | today's settings screen, the study reminder's offer and the sign-out |

**One back stack, Today at its base.** A tab change cuts the stack to
Today and adds the tab's root; the open tab's own button returns to its
root. The system back button on a tab's root shows Today, and on Today
it leaves the game. A task screen is pushed above whatever opened it and
returns there. The bar is drawn by the shell outside the animated
content. The open tab, and whether the bar is drawn, are read from the
stack and never stored. A place page left open on Town is closed by a
tab change: that is one tap to reopen, against four stacks that must
agree after the process dies.

### Today

**Today is the signed-in home.** It lists, top to bottom, each section
drawn only while it holds something:

1. **The first card**, the server's next step and the screen's one
   filled button at `action` height. Its eyebrow is *Start here* until
   the player's first lesson finishes, and *What is next* after.
2. **What happened**: the Town News not yet closed, and on a return
   what the town gained, under the title *While you were away*.
3. **In progress**: the running lesson, the building work and the job
   out, each with its countdown. The lesson's row opens its words, the
   job's row the region map.
4. **You can do now**, titled *While you wait* while a lesson runs: every
   work the town can start, each row with its own button.
5. **Keep going**, when the next step is `caughtUp`: something to read.
6. **Locked**: what the player cannot do yet, each row with its reason.

The client decides nothing about the game here. The first card is
`nextStep` as sent. The rows of *You can do now* and *Locked* are the
buildings' next levels with the block reason the client's projection
already derives for the place pages, and nothing else: a hire, a job
and a clean-up stay on the office's page and the region map. The
placement's offer is one more row of *You can do now*, and of Learn,
while the server offers it.

| `nextStep` | The first card | Elsewhere on Today |
|---|---|---|
| `lessonToStudy`, `releasedLesson` | *Study lesson N* | |
| `reviews` | *Review N words*, through the unread words first (ADR 042) | |
| `holdoutCheck` | the check | |
| `lessonRunning` | none | the lesson in *In progress*; the goal's building first in *While you wait* |
| `caughtUp` | what was done today, with the reason and the time of the next review | the goal's building first in *You can do now*; the reading in *Keep going* |

**Today is not a list of daily quests.** PRD W10 stands. Every row is
derived from the town's state on read. No row pays a reward for being
done, nothing resets at midnight, and the goal (ADR 028) is still the
one thing the game asks for: it leads its section.

**Today is never a wall.** While something runs, Today offers what else
can be done. When nothing is left, *Keep going* offers reading, and the
first card says when the next review is due.

### What Keep going offers

**The newest open text once the stage has reached one (ADR 049), and
otherwise the frames of the words the player holds.**

- A word is offered from its first review on, while its card's next
  review is due a day or more away. A word due sooner is not offered:
  a recall cued by a gloss the player read minutes before is
  repetition, not retrieval.
- A word with no card is not offered, so a held-out word never is
  (ADR 037).
- The frames offered are the word's anchor frame and the later frames
  the stage admits, except the later frame its next recall would show
  (ADR 044).
- Each frame is drawn as a text is, every card-word token with its own
  support (ADR 038).
- The server answers the list on read from the cards and the clock.
  Reading writes no rating, no card and no log row, and pays nothing
  (ADR 042).
- The route answers the frames and nothing else. The newest open text
  is already on `caughtUp`. The slice names the path beside
  `GET /town/texts/{textId}`, and the content caps how many words one read
  answers.
- The cap takes the readable words in an order fixed per UTC day of the
  read: each word id hashed with that day, the lower word id first on an
  equal hash. Soonest due first would read nearly every word one to two
  days before its recall, so the read would prime the recall and FSRS
  would credit an aided Good as unaided, and every read of a day would
  answer the same words. The daily order spreads the reads across the
  interval, as spaced restudy does (Soderstrom, Kerr & Bjork 2016,
  *Psychological Science* 27(2)). The day turns at 00:00 UTC, not at the
  player's midnight.
- `wordsPerRead: 10` is a session length of about one to two minutes,
  not a number a study fixes: sets of 4, 10 and 20 words differ little
  (Nakata & Webb 2016, *Studies in Second Language Acquisition* 38(3)).

One day is the line FSRS draws between a same-day review and a later
one (ADR 036). No study gives the number; it is the content's to tune.

A player in the day before the first recalls holds no word a day away,
so *Keep going* is empty and the first card's time of the next review
is all Today says. That day is the one gap left.

### What While you were away says

**`towns.seen_at` holds the instant of the town's last overview read,
and every overview read moves it.** A read at least one hour after the
later of `seen_at` and `stored_at` answers `away`: per resource, the
amount the stock rose from that instant to `readAt`, derived by the
settle the read already performs. Rates that changed while the player
was away, capacities and seasons are exact, because both ends come from
the settle.

- **The card names no source and no time away.** The rise includes a
  job's pay, so a figure cannot be laid on the tax or the farm. The
  hours away are not drawn: ADR 042's *no count of days away, no streak*
  stands.
- **It collects nothing.** The stocks already hold what it reports (PRD
  W10, click-to-collect).
- **`away` is sent once.** The client holds it until the player leaves
  Today.
- **It shares a section with the Town News not yet closed.** *What
  happened* draws the gains, then at most three events and a link to
  all the news. *Close* closes them with `POST /report/close`. The
  section sits under the first card, so the next step is the first
  thing on Today on every visit.
- The hour is the content's to tune, in the town's settings.

```ts
const AwaySchema = z.strictObject({ gained: ResourceAmountsSchema })
away: AwaySchema.nullable(),
```

### Town

**Town is a grid of the seven places under the stocks.** Each card
states the place's name, its level and its state in words. A place with
a work the town can start draws that work's button on its card, with
its cost. The rest of the card is a door to the place's page, which
keeps what ADR 047 gave a page: the art, the words its next level needs
and its work. Town News is a door in Town's header. The region map is a
door on the office's page, as today.

### The Report is folded away

**The Android client draws no Report screen.** Its reviews due are the
first card and Learn's count. Its time of the next review is the
caught-up card's. Its Town News is drawn in *What happened*.
Its reminder offer and its sign-out move to Me. A study reminder's tap
opens Today, where the first card names the step. The api's Report
routes stay, for the web.

### Every control says its state

**A control is in one of three states, and each has its own cue that a
grayscale screenshot keeps.**

| State | The cue |
|---|---|
| **Can** | the solid fill or the closed outline of ADR 050, with a label that names the verb and, where there is one, the cost |
| **Working** | three dots that pulse in turn, and beside them, in view, what is happening: the busy description that today reaches only a screen reader. The dots replace the hourglass. With the system's motion reduced the dots stand still |
| **Blocked** | ADR 050's dashed frame, a lock, and in view beside the control the reason and what lifts it: the count held against the count needed, or the time the shortfall is covered |

A refusal is drawn beside the control whose tap was refused. It no
longer has a dock to sit in.

**A loading screen draws the three dots at once and the skeleton after
the reveal.** From the first frame the dots pulse at the top of the
content in `ink-muted`, and the loading line is spoken. After 400 ms the
skeleton's blocks join them and the loading line is drawn beside the
dots; the blocks hold 250 ms. A read that answers inside the reveal
shows the dots and no blocks. The dots are the mark a working button
draws, so one mark means *working* everywhere.

### Color

**ADR 043's tokens and type stand, and no token enters.** The
prototype's two typefaces and its hex values are a drawing, not tokens.
Three things change:

- **`go` means the player can act now.** ADR 047 gave it one job, the
  way on, and one button per screen. It now fills the first card's
  button and outlines every other button of an action the town can
  take. *One go per screen* becomes *one first card on Today*.
- **An achievement is a peach block.** A lesson finished, the reviews
  done, a building built: each is drawn as ADR 043's block on
  `block-peach`, with `on-block` text, radius `lg`, no frame and no
  control. It opens with a seal, a check cut out of a solid `on-block`
  disc, the cue a grayscale screenshot keeps. Its text pairs are ADR
  043's: `on-block` 12.04 and `on-block-muted` 6.32 on `block-peach`,
  the same in both themes. On Today, Town, Learn and Me peach means an
  achievement and nothing else is a block.
- **An achievement is drawn in two places.** The first card is one
  while the next step is `caughtUp`. In *What happened*, the events
  `buildingWorkFinished`, `lessonStudied`, `skillEarned` and
  `becameCity` are achievements, and every other event is a plain row.
  An achievement goes when the Town News is closed.
- **The first card is paper, not a block.** It is a `surface-raised`
  card whose one color is its `go` button.

The task screens keep ADR 043's blocks for the word and the review.
They are not this ADR's.

### What the prototype drew that this ADR does not adopt

- **The right answer in `go`, and a gain's figure in `go`.** ADR 047's
  rule stands: green marks an action, never a verdict or a resource.
  Right and wrong are ink and shape.
- **A hairline frame around a row that is not tappable.** ADR 050's rule
  stands: a closed frame means tappable. A row that only holds a button
  is a fill, and the frame belongs to its button.
- **A gain laid on its source, and the hours away.** *What While you
  were away says* gives the reasons.
- **The gains above the first card.** The next step stays first on
  Today.

### What this ADR amends

| ADR | It says | It becomes |
|---|---|---|
| 005 | a read writes nothing | an overview read writes one instant, `seen_at`, and advances no stock |
| 037 | the comparison is cards plus reading against reading alone | a card, with its reviews and the reading it opens, against reading alone |
| 042 | after the first review a word cannot be read | it is read again only in *Keep going*, a day or more before its next review |
| 042 | the Report stays | the Android client draws none; the api's routes stay |
| 042 | a return visit shows the same card, no greeting | a return visit may say what the town gained; no count of days away and no streak, as before |
| 043 | the next step on the town home is a block; hue is identity, never meaning | Today's first card is paper; on the four tabs peach means an achievement |
| 046 | one offer, on the Report; a tap opens the Report | the offer is on Me; a tap opens Today |
| 047 | the dock; the pager and the street strip; where the pager opens | the navigation bar; Town's grid and a place's page; Today's first card |
| 047 | `go` fills the one green button on a screen | `go` marks every action the town can take; the first card's is the filled one |
| 050 | the go is drawn in the dock; one go per screen | on Today's first card, in flow on a task screen; one first card on Today |
| 050 | a busy button draws the hairline with the hourglass | the three dots and its description in view |
| 051 | the dock is the go; the notice folds to the top of the scroll | no dock; a refusal beside its control, a task's verdict in the task's flow; nothing folds |
| PRD S22 | the Report holds the reviews due and the Town News | Today holds them on Android; the row is reworded by the slice that folds the Report away |

ADR 042's next step and its rule that reviews go through the unread
words stand. ADR 043's tokens and type stand. ADR 050's five roles and
its rule that shape says the role stand. ADR 056's order, by feature and
then by role, and its limits stand; its Track X, #1983 to #1989, moves a
frame and a dock this ADR removes, so those seven tickets are held until
they are rewritten against this shell.

The status lines of ADR 047, ADR 050 and ADR 051 name this ADR. Those of
ADR 005, 037, 042, 043 and 046 are amended by the slice that ships each
change, since nothing they describe has moved yet.

No `CONTEXT.md` term changes in this commit. The slice that ships each
piece writes its term: **Today**, **navigation bar** and **away** enter;
**dock**, **fold** and the street strip leave; **shell**, **screen
frame**, **next step**, **place** and **word reading** are reworded.

### What the slices still owe

**The measure.** The bar's height and Today's tallest state at 360 by
640 with font scale 2.0, in both languages, taken as ADR 051 took the
dock's. The slice that draws each owes it before its screenshots.

## Considered options

- **Keep the dock and shrink it again.** ADR 051 did, to 84 dp. The
  owner's second complaint is not its size: a button apart from the
  thing it acts on does not say what it does.
- **A side drawer.** It hides the places behind an icon, which is the
  pager's defect again. A drawer suits eight or more destinations, and
  the game has four.
- **Board A as the home.** The whole town on one screen, but the first
  thing a new player sees is seven buildings and no English.
- **Board B.** Every building with its button, and no room for what is
  running or why a thing is locked.
- **Board C.** One status and one button on a dark ground: the dock's
  bet again, larger.
- **Black and white alone.** The owner found it dead. A game owes the
  player a reward that a tool does not.
- **One back stack per tab.** It keeps a place page open under its tab.
  It also needs four saved lists and a saved tab that must agree after
  the process dies, and a back button switched between tabs by hand.
- **A new token pair for the achievement.** Two tokens the parked web
  would never draw. `block-peach` is already measured in both themes.
- **Frames read again with no guard,** as the prototype drew them. A
  recall minutes after its answer was on screen measures nothing, and a
  primed *Good* on the second day lifts a card past the cap's line and
  the stable line at once (ADR 048).
- **Texts opened before lesson 31.** Content alone, but one static text
  where the frames give hundreds of sentences already written.
- **The away card from Town News, with no migration.** It can list
  events and never what the town produced, which is the point of it.
- **The dots alone for a loading screen.** That loses the layout on a
  cold read of one to six seconds and reverses #917.

## Consequences

- The pager, the street strip, the dock, the fold and the three frame
  kinds' dock wiring are deleted, not adapted: 33 production files use a
  dock type today. Their tests go with them, among them the dock tests
  ADR 051 rewrote. The Report's screen and its destination go too.
- The server changes in two places. `towns.seen_at` is one nullable
  column, one migration and one write per overview read, with `away` on
  the overview. The frames of *Keep going* are one domain function, one
  route and its contract. Both change the Android generated client.
- A settle made by another request while the player is away, a review
  answer that earns a skill, moves `stored_at`. The away card then
  reports less than the town gained, never more.
- The busy description and the blocked reason become visible text, so
  every one of them is player-facing copy in `packages/catalog`, read
  again for both languages.
- A warm read with nothing held shows three dots for about 300 ms where
  it showed nothing.
- A later frame read in *Keep going* can become a later recall's
  sentence, which ADR 049 already calls less of a new context.
- ADR 056's remaining tickets are read against this ADR before any is
  dispatched. Track X is held. U4 #1930 and the `core:designsystem`
  tickets, #1931 and #1932, name code this ADR deletes in part.
- The design is judged on the emulator by walking a new player's first
  session and the second day, not by a still screenshot.

## References

- The canvas and its prototype:
  https://claude.ai/artifact/QsoXLU92BPEX7cFGXa4VVp
- ADR 005, lazy evaluation; ADR 036 and ADR 037, the reviews and the
  holdout; ADR 042, the first session; ADR 043, the look; ADR 044,
  later frames; ADR 046, the study reminder; ADR 047, Main Street; ADR
  048, the learning cap; ADR 049, texts; ADR 050, tappable roles; ADR
  051, the compact dock; ADR 056, the Android client reads by feature,
  then by role.
- PRD W10, no streaks, daily quests or click-to-collect; PRD S25, texts.
- #1160, the canvas ADR 047 was picked from; #1294, the dock's size;
  #917, the skeleton.
- `.claude/rules/ui-components.md`: touch targets, the four states of a
  screen that loads, reduced motion.

## Amendment (2026-11-26): two section titles content check 9 refuses

Content check 9 (`checkChrome.ts`, ADR 040) admits in the chrome only
frame words and the words the chrome lessons teach
(`docs/setting/chrome.md`). Two titles this ADR names hold words the
chrome lessons do not teach, so neither can ship as written.

| Section | This ADR says | It becomes | Refused word |
|---|---|---|---|
| *What happened*'s events (#2011) | *What happened* | *Town News* | *happened* |
| *What happened*'s gains (#2012) | *While you were away* | *What your town earned* | *while*, *away* |

- **The section keeps its name in this ADR.** *What happened* still
  names the second section of Today; only the titles drawn on screen
  change.
- **The gains' title says what the away card says.** It names what the
  town gained since the last overview read, as *earn* already does on
  the skill earned, and it names no source and no time away: ADR 042's
  *no count of days away, no streak* stands.
- **Every criterion that names the old title reads the new one.** A
  shot that "shows *While you were away*" shows the gains under *What
  your town earned*.
