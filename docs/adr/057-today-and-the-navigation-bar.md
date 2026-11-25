---
status: accepted, the open points owed to a grill before any ticket
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
  nothing for `REVEAL_MILLIS`, then pulsing blocks
  (`MyGameSkeleton.kt:56`, `MyGameTransitions.kt:11`).
- **The server already answers the first card.** `TownOverview.nextStep`
  is one of `reviews`, `holdoutCheck`, `lessonRunning`, `releasedLesson`,
  `lessonToStudy` and `caughtUp` (`NextStep.ts:63-71`). `lessonRunning`
  and `caughtUp` carry the goal and the newest text.
- **Countdowns need no new field.** The overview sends instants,
  `LessonUnderStudy.finishesAt` and `BuildingWork.finishesAt`, and the
  client's projection counts down from them. The time a resource
  shortfall is covered is computed on the device too
  (`TownSnapshot.readyTimeOf`, `TownUiStateMapping.kt:111`).
- **Nothing says what a town gained while the player was away.** The
  overview holds current stocks and `readAt`; Town News holds events,
  with no totals.
- **A new player has nothing to read.** The first text opens at lesson
  31 (`texts.json`, PRD S25). A lesson's words can be read until their
  first review and not after (ADR 042, lines 58-59), and no route serves
  a lesson's frames again.
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

| Tab | What it holds |
|---|---|
| **Today** | what the player can do now, what is in progress and what is locked |
| **Town** | the stocks and the seven places |
| **Learn** | the lessons, the reviews, the words and the texts: today's school screen without the building's level and work |
| **Me** | today's settings screen |

### Today

**Today is the signed-in home.** It lists, top to bottom, each section
drawn only while it holds something:

1. **While you were away**, on the first read after an absence: what the
   town gained.
2. **The first card**, the server's next step and the screen's one
   filled button at `action` height. Its eyebrow is *Start here* until
   the player's first lesson finishes, and *What is next* after.
3. **In progress**: the running lesson and the building work, each with
   its countdown. The running lesson's row opens its words.
4. **You can do now**, titled *While you wait* while a lesson runs: every
   work the town can start, each row with its own button.
5. **Keep going**, when the next step is `caughtUp`: something to read.
6. **Locked**: what the player cannot do yet, each row with its reason.

The client decides nothing about the game here. The first card is
`nextStep` as sent. The rows of *You can do now* and *Locked* are the
buildings' next levels with the block reason the client's projection
already derives for the place pages.

| `nextStep` | The first card | Elsewhere on Today |
|---|---|---|
| `lessonToStudy`, `releasedLesson` | *Study lesson N* | |
| `reviews` | *Review N words*, through the unread words first (ADR 042) | |
| `holdoutCheck` | the check | |
| `lessonRunning` | none | the lesson in *In progress*; the goal's building first in *While you wait* |
| `caughtUp` | what was done today, with the reason | the goal's building first in *You can do now*; the text in *Keep going* |

**Today is never a wall.** While something runs, Today offers what else
can be done. When nothing is left, *Keep going* offers reading. What it
offers a player below lesson 31 is an open point.

### Town

**Town is a grid of the seven places under the stocks.** Each card
states the place's name, its level and its state in words. A place with
a work the town can start draws that work's button on its card, with
its cost. The rest of the card is a door to the place's page, which
keeps what ADR 047 gave a page: the art, the words its next level needs
and its work.

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

### Color

**ADR 043's tokens and type stand.** The prototype's two typefaces and
its hex values are a drawing, not tokens. Three things change:

- **`go` means the player can act now.** ADR 047 gave it one job, the
  way on, and one button per screen. It now fills the first card's
  button and outlines every other button of an action the town can
  take. *One go per screen* becomes *one first card on Today*.
- **A second tone marks what the player achieved**: a lesson finished,
  the reviews done, a building built. It is a ground, never a control's
  color. Its token pair is an open point, because the prototype's warm
  ground sits beside `warning-soft`, which today means a shortfall.
- **The surfaces stay neutral.** The places keep their hues in their art
  (ADR 043), which is where color lives on Town.

### What the prototype drew that this ADR does not adopt

- **The right answer in `go`, and a gain's figure in `go`.** ADR 047's
  rule stands: green marks an action, never a verdict or a resource.
  Right and wrong are ink and shape.
