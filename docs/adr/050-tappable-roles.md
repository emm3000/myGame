---
status: accepted, the dock's door, its countdown, its line and its folded door together amended by ADR 051, the go's place, one go per screen and the busy button's look by ADR 057, the door's cue by #2122
date: 2026-11-18
---
# Tappable roles and the type hierarchy on Android

## Context

The QA audit of the Android client (#1247, #1254, #1255) found that a
player cannot tell what is tappable, or what a tap will do, from the look
of a control. Each finding below is checked against trunk at `52a80c8d`.

- **Three components share one look.** `MyGameOutlinedButton` draws a
  hairline `line-strong` frame of radius `md` (`outlinedPillLook`),
  `MyGameChoiceRow` draws a hairline `line-strong` frame of radius `md`
  (`MyGameChoiceRow.kt:40`), and `MyGameCard` draws a hairline `line`
  frame of radius `lg` (`MyGameCard.kt:20`). A button, a choice and a card
  that does nothing are the same rounded rectangle.
- **A tappable row carries no cue.** The school's lesson rows are the only
  hand-rolled `.clickable` in `apps/android/feature` (`LessonRows.kt:193`).
  The row is text between hairlines. `MyGameIcons` holds `back` and no
  forward chevron.
- **A link is told from text only by its underline, and there are two
  link components.** `MyGameTextLink` draws `button` underlined in
  `action`; `MyGameTextButton` draws `label` underlined in `ink`. `action`
  equals `ink` in both themes (`#15141A` and `#F4F3F1`,
  `MyGameColors.kt`), so the two differ by 3sp and by the busy state only.
  They have 18 and 5 call sites.
- **The back link reads as an eyebrow.** `MyGameBackLink` draws its label
  through `MyGameMetaText`, the uppercase `meta` style in `ink-muted`,
  which is also the style of *What is next* above the dock's step.
- **A local action and a door share one button.** Of the 18 call sites of
  `MyGameOutlinedButton`, 15 change something and stay on the screen
  (*Build*, *Hire*, *Send*, *Stop*, *Hint*) and 3 open another screen
  (`ShownLesson.kt:120`, `TownDock.kt:66`, `TownStatus.kt:95`). The dock's
  door is the same pill at 60.
- **The type scale is flat.** Eight of the thirteen styles sit between 15
  and 20sp: `label` and `caption` at 15, `body` at 16, `gloss` and `title`
  at 17, `button` at 18, `heading` and `reading` at 20. The issue counted
  seven; the code holds eight. A section's title has three looks:
  `MyGameSectionTitle` draws `label` in `ink-muted`, the school's
  *Lessons* draws `heading`, and the settings' *Theme* and *Help language*
  draw `label` in `ink`.
- **Two dock buttons can open one screen.** `doorOf(FrameKind.Home)` is
  always the *Report* door
  (`apps/android/app/src/main/kotlin/com/emm/mygame/FramedScreen.kt:196`),
  and the go button's `GoToReport` action opens the Report too
  (`TownDock.kt:210`).
- **The ring has no label.** `MyGameRing` is a 32dp drawing with
  `Role.Image` and a spoken name. A player who sees it has no word for it.
- **The school states one fact three times.** With the learning cap full,
  the figure *Words in learning: 12 of 15* is in the blocked reason under
  the study button (`school_lesson_cap_reached`), in the learning card
  (`school_learning`) and in the dock's line (`town_next_learning_cap`).
  The step's lesson is named in the lead block, on the in-flow study
  button, in the dock's line and on the dock's go button.

ADR 043 settled that a hue is a block's identity and never a state. ADR
047 gave the one saturated color, `go`, to the way on. Neither says how a
control that is not the way on shows what it does.

## Decision

### The principle

**Shape says the role. Color never does.** Every tappable element belongs
to one of four roles, every other element is a static container, and each
role has one cue that is a shape. A grayscale screenshot keeps every cue.

### The five roles

| Role | The test | The cue |
|---|---|---|
| **Go** | It is the screen's one way on. | The **solid fill**: `go` ground, `on-go` label in `button`, height `action` (60), in the dock. A screen without a dock (the signed-out forms, the town's naming) draws it in flow. |
| **Local action** | The tap changes something and the control stays under the finger. It sends (*Build*, *Send*), it picks (a choice, a tab, a switch), or it takes text (a field). | The **closed outline**, radius `md`, no fill. |
| **Door** | The tap takes the view somewhere else and changes nothing: another screen, or another lesson at the top of the school. | The **chevron**: a way in draws the local action's closed `ink` outline with its centered `label` and a trailing forward chevron, `MyGameOutlinedDoor`, with an optional `caption` line inside the outline; a back chevron at the start of the way home. A list's rows (the school's lessons, Today's running work) stay `MyGameNavRow`. |
| **Link** | It is the quiet control set in or after a line of text, and the screen works without it: try again, send again, close a tip, sign out, the other form, the phone's settings. | The **underline**. No frame, no chevron. |
| **Static container** | It is not tappable. | **No closed frame**: a fill, a hairline above or below, or neither. Never a chevron, never an underline. |

