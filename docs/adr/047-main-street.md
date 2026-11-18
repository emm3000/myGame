---
status: proposed
date: 2026-11-17
---
# Main Street, the Android look

## Context

On 2026-11-17 the owner picked direction **B, Main Street**, from the four
on the canvas of #1160 (https://claude.ai/artifact/USvWmDMuKo1wfFdfumuWez).
In Main Street the town home is a pager with one large place on each page,
and a fixed dock sits at the foot of the screen. The next step is always
the one green button, in the same thumb spot on every screen. The other
three directions were A, Paper, which tidies up ADR 043; C, Ledger, one
dense table; and D, Lit Windows, one task per screen on a dark skyline.
The owner rejected all three. This ADR records B for the Android client,
amends ADR 043 line by line, and settles what the canvas left open.

The facts below were checked on `trunk` at `a1aae9a4` and against the
canvas files `B-Spec`, `B-Home`, `B-Review`, `B-Report` and `B-Home-Dark`:

- **The canvas's neutrals are not trunk's.** Board B draws ground
  `#fafaf7`, raised `#ffffff`, ink `#17161c` and muted `#5c5a63`.
  `tokens.ts` holds `surface` `#f4f3f1`, `surface-raised` `#fbfaf9`,
  `ink` `#15141a` and `ink-muted` `#5f5d65`. #1160 calls the boards
  sample values, and its contrast figures were measured on the board's
  own hexes. This ADR measures every pair again on trunk's tokens.
- **Board B adds three greens.** They are `go` `#0b6b47` / `#5fd6a0`,
  `on-go` `#ffffff` / `#06231a` and `go-soft` `#dff3e8` / `#12301f`, light
  then dark. No screen on the board draws `go-soft`. It appears only in
  the palette strip.
- **Android has no pager, dock or navigation bar.** `rg Pager`,
  `rg 'BottomSheet|Dock'` and `rg MyGameNavigationBar` over
  `apps/android` find nothing. The town home (`TownScreen.kt`, `TownHome`)
  is one column, in this order: `NextStepSection`, `TownDoors` (*School*
  and *Report*), `TownSkyline`, `StocksSection`, `BuildingWorkSection`,
  `PlacesSection` and `OfficeSection`, with a `MapRow` as well.
  Every other signed-in screen is drawn inside `FramedScreen`
  (`AppNavigation.kt`): `MyGameHeader` with the back link and the ring,
  then the town status.
- **The primary button is the ink pill.** `MyGameButton` draws
  `MyGamePill` on `colors.action`, shaped by
  `RoundedCornerShape(MyGameRadii.pill)`.
- **The next step can be read on every signed-in screen.**
  `TownStatusViewModel` holds the town read that `FramedScreen`'s status
  draws from, and that read carries `nextStep`. So a dock on every screen
  needs no new request and no wire change. `TownStatusUiState` holds only
  `running` and `notice` today, so it has to gain the dock's state.
- **Some next steps point at the screen they are drawn on.**
  `nextStepCard()` maps `CaughtUp` to `GoToReport`, so a caught-up
  Report would offer *Go to the Report*. On the School, `SchoolNextStep`
  maps `Study` to nothing (`Unit`), and `ReadWords(null)` opens nothing.
- **A level's words are on the level, not the place.**
  `TownSnapshot.Building.next?.wordsNeeded` (`count`, `standing`, `held`)
  is on the wire (ADR 045). `next` is null at the top level, and
  `wordsNeeded` is null for a level that needs no words.
- **24 feature call sites draw `MyGameButton`**, plus one preview in
  `MyGameLabel.kt`. *What the button becomes* below assigns each one.
- **The orientation is not locked.** The manifest sets no
  `screenOrientation`, so a phone in landscape gives a window about
  360 dp tall.
- **The art stands as it is.** `core:designsystem/src/main/res/drawable`
  holds 77 `designsystem_place_*` files (7 places × levels 0 to 10),
  7 `designsystem_word_*` and 3 `designsystem_waste_*`.
- **Settings has no reminder controls yet.** Settings draws the scaffold
  language and no reminder control. `MyGameSwitchRow` and
  `MyGameTimeField` are used only inside `core:designsystem` and its
  tests, and #1148 draws them. Settings and News are reached by a
  `MyGameTextLink` on the Report.
