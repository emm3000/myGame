---
status: proposed
date: 2026-11-19
---
# The compact dock on Android

## Context

ADR 047 pinned a dock to the foot of every signed-in screen: a line that
says the next step, the one go, and one door. ADR 050 then gave every
tappable thing a role and proposed that the dock keep its door, its
countdown and its refusal. The owner's feedback on the result is that
the dock "takes too much space", with one question: "what about a
floating button?" (#1294).

### How the numbers were taken

Every number below comes from one of four sources, named where it is
used.

- **Screenshots.** The files on `origin/assets/1254-visual-check`,
  `origin/assets/1255-visual-check` and `origin/assets/1267-visual-check`,
  read with `git show`, and their pixels read with a script (Python,
  PIL). The dock's bottom is the last row whose pixel 1.2 dp from the
  left edge is `surface-raised` (`#FBFAF9`, 3 per channel of tolerance).
  The dock's top is the first row above it whose pixels from 30 dp to 30
  dp short of the right edge are all `line` (`#DAD9D8`, 4 of tolerance):
  the dock's top hairline, which no card's hairline spans. Pixels become
  dp by the capture's density: 1080 by 2400 at 2.625 is 411.4 by 914.3
  dp, and 720 by 1280 at 2.0 is 360 by 640 dp.
- **Trunk's components under Robolectric.** A throwaway test in
  `core/designsystem`, not part of this change, with the harness of
  `MyGameDockMeasureTest` (`RobolectricTestRunner`, native graphics,
  `@Config` qualifiers and `fontScale`). Each component is drawn with
  the catalog's strings inside the dock's side padding (`step5`), and its
  height is `getBoundsInRoot()`, in dp.
- **Contrast.** The WCAG relative-luminance ratio, computed from the hex
  values in `MyGameColors.kt`.
- **Sums.** A number that is a sum of the above says so.

### What trunk's dock takes

At the default size (411.4 by 914.3 dp, font scale 1.0), measured on the
screenshots:

| Screen and step | File | Dock |
|---|---|---|
| Town home: goal line, next review, *Go to the Report*, door beside | `assets/1254-visual-check`, `eed7f59f-school-default.png` | 299.4 dp, 32.8% |
| School: *Lección 1*, *5 palabras*, go, door dropped under | `assets/1255-visual-check`, `1255-910a90ad-state1-default.png` | 271.2 dp, 29.7% |
| School: cap line, goal, countdown, door beside | `1255-910a90ad-state3-default.png` | 259.8 dp, 28.4% |
| School: *Repasos pendientes: 12*, go with its count, door beside | `1255-910a90ad-state2-default.png` | 166.9 dp, 18.2% |

`eed7f59f-school-default.png` shows the town home, on the farm's page,
and not the school its name says.

The pieces, by the Robolectric measure at 411 dp wide, with the English
line over the Spanish one: the eyebrow and the step line 93 dp, the
countdown 86 dp, the go 60 dp for every label in the catalog, a refusal
44 dp. The sheet adds `step5` (20 dp) on each side and `step3` (12 dp)
between pieces (`MyGameDock.kt:109`).

At 360 by 640 with font scale 2.0 the dock is folded: it keeps the go
alone, and the line, the countdown and the door move to the top of the
scroll (ADR 047). Measured on the screenshots, the folded dock is 100 dp
(15.6%) with a one-line label, 126.5 dp (19.8%) with *Go to the Report*
over *Ir al informe* (`eed7f59f-school-360x640-font2-folded.png`), and
133 dp (20.8%) on the school
(`1255-910a90ad-state1-small.png`). A Robolectric capture on
`assets/1267-visual-check` shows 173 dp (27.0%) with *Estudiar las
palabras que vuelven* on three lines. Each is the go's height plus 40
dp.

What the fold moves is larger than what it keeps. By the Robolectric
measure at 360 dp wide and font scale 2.0, the line is 239 dp and the
countdown 278 dp in both languages. Together they are 517 dp at the top
of a scroll whose window is 640 dp tall.

Two facts stay outside this ADR and are recorded so that nobody expects
the dock to fix them. Under the dock, the email banner and the gesture
bar take 73.1 dp (8.0%) at the default size and 115 dp (18.0%) at 360 by
640 with font scale 2.0, measured on the same screenshots. The banner is
drawn only for a player whose email is not confirmed
(`VerificationBannerViewModel.kt:69`).

### What the dock repeats

Most of what the dock draws beside the go is drawn again by the screen
or by the screen the go opens.