The rules that make the cues exclusive:

- **One go per screen.** ADR 047's rule stands.
- **The outline has two weights.** A button that sends draws its outline
  in `ink` at `strokeWidths.control` (2dp), with a centered `label`, at
  height `secondary` (52). A pick or a field at rest draws a hairline in
  `line-strong`, never `line`, with its content start-aligned. A chosen
  choice keeps trunk's three marks: the `action` edge, the dot and the
  bold label.
- **A closed frame means tappable.** No static container draws a closed
  outline, at any weight or color.
- **A way to a signed-in screen is a door, never a link.** A link stays on
  the screen or leaves the game's signed-in screens (the phone's settings,
  the other signed-out form).
- **A blocked or busy button keeps trunk's look**: the dashed
  `line-strong` frame on `surface-sunken` when blocked, the hairline with
  the hourglass when busy (`MyGamePill.kt`). Both are still closed frames.
- **Every tappable element keeps a 48 by 48 target** and a visible focus
  ring, as `.claude/rules/ui-components.md` already binds.
- **A control owes 3:1 only for a boundary it draws.**
  `ui-components.md` asks 3:1 for the boundary of a control, as WCAG
  1.4.11 asks it of the visual information needed to identify one. The
  dock's door, a nav row and a link draw no boundary: each is identified
  by its label and its chevron or underline, which take the text floor of
  4.5:1 on their ground, and their target is the touch area, not a drawn
  edge. A control that does draw an outline, a local action, owes 3:1 for
  it.