- **The web is parked** (android-focus). `apps/web/src/design/tokens.ts`
  is the source that `pnpm --filter @mygame/web tokens` writes
  `core:designsystem` from, and `designSystemDriftsOf.test.ts` fails on a
  drift (ADR 043, *Web and Android*).

## Decision

### The accent

**One accent pair, `go` and `on-go`, which has one job: the way on.**
`go` fills the one green button on a screen and the dot that marks the
next step's place. Nothing else is green: no grade, no resource, no right
answer. ADR 043's rules still hold. Hue is identity, never meaning. Right
and wrong are ink. After a wrong answer the *Next* button is green too,
because green marks the way on, not the verdict.

| Token | Light | Dark |
|---|---|---|
| `go` | `#0b6b47` | `#5fd6a0` |
| `on-go` | `#ffffff` | `#06231a` |

The values are board B's. `go-soft` is dropped, since no screen on the
board uses it (YAGNI). The new pairs, computed with the WCAG 2.2 formula
`tokens.test.ts` uses, on trunk's surfaces:

| Pair | Used as | Light | Dark |
|---|---|---|---|
| `on-go` on `go` | text, the button's label and its count | 6.55 | 9.19 |
| `go` on `surface-raised` | boundary, the button on the dock | 6.28 | 9.24 |
| `go` on `surface` | graphic, the next step's dot on the strip | 5.90 | 10.13 |
| `go` on `surface-sunken` | boundary, the button on a sunken ground | 5.30 | 7.85 |

None is under its floor. The board printed 6.55 and 9.45 for `go` on
raised, against its own `#ffffff` and `#1c1b22`. On trunk's
`surface-raised` the figures are 6.28 and 9.24.

**The focus ring never sits on green.** `focus` on `go` is 2.80:1 in
light and 1.63:1 in dark. So the ring is drawn outside the button's edge,
with a gap, on the dock's ground. There `focus` on `surface-raised` reads
17.56 and 15.07, as ADR 043 already measured for the pill on paper.

**The neutrals, type and spacing stay trunk's.** Board B's neutrals are
not adopted: they are sample values, and replacing them would recolor the
parked web for no gain a player would see. Three more board values are
not adopted either, each for a reason:

- **The word stays 44.** The board draws the word at 48. ADR 043's type
  check measured *I*, *l* and the other pairs at 44/800, and its
  device-check bar holds there.
- **`meta` stays uppercase.** The board says *No uppercase style*. On
  Android the town home's header sets the town's name in `title`, as the
  board draws it, and `meta` keeps the section labels it already sets.
- **The gutter stays 20.** It stays `spacing[5]`.

**Corners are soft rectangles on Android.** The go button and the
outlined door take `radii.md`, 16, where board B draws 20. The dock's top
corners take `radii.lg`, 28, where the board draws 32. No radius token is
added or changed, and `pill` stays for the web until the web adopts this
look.

### One source while the web is parked

**`tokens.ts` gains `go` and `on-go`, and the web draws neither yet.**
The generator writes both into `MyGameColors`. `tokens.test.ts` and
`MyGameColorsContrastTest` declare the four pairs above. The web's
`action` and `on-action` keep their ink values, so every web screen looks
exactly as it does today.

On Android, only `MyGameButton` and the go button's count change: they
draw `go` and `on-go`. Android reads `action` in other places too, and
those stay ink, because none of them is the way on:

- **The tracks:** `MyGameTrack`'s previews, the school's learning load
  (`SchoolScreen.kt`), the lesson slot (`LessonSlotSection.kt`), the
  building work (`BuildingWorkSection.kt`), the office
  (`OfficeSection.kt`), the review's progress (`ReviewScreen.kt`) and
  placement's progress (`AskingProgress.kt`).
- **The links and the header:** `MyGameTextLink` and `AuthHeader.kt`.
- **The choices:** the chosen choice's edge and its dot in
  `MyGameChoiceRow`.
- **The switch:** `MyGameSwitchRow`.
- **The badge:** `MyGamePill`'s badge, which takes its colors from the
  button it sits on. On the go button it is the figure in `go` on an
  `on-go` disc. On an outlined button it stays `on-action` on `action`.