- The go's own label restates the line: *Reviews due: 12* over *Start
  the reviews* with a 12 on it, *Lesson 3* over *Study lesson 3*.
- The countdown for a running lesson uses `town_next_lesson_ready_in`,
  the string the status strip draws on every signed-in screen while a
  lesson runs (`TownStatus.kt:69`).
- The countdown to the next review is drawn by the Report's *nothing
  due* card (`ReportScreen.kt`), and *Go to the Report* is the go that
  shows it.
- On a task screen the placement and the holdout check draw the band and
  *Word 3 of 12* in the body (`AskingProgress.kt`) and again in the
  dock's line.
- Settings draws two ways to the town: the dock's door and *Back to your
  town* (`SettingsScreen.kt:84`).

The goal line is the exception: outside the dock it is drawn only on the
goal building's own page (`TownPage.kt:93`).

## Decision

**The dock is the go.** It stays pinned at the foot of every signed-in
screen, as ADR 047 decided, and it carries one control: the go button,
full width, at `action` height. Above the go it draws one thing, only
while there is one: the notice, which is the refusal of the go's last
tap or a task's verdict. The line, the countdown and the door leave.

The sheet keeps its `surface-raised` ground, its top hairline, its `lg`
top corners and its `step5` side padding. Its padding above and below
becomes `step3`.

### The dock's maximum height

| Window | State | Dock | Source |
|---|---|---|---|
| 411.4 by 914.3, font scale 1.0 | at rest, every label in the catalog | **84 dp, 9.2%** | go 60 + 2 × 12 |
| the same | while a refusal shows | **140 dp, 15.3%** | 12 + refusal 44 + 12 + go 60 + 12 |
| 360 by 640, font scale 2.0 | English over Spanish, two lines | 110 dp, 17.2% | go 86 + 24 |
| the same | *Study the returning words*, or *Start the reviews* with a one-digit count | 117 dp, 18.3% | go 93 + 24 |
| the same | *Estudiar las palabras que vuelven*, three lines | 157 dp, 24.5% | go 133 + 24 |
| the same | *Start the reviews* over *Empezar los repasos* with a two-digit count | **191 dp, 29.8%** | go 167 + 24 |