One component is new: **`MyGameNavRow`**, the door's row. It draws a
`title` label at the start, an optional status in `caption` and
`ink-muted` beside it (a running lesson's *Studying*), optional `body`
and `caption` lines under it,
a trailing `MyGameIcons.forward` chevron in `ink`, a hairline under the
row, a minimum height of `secondary`, and `Role.Button`. One icon is new:
**`MyGameIcons.forward`**, the mirror of `back` (path `m9 6 6 6-6 6` on
the 24 grid, stroke `strokeWidths.mark`).

### Every design-system component, by role

Every public composable in `apps/android/core/designsystem`:

| Component | Role | What changes |
|---|---|---|
| `MyGameButton` | go | nothing |
| `MyGameDock` | static container that holds the go and one door | the door's look and two rules (*What this ADR amends in ADR 047*) |
| `MyGameDockLineText` | static text | nothing |
| `MyGameOutlinedButton` | local action | edge `ink` at `strokeWidths.control`; it takes the outer focus ring the go button has |
| `MyGameChoiceRow` | local action (pick) | nothing |
| `MyGameSwitchRow` | local action (pick) | gains the hairline `line-strong` outline; trunk draws none |
| `MyGameTextField` | local action (text) | nothing |
| `MyGameTimeField` | local action: four step buttons | its buttons follow `MyGameOutlinedButton` |
| `MyGameStreetStrip` | local action (pick): seven tabs | becomes one segmented control: one hairline `line-strong` frame of radius `md` around the strip, hairline dividers between tabs; the selected tab keeps its ink bar and the marks keep their meaning |
| `MyGameNavRow` (new) | door | new |
| `MyGameBackLink` | door, the way home | label in `label` and `ink`, chevron in `ink`, both in `inkMuted` while disabled; out of `MyGameMetaText` |
| `MyGameTextLink` | link | the one link component: `label` underlined in `ink`, with the busy state `MyGameTextButton` has |
| `MyGameTextButton` | link | deleted; its 5 call sites move to `MyGameTextLink` |
| `MyGameFrameText` | static text; a word with a gloss is a link (underlined, `WordOnTap`) | nothing |
| `MyGameErrorBanner` | static container that holds one link | nothing |
| `MyGameCard` | static container | drops its `line` border; keeps `surface-raised` and radius `lg` |
| `MyGameBlock`, `MyGameBlockStack`, `MyGameNextStepBlock`, `MyGamePlacePage` | static container | nothing |
| `MyGameHeader` | static container that holds the back link and the ring | lays out the ring's label |
| `MyGameRing` | static | gains a visible label (*The ring's label*) |
| `MyGameInlineAlert`, `MyGameCountdownLine`, `MyGameSupportLine`, `MyGameSectionTitle`, `MyGameMetaText`, `MyGameText` | static text | `MyGameSectionTitle` and `MyGameCountdownLine` change style (*The type hierarchy*) |
| `MyGameHairline`, `MyGameTrack`, `MyGameSkeleton`, `MyGameIcon`, `MyGamePlaceArt`, `MyGameWordArt` | static | nothing |

`MyGameTheme`, `MyGamePreviewSurface`, `rememberRegisteredFraction` and
`wordStyle` draw no role.

### Every call site that changes role or look

The one hand-rolled `.clickable` in `apps/android/feature`:

| Call site | Role | It becomes |
|---|---|---|
| `school/LessonRows.kt:193` (`LessonTarget`, an unstudied lesson's row) | door | `MyGameNavRow`. A studied lesson's row is not tappable on trunk and draws no chevron |

The 18 call sites of `MyGameOutlinedButton`:

| Call site | Role | It becomes |
|---|---|---|
| `town/PlaceOffer.kt:56` (*Build level N*) | local action | stays, in the new outline |
| `town/HireItem.kt:104` (*Hire*) | local action | stays |
| `town/PlaceBuildingWork.kt:226`, `town/OfficeSection.kt:164`, `school/LessonSlotSection.kt:145` (*Stop*) | local action | stay |
| `map/SiteItem.kt:99`, `map/TeamFormCard.kt:70`, `map/JobOutCard.kt:76` (send a team, *Send*, call back) | local action | stay |
| `review/ReviewCardContent.kt:108` (*Hint*) | local action | stays |
| `placement/PlacementOffered.kt:36`, `placement/HoldoutCheckDue.kt:37` (*Skip*) | local action | stay |
| `report/ReportScreen.kt:210` (*Close the news*) | local action | stays |
| `town/TownStatus.kt:104` (the finish notice's *Close*) | local action | stays |
| `school/LessonRows.kt:136` (a released lesson's study) | local action | stays |
| `school/ShownLesson.kt:92` (`StudyAction`) | local action | stays for a selected lesson that is not the step's; not drawn for the step's lesson (*One action, one control*) |
| `school/ShownLesson.kt:120` (`ReadWordsPill`) | door | `MyGameOutlinedDoor` (#2122) |
| `town/TownStatus.kt:95` (the finish notice's *Read the words* or *Start the reviews*) | door | `MyGameNavRow`; not drawn when the dock's go opens the same screen |
| `town/TownDock.kt:66` (the folded dock's door) | door | `MyGameNavRow` with the door's chevron |

The 18 call sites of `MyGameTextLink` and the 5 of `MyGameTextButton`:

| Call site | Role | It becomes |
|---|---|---|
| `town/TownPage.kt:123` (*Go to the school*), `town/TownPage.kt:129` (*Go to the map*) | door | `MyGameNavRow` |
| `report/ReportRows.kt:36` (the Report's rows: News, the reminder offer, Settings) | door | `MyGameNavRow` |
| `placement/PlacementOffer.kt:67` (*Take the placement*) | door | `MyGameNavRow` |
| `school/HoldoutCheckRows.kt:72` (*Open the check*) | door | `MyGameNavRow` |
| `school/LessonWordsScreen.kt:152`, `:275` (*Go to the school*), `:260` (the way on before the last word) | door | `MyGameNavRow` |
| `school/ReviewsLink.kt:25`, `:31` | door | deleted: the dock's go carries the same step (*One action, one control*) |
| `signin/SettingsScreen.kt:84` (*Back to your town*) | door | deleted: the dock's *Town* door is the same way |
| `map/MapScreen.kt:156`, `:162` (*Previous area*, *Next area*) | local action | `MyGameOutlinedButton`: the map stays and its area changes |
| `map/MapScreen.kt:98` (*Back to your area*, beside an alert) | link | stays a link |
| `signin/SignInScreen.kt:116`, `signin/ForgotPasswordScreen.kt:57`, `signin/AuthSwitch.kt:22` (the other signed-out form) | link | stay |
| `signin/ReminderSetting.kt:42` (*Open notification settings*) | link | stays |
| `report/ReportScreen.kt:97`, `town/TownScreen.kt:152` (*Sign out*) | link | `MyGameTextLink` |
| `town/TipNote.kt:42`, `town/TownPage.kt:144` (close the tip, close the goal) | link | `MyGameTextLink` |
| `signin/VerificationBannerScreen.kt:76` (*Send again*) | link | `MyGameTextLink` |

Two hand-drawn frames around static content go, by *A closed frame means
tappable*: the dashed `line` frame around the *nothing to read* note
(`school/LessonWordsScreen.kt:143`) and the hairline `ink` border around
the near-miss line (`review/ReviewStepLine.kt:103`). The first becomes a
`MyGameCard`; the second keeps its `surface-sunken` fill.

The 5 call sites of `MyGameButton`, the 5 of `MyGameChoiceRow`, the 9 of
`MyGameTextField` and the back link's one
(`apps/android/app/src/main/kotlin/com/emm/mygame/FramedScreen.kt:164`)
keep their role.

### One action, one control

No screen draws two controls that do the same thing or open the same
screen. The cases on trunk:

| Where | The duplicate | The rule |
|---|---|---|
| The town home's dock | the go's *Go to the Report* and the *Report* door | the dock omits a door that opens the go's destination; the go takes the row |
| Settings | the *Back to your town* link and the dock's *Town* door | the link is deleted |
| The school | `StudyAction` under the lead block and the dock's go, when the shown lesson is the step's | the in-flow button is not drawn; the dock's go studies in place (`studyInPlace`, ADR 047) |
| The school | `ReviewsLink` and the dock's go, both drawn when the step's line is `ReviewsDue` | `ReviewsLink` is deleted |
| The finish notice | its open button and the dock's go, when both open the lesson's words or the reviews | the notice keeps its line and *Close* |

### One fact, one place

A fact is a value a screen shows as content: a line, a figure or a mark.
Each fact appears once per screen. A control's label that names its
target is not a second statement of it.

- **A screen whose body states the step draws the eyebrow there, and its
  dock draws no line.** On the school, when the lead block shows the
  step's lesson, the block carries *What is next* above the lesson's
  number, theme and summary, as `MyGameNextStepBlock` does on the town,
  and the dock holds the go and the door only. The countdown and the
  refusal line stay in the dock: they are the go's state.
- **The cap's figure is in the learning card only.** The blocked reason
  under the lead block says what the lesson needs without repeating the
  figure, and the dock's line is not drawn by the rule above. The slice
  rewrites `school_lesson_cap_reached` in `en.json` and `es.json`.
- **The time the next word in learning is due is stated once**: in the
  dock's countdown when the dock draws one, else in the learning card's
  line (`school_learning_full_next_word_due`).
- **A running lesson's time is stated once on the school**, in the
  *Studying* section. The status strip's line (`RunningLessonLine` in
  `TownStatus.kt`) and the dock's countdown are not drawn there for the
  same lesson.

### The ring's label

The header draws `shell_retained_words` (*12 of 80 words learned*) in
`caption` and `ink-muted` beside the ring. The string exists and is the
ring's spoken name today, so no key is added and the ring's drawing
becomes decoration under one merged node. When the header's two sides do
not fit one row, the ring and its label drop under the start side.

### The type hierarchy

No type token is added and no value changes. Each level of a screen takes
one style, all of them in `MyGameTypography.kt`:

| Level | Style | Color | The rule |
|---|---|---|---|
| Screen title | `display` (40) | `ink`, or `on-block` on a block | one per screen |
| Section | `heading` (20) | `ink` | drawn by `MyGameSectionTitle`, with heading semantics; never `label`, never `ink-muted` |
| Row or item name | `title` (17) | `ink` | a lesson's row, a place's level, a door's label |
| Body | `body` (16) | `ink` | `reading` (20) for a frame, `gloss` (17) for a pick's label |
| Meta | `caption` (15) | `ink-muted` | a rate, a cost, a time's words, a position |
| Eyebrow | `meta` (14, uppercase) | `ink-muted`, or `on-block-muted` | only above a title; never on a control |
| Number | `numeral` (26) | `ink` | the figure a section is about: a stock, the reminder's time. A figure inside a line keeps the line's style with tabular figures |
| The go's label | `button` (18) | `on-go` | the go button only |
| A control's label | `label` (15) | `ink` | a local action, a link, the dock's door, the back link, a field's label |

`word` and `wordFromMd` keep ADR 043's job, the word on a card.

What changes on trunk:

- `MyGameSectionTitle` moves from `label` in `ink-muted` to `heading` in
  `ink`. The settings' *Theme* and *Help language*, the school's
  *Lessons* and *Studying* draw through it.
- `MyGameCountdownLine`'s time moves from `heading` to `title` with
  tabular figures, so a time never has the size of a section.
- `MyGameBackLink` leaves `meta`; `MyGameTextLink` leaves `button`.

The colors the roles name all exist in `MyGameColors.kt`: `go`, `on-go`,
`ink`, `ink-muted`, `line`, `line-strong`, `action`, `focus`, `surface`,
`surface-raised`, `surface-sunken`, `on-block`, `on-block-muted`. The only
new token is the icon `forward`.

### Color: no value changes

`action` stays equal to `ink`. A link's cue is its underline, so it needs
no color of its own.

`apps/web/src/design/tokens.ts` is the source both clients read, so a
change there is never Android's alone:

- Changing `action`'s value repaints the web's `Button`, `TextLink`,
  `RecognitionCard`, `AuthPanel` and `TownDoors`, which read it, and on
  Android the track, the switch, the chosen choice and the outlined
  button's badge.
- A separate link color would be a new token in `tokens.ts`, a new field
  in the generated `MyGameColors.kt`, and new pairs in `tokens.test.ts`
  and `MyGameColorsContrastTest`. No web screen would draw it while the
  web is parked.

Neither is done. This ADR changes no file under `apps/web`.

### What this ADR amends in ADR 047

| ADR 047 says | It becomes |
|---|---|
| *The dock*, part 3: one outlined door | one door, drawn as `label` and an `iconSmall` chevron, without an outline: forward after *Report* on the town, back before *Town* on a place screen. It keeps the 60 height as its target and the 3:1 share beside the go, and drops under the go when the labels do not fit |
| *The dock*, the table of screens: the town's door is *Report* on every step | the door is omitted when it opens the go's destination |
| *The dock*, part 1, the line, on every non-task screen | the dock draws no line on a screen whose body states the step (*One fact, one place*) |
| The fold: the line and the door move to the top of the scroll (trunk draws the door there as an outlined button, `TownDock.kt:66`) | the door moves there as a `MyGameNavRow` with the door's chevron |
| `ShownLesson.kt:105`, the lead lesson's study, outlined (line 92 on trunk) | not drawn when the dock's go studies the same lesson |
| `ShownLesson.kt:134`, `ReadWordsPill`, outlined (line 120 on trunk) | a `MyGameNavRow` |
| *The pager*: the office's page, with *Go to the map* as a text link | a `MyGameNavRow`; the school page's *Go to the school*, a text link on trunk (`TownPage.kt:123`), follows it |
| The Report ends in three hairline rows (trunk draws each as a text link, `ReportRows.kt:36`) | three `MyGameNavRow` |
| *The dock*, the table of a step that points at its own screen (047:240): on the reading screen's last word with no way on, *Go to the school* stays a text link in the content | a `MyGameNavRow` (slice 2) |
| The street strip: seven silhouettes, each a tab | the same tabs inside one outlined segmented control |
| `MyGameTextLink` reads `action` | it reads `ink`; `action` stays the fill of a mark |
| A task screen's header keeps the back link | the same link, in `label` and `ink` |

ADR 047's accent, its `go` and `on-go` pair, the fold rule, the pager and
the order of its slices stand. ADR 043's type table stands, with the
three style moves above.

No `CONTEXT.md` term enters: role, door, link, nav row and chevron are
design words, as block, dock and pager are in ADR 047.

### The slices

Each is one ticket. *Trap list* is the wave skill's
(`.claude/skills/wave/SKILL.md`): a design-system default that changes N
screens, where no test catches a wrong look, so the ticket owes a
screenshot of every affected screen.

1. **`MyGameNavRow` and the forward chevron, on the school.**
   **Trap list: no** (a new component; one screen adopts it).
   - `MyGameIcons.forward` exists and `MyGameNavRow` draws it at the end
     of the row.
   - A `MyGameNavRow` has `Role.Button`, a minimum height of `secondary`
     and no border.
   - Every unstudied lesson's row is a `MyGameNavRow`; a studied lesson's
     row has no click action and no chevron.
   - `apps/android/feature` holds no hand-rolled `.clickable`.
2. **Every door is a nav row.** **Trap list: no default changes, 6
   screens touched**: the town's school and office pages, the Report, the
   school, the lesson's words, the placement offer.
   - These nine call sites draw `MyGameNavRow`: `TownPage.kt:123` and
     `:129`, `ReportRows.kt:36`, `PlacementOffer.kt:67`,
     `HoldoutCheckRows.kt:72`, `LessonWordsScreen.kt:152`, `:260` and
     `:275`, `ShownLesson.kt:120`.
   - The only `MyGameTextLink` or `MyGameOutlinedButton` call sites left
     that open a signed-in screen are the five slices 6 and 8 own:
     `TownDock.kt:66`, `TownStatus.kt:95`, `SettingsScreen.kt:84`,
     `ReviewsLink.kt:25` and `:31`.
   - Each row opens the screen its text link or button opened.
3. **Static containers drop the outline.** **Trap list: yes**:
   `MyGameCard`'s default changes its 11 call sites in 10 files across
   5 feature modules (map, school, review, town, report).
   - `MyGameCard` draws no border.
   - `LessonWordsScreen.kt:143` and `ReviewStepLine.kt:103` draw no
     frame.
   - `rg '\.border\(|dashedFrame\('` over `apps/android` matches only
     controls: the pill, the choice row, the switch, the text field, the
     strip and a focus ring.
4. **The local-action outline.** **Trap list: yes**: `outlinedPillLook`
   changes 18 call sites and the time field's four buttons.
   `MyGameDock.kt:161` builds the dock's door from `outlinedPillLook`
   too, so the door takes the new outline until slice 6 draws it without
   one; its screenshots include the dock.
   - An enabled `MyGameOutlinedButton` draws its edge in `ink` at
     `strokeWidths.control`.
   - Its focus ring is drawn outside its edge, as the go button's is.
   - `MyGameSwitchRow` draws a hairline `line-strong` outline of radius
     `md`.
   - `MapScreen.kt:156` and `:162` draw `MyGameOutlinedButton`.
   - `MyGameColorsContrastTest` holds the outline's pair against every
     ground a button is drawn on, at 3:1 or more.
5. **One link component, and the back link.** **Trap list: yes**:
   `MyGameTextLink`'s default changes 18 call sites and the error banner,
   and `MyGameBackLink`'s changes the four task screens.
   - `MyGameTextButton` does not exist; its 5 call sites draw
     `MyGameTextLink`.
   - `MyGameTextLink` draws `label` underlined in `ink` and has the busy
     state.
   - `MyGameBackLink` draws `label` in `ink` with the chevron in `ink`,
     and its text is not uppercase.
   - No `MyGameMetaText` is inside a clickable node.
6. **The dock's door, and one action, one control.** **Trap list: yes**:
   `MyGameDock`'s default changes every screen with a door (the town, the
   school, the Report, News, the map, Settings).
   - The dock's door draws its label and a chevron, with no border, and
     its target is 60 high.
   - The town's dock draws no door when the go's action is `GoToReport`.
   - The folded dock's door at the top of the scroll is a `MyGameNavRow`.
   - `SettingsScreen` draws no way to the town outside the dock, and
     `settings_back` leaves the catalog.
   - The finish notice's way on (`TownStatus.kt:95`) is a `MyGameNavRow`,
     and is not drawn when the dock's go opens the same screen.
7. **The ring's label.** **Trap list: yes**: the header is drawn on every
   signed-in screen.
   - The header shows `shell_retained_words` as text beside the ring.
   - A screen reader reads the ring and its label as one node, once.
   - At 360 by 640 and font scale 2.0 the label wraps or drops under the
     header's start and is never clipped.
8. **The school shows each fact once.** **Trap list: no** (one screen),
   but it changes catalog strings in `en.json` and `es.json`, so the
   generated `strings.xml` files change.
   - When the lead block shows the step's lesson, it draws *What is next*
     and the dock draws no line.
   - `StudyAction` is not drawn for the step's lesson, and is drawn for a
     selected lesson that is not the step's.
   - `ReviewsLink` does not exist.
   - With the cap full, the figure *N of M* and the time the next word
     is due each appear once on the screen.
   - While the *Studying* section shows a lesson, no other line on the
     school states that lesson's time.
9. **The type hierarchy.** **Trap list: yes**: `MyGameSectionTitle` and
   `MyGameCountdownLine` change wherever they are drawn.
   - `MyGameSectionTitle` draws `heading` in `ink`.
   - The settings' *Theme* and *Help language* and the school's *Lessons*
     and *Studying* draw `MyGameSectionTitle`.
   - `MyGameCountdownLine`'s time draws `title` with tabular figures.
   - No `feature` file draws `MyGameTypography.label` on text that is not
     a control's label.
10. **The street strip is one segmented control.** **Trap list: no**
    (one call site, `TownStreet.kt:32`).
    - The strip draws one hairline `line-strong` frame of radius `md` and
      a hairline divider between tabs.
    - Each tab keeps `Role.Tab` and a 48 by 48 target.
    - The selected tab keeps the ink bar; the next step's dot and the
      work mark are unchanged.

Slices 1 and 2 go first, since 6 and 8 draw `MyGameNavRow`. Slices 3, 4,
5, 9 and 10 depend on nothing. Slice 8 follows 6. Once slices 2, 6 and 8
are merged, no `MyGameTextLink` or `MyGameOutlinedButton` call site opens
a signed-in screen.

## Considered options

- **A color for links** (a blue, or `go`). Rejected. A hue cannot survive
  grayscale, ADR 043 keeps hue for identity and ADR 047 keeps green for
  the way on. It also needs a new token in `tokens.ts` that no web screen
  draws.
- **A filled neutral tier for local actions** (`surface-sunken` ground).
  Rejected. `surface-sunken` is the blocked pill's ground on trunk, so a
  sunken button would read as disabled, and a second fill competes with
  the go.
- **Keep the outlined pill for doors and add an icon to local actions.**
  Rejected. The audit's confusion is between the button, the choice and
  the card, and that leaves all three as they are.
- **Keep the card's border and outline nothing else.** Rejected. Picks
  and fields need a boundary at 3:1 (`ui-components.md`), so the outline
  has to stay on controls; it is the static container that gives it up.
- **The lesson rows as picks, with a chosen state.** Rejected. The tap
  moves the view to the top of the screen and no row stays chosen in
  place, so the row is a door.
- **Keep the dock's line on the school and drop the lead block.**
  Rejected. The block is where the lesson's theme and reward are; the
  dock's line holds one sentence.
- **New type sizes to spread the scale.** Rejected. The scale has enough
  sizes (14 to 40); what trunk lacks is one job per size. `tokens.ts`
  stays untouched.

## Consequences

- A grayscale screenshot separates the roles: a fill, an outline, a
  chevron, an underline, or nothing.
- **A card is quieter.** `surface-raised` on `surface` is 1.06:1 in light
  and 1.10:1 in dark, so a borderless card groups by its spacing and its
  section title more than by its ground. That is accepted: a static group
  needs no boundary contrast, and `line` was 1.27:1 on trunk.
- **The dock's door loses its boundary.** Its label and chevron are `ink`
  on `surface-raised`, 17.6:1 in light and 15.1:1 in dark, and its target
  stays 60 high. It is the one control that relies on position and the
  chevron alone.
- **The outlined button gets heavier**: `ink` at 2dp is 16.5:1 on
  `surface`, against `line-strong` at 1dp and 3.4:1 on trunk. A screen
  with several (the time field's four steps, a place's offer) carries
  more ink; none of them is filled, so the go stays the heaviest element.
- Five slices are on the trap list. Each owes screenshots of every screen
  its default reaches, in light, in dark, and at 360 by 640 with font
  scale 2.0.
- Two components leave (`MyGameTextButton`, the school's `ReviewsLink`),
  one string leaves (`settings_back`), one enters the design system
  (`MyGameNavRow`), and one icon (`forward`).
- The web is untouched. When it is unparked, its `TextLink`, `Button` and
  `TownDoors` owe the same roles in a ticket of their own.
- The mockups are HTML drawn from trunk's tokens, not Compose. The dock
  door's 3:1 share and the header's wrap at font scale 2.0 are measured
  by slices 6 and 7 on a device.

## References

- The canvas (https://claude.ai/artifact/5mJ6zUazFdPnMdnS9T12Ej, #1286):
  the town home, the school and settings, each at 412 by 915 and at 360
  by 640 with font scale 2.0, the sheet of the five roles, and a
  grayscale copy of every board. Where the canvas and this ADR differ,
  this ADR holds.
- The audit: #1247, #1254, #1255, with screenshots on the branches
  `assets/1247-*`, `assets/1254-*` and `assets/1255-visual-check`.
- ADR 043 (the look): the type table and the block.
- ADR 047 (Main Street): the go, the dock, the pager, the street strip.
- `.claude/rules/ui-components.md`: targets, contrast, color never alone.
- `apps/android/core/designsystem`: `MyGameTypography.kt`,
  `MyGameColors.kt`, `MyGameIcons.kt`, and every component named above.