The tradeoff: for as long as the web is parked, the source holds two
tokens the web does not draw. That is cheaper than either alternative
under *Considered options*. Changing `action`'s value would repaint every
read listed above, and the parked web with them, with no ticket and no
screenshots. Forking the values into Android would break the drift test
ADR 043 built. The web adopts Main Street in its own ticket, filed with
the others and left out of `ready-for-agent` while the web is parked.
That ticket moves the web's primary button to `go`. Each token keeps a
job of its own and nothing reads both pairs to bridge them, so this is
not a shim.

### The dock

**Every signed-in screen ends in the dock, fixed at the foot, except
naming the town.** A player with no town has no next step, so that
screen keeps its form and its green submit in the flow. The dock is
`MyGameDock` in `core:designsystem`: a `surface-raised` sheet with a
`line` hairline on top and `lg` top corners. It holds three things, in
this order:

1. **The line.**
   - *What is next* (`town_next_title`).
   - The server's line for the step (*Reviews due: 4*). On a `caughtUp`
     step with a goal it is the goal's line instead, as board B draws
     *Goal 1 of 3: School, level 3*.
   - The step's countdown, when it has one: `NextStepSection`'s
     `NextStepCountdown`, *Lesson 3 ready in* or *Next review:*.
   - The scaffold line under the line when the chrome phase gives one
     (`MyGameLabel`).
2. **The go button.** One `go` button at `minHeights.action`, 60, full
   width. A count rides inside it, as on board B: the figure in `go` on
   an `on-go` disc, the first pair above reversed. A refused send, such
   as today's `LessonStartAnswer`, reads in the dock right above the
   button that sent it.
3. **One door, at most.** One outlined door at `minHeights.secondary`,
   52. On the town home the door is *Report*. On every other screen it
   is *Town*, which replaces the header's back link as the way home.

**One read feeds the dock.** The dock draws `TownStatusViewModel`'s town
read, on every screen, and nothing else. `TownStatusUiState` gains the
dock's state: the step's card and its countdown, or loading, or refused.
The Report's body keeps its own `report()` read. When a screen's own
answer can change the step, the screen asks the town status to read
again, as the web's `/reviews` reads the town again after each answer.
That covers a review answered, the news closed and a lesson started, so
the dock never mixes two reads.

**While loading, and after a refusal.**
- **Loading.** While the town read loads, the line is a `MyGameSkeleton`
  of its height, and the go button is busy with its `busyDescription`,
  in place.
- **Refused.** A refused read puts the refusal's line in the line, and
  the go button reads *Try again* (`town_try_again`) and reads again.
- **The door.** In both states the door still works.

**What the go button does, by screen.** The server's `nextStep` decides
the button everywhere except a task screen, so the button never shows
anything the server did not answer (N1):

| Screen | The line | The go button | The door |
|---|---|---|---|
| Town home | the next step | the next step's action, as `NextStepSection` maps it today | *Report* |
| School, Report, News, Map, Settings | the next step | the same, unless it points at this screen (below) | *Town* |
| Review, word reading, placement, holdout check | the task's progress | the task's way on: *Check*, *Next*, *Next word* | *Town* |

**A step that points at the screen it is on acts in place, or waits.**
Three cases exist on trunk, and the rule holds for any later one:

| Screen | Step's action | The go button |
|---|---|---|
| Report | `GoToReport` (`caughtUp`) | blocked, its reason the step's countdown (*Next review: …*) or *No reviews due now.*; a tap sends nothing |
| School | `Study(number)` | *Study lesson N · 5:00*, the school's own study for that lesson (`SchoolIntent.StudyTapped`) |
| School | `ReadWords(null)` (a running lesson the read does not hold) | blocked, its reason the step's line, *Studying*; a tap sends nothing |

A blocked go button stays in place, stays focusable and is announced
with its reason (S22), and it is never `disabled`.

On a task screen the button never leaves the dock. While the task has
nothing to send yet, as in a recognition before a choice, the button
stays in place, marked blocked with its reason. On the review the
verdict draws in the dock above the button, in `ink` with its icon
(ADR 043). After the last card the button becomes the next step. So the
way to learning is never more than one tap away, which is the
onboarding-first rule.

**What the button becomes, call site by call site.** `MyGameButton`
draws `go`, so each of trunk's 24 feature call sites either moves into
the dock, turns outlined (`MyGameOutlinedButton`) or stays green in the
flow of a screen with no dock:

| Call site | Becomes |
|---|---|
| `NextStepSection.kt:49`, `SchoolNextStep.kt:42`, `ReportScreen.kt:169` | the dock's go button, the next step |
| `ShownLesson.kt:105` (the lead lesson's study) | outlined; the dock's go button carries the step's lesson by the rule above |
| `ShownLesson.kt:134` (`ReadWordsPill`) | outlined; the dock's `ReadWords` step opens the same words |
| `ReviewScreen.kt:169` (*Next*), `ReviewScreen.kt:180` (*Check*) | the dock's go button, the task's way on |
| `ReviewEnd.kt:48` (*Read the words*) | the dock's go button, which after the last card is the next step |
| `ReviewEnd.kt:68` (*Back to your town*) | gone: the dock's *Town* door |
| `LessonWordsScreen.kt:287` (`InkPill`) | the dock's go button, the task's way on |
| `PlacementAsking.kt:89`, `PlacementAsking.kt:99`, `HoldoutCheckAsking.kt:75`, `HoldoutCheckAsking.kt:85` | the dock's go button, the task's way on |
| `HoldoutCheckDue.kt:38` (*Start the check*) | the dock's go button, the task's way in |
| `PlacementResult.kt:40`, `HoldoutCheckScreen.kt:112` (*to town*) | gone: the dock's go button is the next step and its door is *Town* |
| `PlacementOffered.kt:37` (the placement offer) | outlined, on the school's page (*The pager*) |
| `TeamFormCard.kt:70` (the map's *Send*) | outlined; the map's dock carries the next step |
| `NamingSection.kt:87`, `NamingSection.kt:95` | green in the flow; naming the town has no dock |
| `SignInScreen.kt:110`, `SignUpScreen.kt:101`, `ForgotPasswordScreen.kt:80` | green in the flow; the guest screens have no dock |

The preview in `MyGameLabel.kt` follows `MyGameButton`. So a screen
draws at most one go button, and a test on each screen says so, the way
ADR 043's tests count one ink pill.

**With TalkBack.**

- The dock's line is a heading. The go button's accessible name is its
  label followed by the line, *Start the reviews, Reviews due: 4*, and
  the count's disc is hidden from TalkBack. A blocked button also reads
  its reason as its description.
- **Reading order.** On the town home and every other non-task screen,
  TalkBack reaches the dock right after the header, through
  `isTraversalGroup` and `traversalIndex`. A player who cannot see the
  screen meets what to do next first, as ADR 042 puts the next step
  first. On a task screen the dock comes after the card, since the
  answer comes first.
- **Announcements.** The line is a polite `liveRegion` that speaks only
  when the step changes between two reads, never on the first draw and
  never on a repaint. Today the next step has no live region.
- **The street strip.** Each of the seven places is a tab with `Role.Tab`
  and its selected state. Its name is the place and its level, and the
  next step's place adds *your next step*, so the green dot is never the
  only signal. The strip is TalkBack's way between places. The pager's
  own swipe is not relied on.

**When the dock is too tall.** The dock may take at most half of the
window's height. Past that, the dock folds:

- **Folded.** It keeps the go button alone, with its whole label, and
  the line and the door move to the top of the scrolling area, under the
  header. TalkBack still reaches the line first, then the button.
- **When it folds.** At font scale 2.0 on a phone, in landscape (a
  window about 360 dp tall), and in split screen.
- **With the keyboard open.**
  - On a task screen, the folded dock rides above the keyboard, since
    the go button there is the answer's *Check*.
  - On any other screen, the dock hides while the keyboard is open, as on
    the map's team form, and comes back when it closes. The screen's own
    form actions sit in its content.
- **Never.** The go button's label is never cut, and the dock itself
  never scrolls.

**At font scale 2.0.**

- The go button keeps the full width. Its label wraps over as many lines
  as it needs, and the door drops under it, as board B notes.
- Today's `MyGamePillAtLargeFontTest` already holds the ink pill at 1.5
  and 2.0. The dock's tests hold the go button, its count, the door and
  the fold at the same scales.
- **An estimate, to be measured by the ticket.** The longest Spanish
  line, *Palabras que vuelven: banda {band}, grupo {number}*, and the
  longest action, *Estudiar las palabras que vuelven* (33 characters),
  together put the unfolded dock near 400 dp. That is under half of a
  915 dp phone, and over half of the 360 × 640 dp window that
  `SchoolPathTest` uses.
- **The bar.** On that window at 2.0 the dock folds, and the go button's
  whole label is on screen without scrolling. In landscape at font
  scale 1.0 the same holds.

**In long Spanish strings.** The catalog's longest next-step strings are
the ones named above, and `town_next_holdout_check` reads *Prueba de
palabras de la banda {band}*. They wrap and never clip. Board B's
*Ya tienes las palabras para el nivel 3.* is a sample, not a catalog
string, so no screen uses it.

### The pager

**The town home is Main Street: seven pages, one place each.** The pages
come in the hue order of ADR 043: homes, farm, school, office, factory,
power station, storage. Every page draws the same parts:

- **The header.** The town's name and label in `title`, *Place 3 of 7*
  (a new catalog key), and under them, on every page, the season line
  with its countdown (`TownUiState.SeasonLine`) and the running lesson's
  time.
- **The art.** The place's silhouette, large, from the 77 drawables at
  its level, standing on an `ink` line.
- **The name and level.** The place's name in `display` and *Level N* in
  `title`.
- **The words.** The words the next level needs, from
  `Building.next?.wordsNeeded`, as a line and a segmented track. A level
  that needs none shows no words line.
- **The work.** Whatever belongs to that place.

**At the top level** `next` is null, so the page reads *Top level*
(`town_top_level`) under the name, with no words line, no cost and no
build action. The art shows all ten windows.

The street strip sits under the page: seven silhouettes at `control`
height, 48, each a tab. The dock sits under the strip.

**What each page carries.** Every part of today's home lands somewhere:

| Today's home | Where it goes |
|---|---|
| `PlacesSection`'s row for a place: level, effect, cost, its build action | that place's page; the build action is an outlined button, and a shortfall says so in words |
| `BuildingWorkSection`: the slot and the waiting list | the slot on the page of the place in work, each waiting entry on its own place's page, each with its stop; the strip marks the place in work with the clock icon and says so in its tab's name |
| `StocksSection`'s stocks | each producer's page shows its stock (farm food, factory material, power station power); storage's page shows all four with their capacities, money and the tax among them; homes' page shows the people |
| `StocksSection`'s season row (S8) | the header of every page, as above, with the build mark (`town_season_build_mark`) on the page of the place in work |
| `NextStepSection`'s line, countdown, button and `LessonStartAnswer` | the dock |
| `NextStepSection`'s goal state (`GoalState`: in work, what is missing, or ready) and its *Close the goal* text button | the goal's line in the dock; the goal's state and its close on the goal building's page, which is where the pager opens on that step |
| `TownScreen`'s `placement()` slot, the placement offer (`PlacementOfferRoute`) | the school's page, under the school's own parts, with its start outlined |
| `OfficeSection` and `MapRow` | the office's page, with *Go to the map* as a text link |
| `TownDoors`, `TownSkyline` | gone: the dock holds the door, and the strip is the skyline, with the skyline's built count in the strip's name |
| `TipNote`s | on the page of the place they talk about; the seasons and the full store on storage's page, the people on homes' page, the office and the jobs on the office's page, the waiting list on the page of the place in work |

**Where the pager opens.** It opens on the next step's place:

| Step | Opens on |
|---|---|
| `caughtUp` with a goal | the goal's building |
| `caughtUp` with no goal | the school |
| `lessonRunning`, with or without a goal | the school |
| `reviews`, `holdoutCheck`, `releasedLesson`, `lessonToStudy` | the school |

On trunk a goal rides on two steps, `CaughtUp(goal)` and
`LessonRunning(goal)` (`NextStep.kt`).

- **`caughtUp` with a goal.** The building is the step, so the goal's
  line is the dock's line and the pager opens on its building.
- **`lessonRunning` with a goal.** The way on is the running lesson's
  words. So the dock's line stays *Studying* with its countdown, the
  pager opens on the school, and the goal's line, state and close sit on
  the goal building's page, one swipe or one tab away.

The school is where learning lives.

This mapping only decides how the server's answer is shown, so the
client decides nothing about the game. The page opens once, when the
player comes to the town home. A later read never moves the pager out
from under the player, just as a review card is held from the first
touch. The page the player is on is kept as UI state with
`rememberSaveable` and is never sent to the server.

**At font scale 2.0 the art shrinks before any text does.** It shrinks
down to `sizes.thumbnail`, 96. Then the page scrolls on its own, and the
strip and the dock stay put, or the dock folds as above.

### Settings and the study reminder

**Settings stays where it is, a row on the Report, and gains the dock.**
The Report ends in three hairline rows, as on board B: *Town News*,
ADR 046's reminder offer and *Settings*. The offer follows ADR 046 and
#1148 to the letter: it shows only in the Report's nothing-due state,
and only while the reminder is off. Board B draws it with 4 reviews
due, and ADR 046 holds over the board here. The switch and the time are
#1148's, in Settings, and this ADR changes neither. #1148 can land
before or after the dock, since Settings keeps its body.

### What keeps the current look, and the order

These screens keep ADR 043's look in their body and change only in the
button and the dock:

- the guest screens;
- naming the town;
- Settings;
- News;
- the map;
- placement and the holdout check.

The order of the tickets, each one its own slice:

1. **The tokens.** `go` and `on-go` in `tokens.ts`, `tokens.test.ts` with
   the four pairs, `pnpm --filter @mygame/web tokens`, and
   `MyGameColorsContrastTest`. No web screen changes. This is the one
   ticket that touches `apps/web`, and the gate forces it.
2. **The parts, in `core:designsystem`.**
   - `MyGameButton` draws `go` at `md`.
   - `MyGameOutlinedButton` is drawn at `md`.
   - `MyGameDock`, `MyGameStreetStrip` and the place page are new, each
     with previews at font scales 1, 1.5 and 2.0 and in dark, and with
     the TalkBack semantics above in tests.
3. **The frame.** `FramedScreen` draws the dock from
   `TownStatusViewModel`'s read, and `TownStatusUiState` gains the
   dock's state with its loading and refused states. The back link
   leaves the header for the dock's *Town* door. The school and the
   Report move their primary into the dock, with the rule for a step
   that points at its own screen. The map's *Send* and the school's
   lesson actions turn outlined. The fold is drawn, and the dock hides
   with the keyboard.
4. **The town home rebuilt as the pager.** Every row of *What each page
   carries* and of *Where the pager opens* gets a test that says where it
   went. `TownScreen`'s tests are rewritten, not adapted.
5. **The task screens.** On the review, the word reading, placement and
   the holdout check, the way on and the verdict move into the dock.
   #1112's TalkBack walk runs after this ticket, so it walks the new
   screens.
6. **The Report's rows**, with the offer of ADR 046.
7. **The web adopts Main Street**, parked as said above.

Each Android ticket owes the Android leg of the gate and emulator
screenshots in light, dark and at font scale 2.0, with one in Spanish
(`.claude/rules/verification.md`).

## Considered options

- **A, Paper.** Close to ADR 043, at the lowest cost. The owner rejected
  it on the canvas. The next step there is a peach block and an ink
  pill, which a long screen can still push off the first view.
- **C, Ledger.** One dense table with no scroll, good for a returning
  player and weaker for a new one. It brings back the bottom bar and
  Atkinson, which would take a new ADR against ADR 043's type check.
  Rejected.
- **D, Lit Windows.** The strongest image, but it needs a second art
  pipeline for the dark skyline and its windows, and it costs the most
  to build. Rejected.
- **Change `action`'s value to green instead of adding `go`.** It is one
  token and no new name, and the web would turn green for free. But
  `action` also colors about a dozen ink reads on Android, among them the
  tracks, the text link and the switch, and the web's due-count badge.
  All of them would turn green, which breaks green for the way on alone,
  and the parked web would change with no ticket and no screenshots.
- **Fork the tokens into Android while the web is parked.** It leaves
  the web untouched, but it ends the single source and the drift test
  ADR 043 built, and someone has to merge them back later.
- **Adopt board B's neutrals, its 48 word and its unit-free type.** This
  is closest to the board. But it recolors and resizes the parked web,
  and it undoes ADR 043's type measurement for values #1160 itself calls
  samples.
- **A dock on the town home alone.** Cheaper. But then the green button
  would not be in the same spot on every screen, which is why the owner
  picked B.
- **Open the pager on the last page seen.** It keeps the player's place.
  But a player coming back meets yesterday's place, not the next step,
  and ADR 042 puts the next step first.
- **Let a dock that is too tall scroll inside itself.** It is the
  simplest rule. But it would put the go button's label behind a scroll
  inside a fixed sheet, so folding to the button alone is chosen.
- **Hide the go button when the step points at its own screen.** The
  dock would be emptier. But the button would leave its spot, against
  ADR 043's rule that a blocked control stays in the layout, so a
  blocked button with its reason is chosen.
- **Keep `go-soft` from the board.** No screen draws it, so it would be a
  token with no user.

## Consequences

**Expensive to reverse.**

- The town home is rebuilt, not restyled, and `TownScreen`'s tests are
  rewritten.
- The overview shrinks to a 48 dp strip, so comparing two places takes a
  swipe or a tab. Board B names this as its first con.
- Android and the web differ in their primary button's color and shape
  until the web's ticket lands. The values still come from one source,
  and each client builds its own components (`ui-components.md`).

**What stands, verified.**

- **Art.** The 77 place drawables, the word and waste drawables, and
  the art bible and catalog do not change.
- **Type, spacing and the other tokens.** Schibsted Grotesk and every
  type style, spacing, durations and every other token stay as they are.
- **Rules.** `ui-components.md` already holds every rule the dock obeys:
  one token source, touch targets, a blocked control kept in the layout,
  and meaning never by color alone.
- **The PRD.** No row changes:
  - **S4** stands, since a place keeps its silhouette.
  - **N8** stands, since every new pair passes.
  - **S3** stands: the Report's row still opens `/news`.
  - **M8** stands: the pages are the town home. The stocks show on
    their pages, the slot shows on its place's page and is marked on the
    strip, and the repaint cadence does not change.
  - **S8** stands: the season and its countdown show in the header of
    every page.
  - **S22** stands: one town read still feeds the stocks and slots on
    the town home and the school. A blocked action, the go button
    included, stays focusable, is announced with its reason and still
    sends where it has something to send. The goal and the tips are
    still shown on the town home, on its pages.
- **ADR 046.** It stands as written.
- **`CONTEXT.md`.** No term enters it. *Dock*, *pager* and *street
  strip* are design words, not game ones, as ADR 043 ruled for *block*
  and *door*.

**What this ADR amends:**

| Row | Change |
|---|---|
| ADR 043, *The look*, lines 51–53 | on Android, one accent, `go`, for the way on |
| ADR 043, *One ink pill per screen*, lines 65–75 | on Android the one filled control is the go button, in the dock on every signed-in screen but naming the town |
| ADR 043, *The tokens*, lines 96–101 | 22 color tokens, 33 pairs |
| ADR 043, *What leaves*, line 184 | the badge takes its button's pair: `go` on `on-go` on the go button, `on-action` on `action` elsewhere |
| ADR 043, *The other families*, lines 189–192 | Android's buttons at `md`, the dock at `lg`; no token changes |
| ADR 043, *Blocks*, lines 319–324 | on Android the town home's next-step block and its stack leave for the dock; a block holds no button, and the school's, the word's and the review's blocks stand |
| ADR 043, *Places*, lines 370–374 | on Android the street strip replaces the skyline and carries its built count in the strip's name; a place's silhouette sits on its page, not on a row |
| ADR 043, *The screens*, lines 328–357 | on Android: the dock's door in place of the two doors and the back link; the town home is the pager; the school, the review and the Report move their primary into the dock |
| ADR 043, *Web and Android*, lines 470–478 | the Color row reads 22 tokens; the Navigation row reads the dock |

The lines are ADR 043's as they stand at `a1aae9a4`, and its new
amendment section points back here.

## References

- The canvas (https://claude.ai/artifact/USvWmDMuKo1wfFdfumuWez, #1160),
  boards `B-Spec`, `B-Home`, `B-Review`, `B-Report` and `B-Home-Dark`.
  Where the canvas and this ADR differ, this ADR holds: the neutrals, the
  word's size, `go-soft`, the radii, the gutter, where the reminder offer
  shows and the sample Spanish line.
- ADR 042 (the next step first), ADR 043 (the look), ADR 045 (the words
  a level needs) and ADR 046 (the study reminder).
- `.claude/rules/ui-components.md`, `.claude/rules/android-architecture.md`,
  `docs/PRODUCT_REQUIREMENTS.md` (N1, N8, S3, S4).