The go heights are the Robolectric measure. The last row is the tallest
go in the catalog: the count drops under a two-line label
(`MyGamePill.kt`'s `LabelAndCount`). Trunk's folded dock draws the same
four gos at 126, 133, 173 and 207 dp, the last being a sum (167 + 40)
and the others matching the screenshots.

At the default size the dock goes from 299.4 dp to 84 dp on the town
home. At 360 by 640 with font scale 2.0 the dock itself returns 16 dp;
the gain there is the 517 dp that no longer open the scroll.

ADR 047's fold limit stands, half the window's height over the font
scale: 457 dp at the default size, 160 dp at 360 by 640 with font scale
2.0. What folds is now the notice alone. The notice is drawn in the dock
while the dock with it stays within the limit. Past the limit it is
drawn where trunk's fold draws it today, at the top of the scroll on a
home or place screen and at the end of the content on a task screen, and
it scrolls into view when it appears. At 360 by 640 with font scale 2.0
a refusal alone is 160 to 202 dp, so it never draws in the dock there,
and the dock's maximum is the go's.

### What leaves the dock, and where each piece goes

| Piece on trunk | Where it goes |
|---|---|
| The eyebrow, *What is next* | Not drawn by the dock. The school's lead block draws it (ADR 050). The key stays |
| The step line | Not drawn. The go's label names the step, with the count on the go. The line stays in the go's spoken name, which joins the label and the line today (`MyGameDock.kt`) |
| The goal line, on a step that has caught up | The town home's page header, under the season line, on every page but the goal building's, which already draws it |
| The countdown to the next review | The Report's *nothing due* card, where it is drawn today. The town home does not draw it |
| The countdown of a running lesson | The status strip, where it is drawn today |
| The cap's line and the time the next word is due | The school's learning card (ADR 050, slice 8) |
| The door to the town, on a place screen | The frame's header, as the back link a task screen has (`FramedScreen.kt:164`). The header is 48 dp tall today with an empty start side, so the door costs no height at the default size |
| The door to the Report, on the town home | A `MyGameNavRow` in the page header, under the season line; while the page header is not drawn, where trunk draws the folded dock's top (`TownScreen.kt:91`). Not drawn when the go is *Go to the Report* |
| The refusal | Stays, above the go, within the limit above |
| A task's verdict and alerts | Stay, above the go, within the limit above |
| A task's line: its title and its position | The body. The placement and the holdout check draw both already; the review draws its title and its track and gains *Reviews due: N*; the lesson's words gain *Word N of M* |
| A task's countdown (the lesson's words, while it waits for the lesson's end) | The body's `RunningTime`, which `LessonWordsScreen.kt:125` withholds today exactly while the dock draws it |
| The loading skeleton line | Not drawn. The go is busy, as it is today |
| The line of a status read that was refused | The notice, above *Try again* |

The back link opens the town with `openTown`, as the dock's door does.
The system back button is unchanged: it pops one entry, which from News
and Settings is the Report (`Navigator.kt:22`).

### ADR 050's rules

- **One go per screen.** Unchanged: the dock's go, the only `go` fill.
- **One fact, one place.** Stronger: the dock states no fact. Each one
  it stated keeps the place in the table above.
- **Each role's cue.** The go keeps the `go` fill. The door to the town
  is the back link, with the back chevron before its label. The door to
  the Report is a nav row, with the forward chevron at its end. The goal
  line is static text with no outline.

### The three options, measured

The floating button is an extended one, with its label always visible,
since ADR 050 gives a go a visible label. Its width is the label's
natural width in `button` style, by the Robolectric measure, plus
`step6` on each side.

| | Compact pinned dock | Floating button | Go in the flow |
|---|---|---|---|
| Share of the screen, default | 84 dp, 9.2%, reserved | none reserved; it floats over the last 76 dp (8.3%) | none reserved; 60 dp inside the scroll |
| Content under it while scrolling | none: the dock takes layout space (`FramedScreen.kt`) | every row passes behind it, and its end side is where a nav row's chevron, a switch and the time field sit | none |
| Space at the end of the scroll | 84 dp | 92 dp of end padding (16 + 60 + 16), or the last row stays covered | none |
| Width, default | 371 of 411 dp, centered | 192 dp for *Go to the Report*, 278 dp for *Study the returning words*, 345 dp for *Estudiar las palabras que vuelven* | the content's width |
| One-handed reach | the same distance from either thumb | end side: at 192 dp wide its near edge is 203 dp from the left edge, at the midline | at the top of the content it is the farthest band; lower down it scrolls away |
| 360 by 640, font scale 2.0 | 110 to 191 dp | the label needs 284 to 543 dp and 328 are free, so it is a full-width bar 86 to 167 dp tall with no ground, and it needs 118 to 199 dp of end padding | 86 to 167 dp inside the scroll, out of the first view |
| The line | gone: label, header and body | gone the same way | could stay beside it |
| The countdown | gone: strip, Report | gone the same way | could stay beside it |
| The refusal and a task's verdict | above the go, on the sheet | no ground: a second floating surface, or far from the thumb | beside it |
| A go that waits (dashed, on `surface-sunken`) | on the sheet | floats over whatever is behind | in place |
| 48 dp target | 60 dp | 60 dp | 60 dp |
| The keyboard | hidden on a home or place screen, above it on a task (ADR 047) | floats over the field's screen | scrolls under it |
| Same place on every screen | yes | yes | no |

The compact dock is recommended.

**The floating button is rejected** for four measured reasons.

1. It returns nothing the compact dock does not. It reserves no space,
   but a screen must scroll its last row clear, which takes 92 dp at the
   default size against the dock's 84.
2. It covers what the roles put at a row's end. ADR 050 draws a door's
   chevron at the end of a nav row; the switch and the time field's
   buttons sit there too.
3. It stops floating at a large font. At 360 by 640 with font scale 2.0
   no label in one language fits beside free space, so the button is a
   bar across the screen, as tall as the dock's go, over the content.
4. It has no ground. ADR 043 allows no shadow, so the button's edge is
   its fill against whatever passes behind. `go` against a block is 4.23
   to 4.70 in the light theme and 1.17 to 1.30 in the dark theme, where
   3:1 is the floor for a control's edge
   (`.claude/rules/ui-components.md`). The refusal, a task's verdict and
   the waiting go have no sheet to sit on.

It keeps the one thing the owner picked the dock for in ADR 047, the
same place on every screen, and the compact dock keeps it too.

**The go in the flow stays rejected**, as in ADR 047: it leaves the
first view on a long screen (the school's scroll holds nine sections,
`SchoolScreen.kt:150`), and its place differs on every screen.

### What this ADR amends

| ADR 047 says | It becomes |
|---|---|
| *The dock*: a line, the go and one door | the go, and the notice above it while there is one |
| The door: *Report* on the town, *Town* on a place screen | a nav row in the town's page header; the back link in a place screen's header |
| The fold: the line and the door move to the top of the scroll | only the notice moves; the limit is unchanged |
| The loading dock draws a skeleton line | a busy go |
| The measure: 349 dp and 435 dp unfolded at font scale 2.0 | the heights in *The dock's maximum height* |

| ADR 050 says | It becomes |
|---|---|
| The dock's door is a label and a chevron, 60 high, at 3:1 beside the go | the dock has no door |
| "The countdown and the refusal line stay in the dock" | the refusal stays; the countdown is drawn once, outside the dock |
| The dock draws no line on a screen whose body states the step | the dock draws no line |
| The folded door is a `MyGameNavRow` at the top of the scroll | no door folds; the town's door is always a nav row |
| `MyGameHeader` holds the back link and the ring | unchanged, and now true of a place screen |

ADR 047's go, its count, its fold limit, the keyboard rule, the pager
and the street strip stand. ADR 050's five roles, its type hierarchy and
its color rules stand.

No `CONTEXT.md` term enters.

### The slices

Each is one ticket. *Trap list* is the wave skill's
(`.claude/skills/wave/SKILL.md`).

1. **The doors leave the dock.** **Trap list: yes**: the frame's header
   changes on the five place screens, and `MyGameDock`'s default on
   every screen with a door. It follows #1295, which adds `MyGameNavRow`.
   - A place screen's header draws `MyGameBackLink` with
     `navigation_town`, and it opens the town.
   - `SettingsScreen` draws no other way to the town, and `settings_back`
     is in neither catalog.
   - The town home draws *Report* as a `MyGameNavRow` under the season
     line, and above the skeleton while the page header is not drawn.
   - The town home draws no *Report* row when the go's action is
     `GoToReport`.
   - `MyGameDockDoor`, `MyGameDockActions` and `dockDoorLook` do not
     exist.
2. **The town home states the goal.** **Trap list: no** (one screen).
   - On a caught-up step with a goal, each page but the goal building's
     draws the goal line under the season line, with no outline.
   - The goal building's page draws the goal once.
   - A screen reader reads the goal line after the page's position and
     before the place's name.
3. **A task screen states its progress in its body.** **Trap list: no**
   (two screens).
   - The review draws `review_due_count` with its track.
   - The lesson's words draw `school_lesson_word_position` with their
     track.
   - The lesson's words draw the running time in the body while they
     wait for the lesson's end.
   - The placement and the holdout check draw the band and the position
     once, in `AskingProgress`.
4. **The dock is the go.** **Trap list: yes**: `MyGameDock` is drawn on
   all ten framed screens. It follows slices 1, 2 and 3.
   - `MyGameDock` draws no line and no countdown, and the go's spoken
     name still joins its label and the step.
   - `MyGameDockMeasureTest` holds 84 dp at 411 by 915 with font scale
     1.0, and 157 dp at 360 by 640 with font scale 2.0 for *Estudiar las
     palabras que vuelven*, each within 1 dp.
   - A refusal is drawn above the go at 411 by 915 with font scale 1.0,
     and at the top of the scroll, in view, at 360 by 640 with font
     scale 2.0.
   - A loading dock draws a busy go and no skeleton; a refused status
     read draws its line as the notice above *Try again*.
   - No dock and no folded top draws `town_next_title`.
5. **The school states each fact once.** **Trap list: no** (one screen).
   It follows slice 4. These are the criteria #1305 left held.
   - `StudyAction` is not drawn for the step's lesson, and is drawn for
     a selected lesson that is not the step's.
   - `ReviewsLink` does not exist.
   - With the cap full, the figure *N of M* and the time the next word
     is due each appear once on the screen.
   - While the *Studying* section shows a lesson, no other line on the
     school states that lesson's time.
6. **The finish notice's way on.** **Trap list: yes**: the status strip
   is drawn on every signed-in screen. It follows #1295.
   - The finish notice's way on (`TownStatus.kt:95`) is a `MyGameNavRow`.
   - It is not drawn when the dock's go opens the same screen.

Slices 1, 2, 3 and 6 depend on nothing here. Slice 4 follows 1, 2 and 3,
so that no sentence leaves the screen before its new place draws it.

### What becomes of ADR 050's held slices

- **Slice 6, the dock's door, is replaced.** Its first three criteria
  describe a door the dock no longer has. Its fourth, Settings and
  `settings_back`, is in slice 1 here. Its fifth, the finish notice, is
  slice 6 here, word for word.
- **Slice 4, the local-action outline, is released as written.** It
  depends on nothing here. Among its call sites, `dockDoorLook` and
  `TownDock.kt:66` are deleted by slice 1 here; if slice 4 merges first,
  the dock's door takes the new outline until then, and slice 4's
  screenshots show it.
- **Slice 8, the school, is reshaped.** The part outside the dock is
  #1305, unchanged. The held part is slice 5 here; it follows slice 4
  here in place of ADR 050's slice 6, and its criterion about the dock's
  line is covered by slice 4 here on every screen.
- **Slice 9's held line is released.** #1302 held the move of
  `MyGameCountdownLine`'s time to `title` because the dock drew the
  countdown. It depends on nothing here.
- **Slice 2's five call sites change owner.** `TownDock.kt:66` and
  `SettingsScreen.kt:84` go with slice 1 here, `TownStatus.kt:95` with
  slice 6 here, `ReviewsLink.kt:25` and `:31` with slice 5 here.
- **Slices 5 and 7 are unchanged and reach further.** The back link
  (#1300) is drawn on the five place screens once slice 1 here merges,
  and the ring's label (#1301) shares the header with it; ADR 050's rule
  for a header that does not fit one row applies.

## Considered options

- **A floating action button.** Rejected, with the measures above.
- **The go in the flow.** Rejected, as in ADR 047.
- **A compact dock that keeps the door beside the go.** Rejected. It is
  84 dp only while both labels fit one row.
  `MyGameDockMeasureTest` holds that the longest Spanish label and the
  door do not share a row at 411 by 915 with font scale 1.0, where the
  door drops under and the dock is 156 dp (84 + 60 + 12). The header has
  the room for nothing.
- **A lower go.** Rejected. `secondary` (52 dp) returns 8 dp and makes
  the one go the size of a local action.
- **Keeping the line as one row of small text over the go.** Rejected.
  It restates the go's label, and at font scale 2.0 it is the 239 dp the
  fold already has to move.

## Consequences

- At the default size the town home gets back 215 dp of its 914: the
  dock's 299.4 dp become 84 dp. The goal line takes 39 dp of the page
  header in both languages, 20 dp in English alone, by the Robolectric
  measure.
- At 360 by 640 with font scale 2.0 the dock is still 17% to 30% of the
  screen, because the go's label is never cut (ADR 047). The banner and
  the gesture bar take another 18%. A place's content does not fill that
  screen after this ADR; what changes is that the scroll opens on the
  place and not on 517 dp of line and countdown.
- A place screen's header grows from 48 dp to 65 dp at font scale 2.0
  with the back link in both languages, by the Robolectric measure.
- The band and the set of a returning lesson, and the band of a due
  check, are no longer on the dock. The school's rows state them.
- These tests are rewritten by slices 1 and 4: `MyGameDockMeasureTest`,
  `MyGameDockCountTest`, `MyGameDockTest`, `TownDockTest`,
  `TownFoldedDockTest`, the door, loading and folded-order tests of
  `DockFrameNavigationTest`, the line and countdown tests of
  `TaskDockFrameTest`, and the dock tests of the four task screens.
- The review's verdict above the go is not measured here. Slice 4 owes
  its height at both sizes.
- The tallest go is tall because its count drops under its label. A
  count that stays beside a two-line label would lower the maximum at
  360 by 640 with font scale 2.0 from 191 dp; that is not decided here.

## References

- The canvas (https://claude.ai/artifact/EtNPQqnanMYhjuFwu9NZCy, #1294):
  the town home, the school and settings, before, after and with the
  floating button, each at 412 by 915 and at 360 by 640 with font scale
  2.0, with the dock's share written on each board. Where the canvas and
  this ADR differ, this ADR holds.
- The screenshots: `origin/assets/1254-visual-check`,
  `origin/assets/1255-visual-check`, `origin/assets/1267-visual-check`.
- ADR 043 (the look): no shadows, the hairline.
- ADR 047 (Main Street): the dock, the go, the fold.
- ADR 050 (tappable roles): the five roles, one action one control, one
  fact one place.
- `.claude/rules/ui-components.md`: targets, contrast.
- `apps/android/core/designsystem`: `MyGameDock.kt`, `MyGamePill.kt`,
  `MyGameHeader.kt`, `MyGameBackLink.kt`, `MyGameDockMeasureTest.kt`.
- `apps/android/app`: `FramedScreen.kt`, `Navigator.kt`.