- **A hairline frame around a row that is not tappable.** ADR 050's rule
  stands: a closed frame means tappable. A row that only holds a button
  is a fill, and the frame belongs to its button.

### What this ADR amends

| ADR 047 says | It becomes |
|---|---|
| *The dock* | no dock; the navigation bar |
| *The pager*: seven pages and the street strip | Town's grid; a page is a place screen its card opens |
| *Where the pager opens* | Today's first card |
| `go` fills the one green button on a screen | `go` marks every action the town can take; the first card's is the filled one |

| ADR 050 says | It becomes |
|---|---|
| The go is drawn in the dock | on Today's first card; in flow on a task screen |
| One go per screen | one first card on Today |
| A busy button draws the hairline with the hourglass | the three dots and its description in view |
| A blocked button draws the dashed frame | unchanged, with the lock and its reason in view |

| ADR 051 says | It becomes |
|---|---|
| The dock is the go, pinned at the foot | no dock |
| The notice sits above the go and folds to the top of the scroll | a refusal beside its control, a task's verdict in the task's flow; nothing folds |

ADR 042's next step and its rule that reviews go through the unread
words stand. ADR 043's tokens, type and place art stand. ADR 050's five
roles and its rule that shape says the role stand. ADR 056's order, by
feature and then by role, and its limits stand; its Track X, #1983 to
#1989, moves a frame and a dock this ADR removes, so those seven tickets
are held until they are rewritten against this shell.

The status lines of ADR 047, ADR 050 and ADR 051 name these amendments.

No `CONTEXT.md` term changes in this commit. The slice that ships each
piece writes its term: **Today** and **navigation bar** enter; **dock**,
**fold** and the street strip leave; **shell**, **screen frame**, **next
step** and **place** are reworded.

### Open points

A grill settles these before `to-tickets` splits the work.

1. **What a caught-up player below lesson 31 reads.** The prototype
   offers a lesson's frames again after its first review. ADR 042
   forbids that, because a review must ask without the answer on the
   page, and ADR 037 keeps held-out words unseen. Free reading of card
   words may also change what the holdout check measures.
2. **How the server answers *While you were away*.** It needs the
   instant of the player's last read, which no table stores, and totals
   derived by lazy evaluation (ADR 005). That is a migration.
3. **Where the Report, Town News and the region map are reached.**
   Proposed: the region map from the office's card, as its page does
   today; Town News from Town's header; the Report from Learn.
4. **The achievement tone's token pair**, light and dark, measured as
   `tokens.test.ts` measures every pair, and told apart from
   `warning-soft`.
5. **The loading screen.** Whether the skeleton keeps its 400 ms of
   nothing or the three dots stand in for it.
6. **The back stack.** One stack per tab or one stack reset on a tab
   change, on Navigation 3.
7. **The measure.** The bar's height and Today's tallest state at 360 by
   640 with font scale 2.0, in both languages, as ADR 051 measured the
   dock.

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

## Consequences

- The pager, the street strip, the dock, the fold and the three frame
  kinds' dock wiring are deleted, not adapted: 33 production files use a
  dock type today. Their tests go with them, among them the dock tests
  ADR 051 rewrote.
- The server's contract does not change for Today, Town or the three
  states. *While you were away* and the caught-up reading may change it;
  their open points say so.
- The busy description and the blocked reason become visible text, so
  every one of them is player-facing copy in `packages/catalog`, read
  again for both languages.
- A new token pair is written in `apps/web/src/design/tokens.ts`, the
  one source, and generated into `core:designsystem`. That touches the
  web's suite while the web stays parked.
- ADR 056's remaining tickets are read against this ADR before any is
  dispatched. Track X is held. U4 #1930 and the `core:designsystem`
  tickets, #1931 and #1932, name code this ADR deletes in part.
- The design is judged on the emulator by walking a new player's first
  session and the second day, not by a still screenshot.

## References

- The canvas and its prototype:
  https://claude.ai/artifact/QsoXLU92BPEX7cFGXa4VVp
- ADR 042, the first session; ADR 043, the look; ADR 047, Main Street;
  ADR 050, tappable roles; ADR 051, the compact dock; ADR 056, the
  Android client reads by feature, then by role.
- #1160, the canvas ADR 047 was picked from; #1294, the dock's size.
- `.claude/rules/ui-components.md`: touch targets, the four states of a
  screen that loads, reduced motion.
