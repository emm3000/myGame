---
status: proposed
date: 2026-11-06
---
# The look

## Context

The owner played the shipped town and said *bien feo el diseño amigo
mio, los colores, no pasa nada*. Issue #855 captured the real screens,
judged them and drew one direction beside them
(https://claude.ai/artifact/Xdp9JZ7hkLdr3uvAjGm9sZ). The owner pointed at
their own app Hello as the base. On 2026-11-05 they walked the artifact
and accepted it: *si me gusta asi*. This ADR records that look and
settles what the artifact left open: the type, the ring, and how the
clients stay one system.

What trunk holds, checked at `c9ae9c3a`, with the screens measured on a
new town at `0e86a04a`:

- **Everything asks for attention at once.** The town home is 4 556 px
  tall at 390 px wide, 5.4 phone screens, with a place card of about
  400 px. After lesson 1 the school draws 15 identical primary buttons.
- **The colors have no system.** `tokens.ts` holds 43 color tokens, 27
  for the interface and 16 `scene-*`. The town home alone uses 9 text
  colors and 5 backgrounds. A card the player can afford wears a blue
  `right` border, which at the start is nearly every card.
- **Nothing visibly happens.** `placeArtOf` shows the same image at
  levels 0, 1 and 2, so a first build changes no picture and a place not
  built looks built. A right answer draws a blue box and the town stays
  as it was. The whole app has one transition, `transitions.track`.
- **Both clients already follow the system theme**:
  `prefers-color-scheme` in `tailwindTheme.ts`, `isSystemInDarkTheme()`
  in `MyGameTheme`.
- **The token check ADR 034 promised does not exist.** #572 closed as a
  design pass. `apps/android/CLAUDE.md` and `ui-components.md` both say
  the web's `tokens.ts` is the source until the check lands *with the
  redesign*. This is the redesign.
- **The art has one source and one generated copy.** The 35 place and 3
  waste SVGs are hand-written; `pnpm --filter @mygame/web drawables`
  writes the Android VectorDrawables and the web suite fails on a drift.
  No screen draws a waste image yet: #787 and #788 bring them.
- **The medieval screens are still on trunk.** #751 deletes them, and it
  is still blocked by #793. On the web 12 of their files use `miss`,
  `hint` or `shadow-ledge`.

## Decision

### The look

**Hello's look is the base, and shadcn's restraint fills what Hello
leaves open.** Warm paper, near-black ink, four flat color blocks, no
accent color, no shadows, 1 px hairlines, few elements. What comes from
Hello is its paper and ink, its four blocks, its 16 and 28 radii and
pills, its 60 and 52 button heights, its one-action hero with two doors
under it, its stack of cards and its ring. Hello is the owner's own work,
so reuse is direct. It stays read-only: nothing here changes that app.

**Light leads and the theme follows the system.** Hello is light only, so
a screen is drawn and judged on paper first. Dark is built from shadcn's
neutrals with Hello's ink as the ground. No setting is added: both clients
already follow the system, so this costs nothing. The artifact's first
brief led with dark; Hello outranked it.

**One ink pill per screen.** The primary action is the only filled control
on a screen, and it is the only thing that reads as primary. On the town
home it is the next step's button (ADR 042), on the school the next
lesson, on a word or a review the way on. Every other action is an
outlined pill or a text button. In dark the pill is paper on ink, since
`action` is a token. A block holds no pill: the pill sits under it, on
paper, so its boundary and its focus ring are measured on a surface. A
block keeps one value in both themes, and a paper pill on one would fall
to 1.26:1. The one control a block may hold is N6's word on tap, from
stability 7. It draws as text, at `control` height, and its focus ring
is `on-block`, because `focus` in dark falls to 1.26:1 on mint.

**Hue is identity, never meaning.** A block takes its color from where it
sits, never from a grade, a resource or a result. A lesson's block uses
its place in the curriculum, `index % 4`. A word card or a review card
uses its place in the run the screen is walking, so the next card always
changes hue, and `DueReview` needs no new field. The next step's block is
always peach and the Report's always periwinkle. The four blocks are
nearly one lightness, 1.02 to 1.11:1 between any two, and 1.01 to 1.19:1
under Machado's three simulations at full severity, so color-blind
players may not tell them apart. Nothing is lost, because they carry no
meaning.

**Right and wrong are ink, never red and green.** Forgetting is part of
learning, so a wrong answer is not an alarm. Each verdict is an icon and
words in `ink`: a check and *Correct*, a cross and the right answer. The
`warning` and `destructive` pairs are for the system alone: a shortfall, a
refusal, a failed read. Copy stays as the catalog has it.

### The tokens

`tokens.ts` goes from 43 color tokens to 20. Every pair in the second
table is computed with the WCAG 2.2 formula `tokens.test.ts` uses, and
none is under its floor. The tightest text pair is `destructive-ink` on
`destructive-soft` at 4.92:1, and the tightest control boundary
`line-strong` on `surface-sunken` at 3.03:1, both in light. The table
holds 28 pairs, each in both themes.

| Token | Light | Dark |
|---|---|---|
| `surface` | `#f4f3f1` | `#15141a` |
| `surface-raised` | `#fbfaf9` | `#1e1d24` |
| `surface-sunken` | `#e9e7e3` | `#2b2a32` |
| `line` | `#dad9d8` | `#2e2d35` |
| `line-strong` | `#858389` | `#85838c` |
| `ink` | `#15141a` | `#f4f3f1` |
| `ink-muted` | `#5f5d65` | `#aeacb4` |
| `action` | `#15141a` | `#f4f3f1` |
| `on-action` | `#f4f3f1` | `#15141a` |
| `focus` | `#15141a` | `#f4f3f1` |
| `warning-ink` | `#7f5210` | `#e8bf74` |
| `warning-soft` | `#f3e6c8` | `#3a2e16` |
| `destructive-ink` | `#a33a3a` | `#f0a6a6` |
| `destructive-soft` | `#f3dada` | `#3f2224` |
| `block-peach` | `#f5c9a8` | same |
| `block-mint` | `#bfe3cb` | same |
| `block-periwinkle` | `#c6d3f5` | same |
| `block-lavender` | `#dcc8f0` | same |
| `on-block` | `#15141a` | same |
| `on-block-muted` | `#45444c` | same |

| Pair | Used as | Light | Dark |
|---|---|---|---|
| `ink` on `surface` | text | 16.51 | 16.51 |
| `ink` on `surface-raised` | text | 17.56 | 15.07 |
| `ink` on `surface-sunken` | text, the ring's fill on its track | 14.83 | 12.80 |
| `ink-muted` on `surface` | text | 5.84 | 8.16 |
| `ink-muted` on `surface-raised` | text | 6.22 | 7.45 |
| `ink-muted` on `surface-sunken` | text, the track | 5.25 | 6.32 |
| `on-action` on `action` | text | 16.51 | 16.51 |
| `on-block` on `block-peach` | text, a window, focus on a block | 12.04 | 12.04 |
| `on-block` on `block-mint` | text, a window, focus on a block | 13.14 | 13.14 |
| `on-block` on `block-periwinkle` | text, a window, focus on a block | 12.24 | 12.24 |
| `on-block` on `block-lavender` | text, a window, focus on a block | 11.83 | 11.83 |
| `on-block-muted` on `block-peach` | text | 6.32 | 6.32 |
| `on-block-muted` on `block-mint` | text | 6.90 | 6.90 |
| `on-block-muted` on `block-periwinkle` | text | 6.43 | 6.43 |
| `on-block-muted` on `block-lavender` | text | 6.21 | 6.21 |
| `warning-ink` on `surface` | text | 6.08 | 10.58 |
| `warning-ink` on `surface-raised` | text | 6.46 | 9.66 |
| `warning-ink` on `warning-soft` | text | 5.44 | 7.67 |
| `destructive-ink` on `surface` | text | 5.87 | 9.34 |
| `destructive-ink` on `surface-raised` | text | 6.25 | 8.52 |
| `destructive-ink` on `destructive-soft` | text | 4.92 | 7.31 |
| `action` on `surface` | boundary | 16.51 | 16.51 |
| `line-strong` on `surface` | boundary | 3.38 | 4.90 |
| `line-strong` on `surface-raised` | boundary | 3.59 | 4.48 |
| `line-strong` on `surface-sunken` | boundary | 3.03 | 3.80 |
| `focus` on `surface` | boundary | 16.51 | 16.51 |
| `focus` on `surface-raised` | boundary | 17.56 | 15.07 |
| `focus` on `surface-sunken` | boundary | 14.83 | 12.80 |

**Hello's values changed where they miss our floor.** Its `inkMuted`
gives 4.13:1 on its raised gray and 3.35:1 on peach, so `ink-muted` is
darker and `on-block-muted` is new. Its `outline` gives 1.95:1, so
`line-strong` is raised. Its `inkFaint` gives 2.91:1 and has no successor.

**Three pairs stay under 3:1 and are exempt under WCAG 1.4.11**, as
`ui-components.md` requires them to say. `line` on any surface (about
1.3:1) is a divider and never a control's boundary. A block on `surface`
(1.37:1 for peach) is a ground, and the text on it is measured. A
silhouette on `surface` is decorative, since its level is always written
beside it. `tokens.test.ts` will name all three.

**One text pair stays exempt under WCAG 1.4.3**, as `tokens.test.ts` holds
it today: `line-strong` as a disabled label on `surface-sunken`, 3.03:1.
The disabled pill itself uses `ink-muted`, which passes.

**What leaves:**

| Token | Goes to |
|---|---|
| `ink-faint` | `ink-muted` |
| `action-soft`, `gloss-soft`, `right-soft`, `hint-soft` | `surface-sunken` |
| `gloss` | `ink-muted`, or `on-block-muted` on a block |
| `right` | `ink` with its icon |
| `miss`, `miss-soft` | `ink` with its icon on a review; the `destructive` pair on a refusal or an error |
| `hint` | `ink` on `surface-sunken` |
| `badge`, `on-badge` | `action`, `on-action` |
| `money`, `food`, `power`, `material`, `people` | `ink`: see *Resources* |
| the 16 `scene-*` | the blocks and `on-block` |
| the `ledge` shadow, with the `shadows` family | a `line` hairline |

**The other families.** `radii` become `sm` 8, `md` 16, `lg` 28, `pill`
999. `heights.track` falls from 6 to 3 px. `minHeights` gains `action` 60
and `secondary` 52, and `control` stays 48. The back link, the only way
home, and every text button and text link take `control` height on both
clients. Trunk's `TextLink` has no minimum and measures about 24 px. `spacing`, `strokeWidths` and `durations` do not change, and the
screen gutter is `spacing[5]`, 20 px. The icons keep their 2 px stroke.

### The type

**One family, Schibsted Grotesk, sets every letter and every digit.**
Bricolage Grotesque, which the artifact shows on the word, is out, and
Atkinson Hyperlegible Next leaves too. This is where the look leaves
Hello, and the largest change from what the owner saw.

**The method.** The words come from `docs/setting/lessons.md`, and 9 of
the 80 frames hold the pronoun *I*. Each string was drawn on a Chromium
canvas at 3×, kerned, in the size, weight and tracking the screen uses,
Bricolage with its `opsz` axis on automatic, and cut to black and white
at 50 %. The two bitmaps sit on one baseline
and slide across every horizontal offset at which they touch. The score is
1 minus their best overlap, intersection over union, so higher is easier to
tell apart and 0 is the same picture. Glyphs come first because whole-word
overlap mixes advance width into shape; the two word rows are context.

| Pair | 44/800 A | B | S | 20/400 A | B | S | 16/400 A | B | S |
|---|---|---|---|---|---|---|---|---|---|
| *I*, *l* | 0.275 | **0.054** | 0.338 | 0.366 | **0.048** | 0.283 | 0.273 | **0.059** | 0.363 |
| *i*, *l* | 0.343 | 0.092 | 0.234 | 0.375 | 0.121 | 0.334 | 0.276 | 0.139 | 0.276 |
| *l*, *1* | 0.303 | 0.157 | 0.284 | 0.361 | 0.164 | 0.271 | 0.396 | 0.155 | 0.394 |
| *I*, *1* | 0.358 | 0.115 | 0.388 | 0.483 | 0.127 | 0.381 | 0.500 | 0.107 | 0.351 |
| *O*, *0* | 0.359 | 0.218 | 0.342 | 0.469 | 0.323 | 0.615 | 0.463 | 0.324 | 0.611 |
| *rn*, *m* | 0.272 | 0.285 | 0.381 | 0.362 | 0.388 | 0.453 | 0.366 | 0.427 | 0.438 |
| *cl*, *d* | 0.507 | 0.507 | 0.534 | 0.614 | 0.564 | 0.588 | 0.602 | 0.571 | 0.561 |
| *I will*, *l will* | 0.090 | 0.009 | 0.138 | 0.241 | 0.041 | 0.210 | 0.221 | 0.156 | 0.258 |
| *hill*, *hiII* | 0.405 | 0.089 | 0.424 | 0.560 | 0.138 | 0.520 | 0.527 | 0.097 | 0.517 |

A is Atkinson, B Bricolage, S Schibsted. Scores at the small sizes move
with the pixel grid: Schibsted's *I*, *l* reads 0.283 at 20, 0.395 at 17
and 0.363 at 16. A gap under about 0.1 there is not a finding.

- **Bricolage fails the game's own job.** Its capital *I* and lowercase
  *l* are one bare stem, under 0.06 at all three sizes. A player learning
  to read English cannot be given those letters in that face.
- **Schibsted leads at word size**, on six of the nine pairs, among them
  *I*, *l* and *rn*, *m*. Atkinson leads on *i*, *l*, on *l*, *1* and on
  *O*, *0*. Its capital *I* carries serifs, as Atkinson's does.
- **At the reading size the two tie on letters.** At 20/400, where
  `reading` sets the frames and each frame writes its word, Atkinson leads
  on seven of the nine pairs, by 0.026 to 0.102. Only *I*, *1* clears the
  0.1 bar above. Schibsted leads on *rn*, *m* by 0.091 and on *O*, *0*.
- **`reading` ships in Schibsted.** Atkinson's lead does not reach a
  learner:
  - Two of its seven wins are digit pairs, and 0 of the 80 frames or lemmas
    hold a digit.
  - The other five gaps are 0.026 to 0.083, under the bar.
  - *I*, *l* flips with size: Schibsted leads at 16, 17 and 21, Atkinson at
    the other seven sizes from 15 to 24.
  - All 9 frames with the pronoun open with *I*, where a lowercase *l*
    cannot stand.
  - Schibsted leads on *rn*, *m* at every size from 15 to 24, and *earn*
    and *learn* are lemmas.
  - Its x-height is 6 % larger, 0.527 of the size against 0.496.

  Reversing this takes a new ADR. The device check of item 2 runs this
  method at 20/400 at 3× alone, and its bar is no pair under 0.15; the
  lowest there is *I will*, *l will* at 0.210. It is pinned to one density
  because density alone moves that score, from 0.108 to 0.281 between
  1.5× and 4×, with 0.108 at 2.25×, Android's 360 dpi bucket.

  **On Android, `reading` sets `TextMotion.Animated`** (#862). Compose's
  default, `TextMotion.Static`, hints the glyphs and keeps them off
  subpixel positions, and on an emulator at 480 dpi it put *I will*,
  *l will* at 0.142, under the bar. `Animated` drops the hinting and sets
  them at subpixel positions, and the same pair reads 0.280. The generator
  writes it on `reading` alone, the style this check measures. The nine
  pairs on Android, drawn by `MyGameText` on the screen, in the table's
  order: 0.293, 0.254, 0.281, 0.398, 0.650, 0.486, 0.589, 0.280, 0.546.
  Single glyphs barely move, *I*, *l* is 0.293 both ways, and with one
  shared *will* the pair still scores 0.189, so part of 0.280 is
  positioning. Frames drawn both ways show stems slightly softer at
  160 dpi and no loss at 480 or at 120, the lowest Android bucket, since
  the app declares no limit. The share of grey edge pixels moves from
  0.179 to 0.185 at 480 and from 0.401 to 0.432 at 160, and falls from
  0.646 to 0.485 at 120. No Android screen drew `reading` before #840.
- **Digits.** Atkinson leads on *l*, *1* at word and reading size, and
  neither leads at 16. No frame or lemma holds a digit. Schibsted's zero
  has no slash, so the stock figures lose Atkinson's noise, and it still
  separates *O*, *0* better at small sizes. Its digits are tabular under
  `font-variant-numeric: tabular-nums`, measured, and it covers every
  Spanish letter the scaffold needs.
- **The cost differs by client.** Nothing uses italics, so Android ships
  one 176 KB variable file in place of Atkinson's two of 115 and 124 KB,
  where Bricolage would have added 408 KB. The web pays more: the latin
  file is 46.9 KB against 34.0 KB for Atkinson's roman, 12.8 KB or 38 %
  more. Both Google
  Fonts files are under the SIL OFL.

This is a measure of shapes, not a study of readers, and it ran on
Chromium's text rendering. Item 2 checks the same words on Android's.

| Style | Size | Line height | Weight | Tracking | Sets |
|---|---|---|---|---|---|
| `word` | 44, 52 from `md` | 1.05 | 800 | -0.02em | the English word, the answer |
| `display` | 40 | 1.05 | 800 | -0.02em | a screen's title, the next step's count |
| `numeral` | 26 | 1.15 | 700 | -0.02em, tabular | a stock |
| `reading` | 20 | 1.5 | 400 | | a frame, a gloss on its card |
| `heading` | 20 | 1.35 | 600 | | a card's title |
| `button` | 18 | 1.33 | 700 | | the ink pill |
| `title` | 17 | 1.35 | 600 | | a row's name, a verdict |
| `gloss` | 17 | 1.5 | 400 | | a review choice |
| `body` | 16 | 1.5 | 400 | | running text |
| `label` | 15 | 1.4 | 600 | | an outlined pill |
| `caption` | 15 | 1.5 | 400 | | a rate, a cost, a time |
| `meta` | 14 | 1.3 | 500 | 0.12em, uppercase | a section's label |

`numeral` alone is tabular by style. `caption` sets prose as well as figures,
and `tnum` widens the punctuation around them, so tabular figures go on the
element that shows the number, never on the style.

`meta` is new, and it is the only uppercase style. It sets short section
labels alone, never the word on a card, a frame or a gloss, where the
shape of the word is what the player is learning. Hello's 12 px rises to
14. A word wraps rather than
clips at any system font scale.

### Blocks

A block is a flat card of radius `lg`, with `on-block` text on one of the
four hues and no border. It holds what the player is here for: the next
step on the town home, the next lesson on the school, the word on a word
or a review screen. On the town home two rotated blocks sit behind it, a
stack that shows there is more to come. Everything that is not the point
of the screen lives on paper in hairline rows, in a `surface-raised` card
of radius `md`, or both.

### The screens

**The tab bar goes.** The town home carries two outlined doors under the
next step, *School* and *Report*, and every other screen a text link back
to the town in its header. This amends ADR 040's and ADR 041's
navigation: the paths stay, the bar leaves. News arrives as a row on the
Report and the map as a row on the town home, never a third door.

- **The header** holds the town's name and its `label` in `meta` on the left,
  or the back link, and the ring on the right. Under it a running
  lesson's time, on every signed-in screen, as ADR 042 asks.
- **The brand** is *Townword*: `shell.title` shows on the guest screens
  and in the browser's title, and the signed-in header drops it.
- **Sign-out** leaves the header for the foot of the Report, as a text
  button.
- **The unconfirmed mail** falls from about 165 px to one thin line at the
  foot of the screen, with its button.
- **The town home** at phone width: the next step's block with *What is
  next* on it, its pill under it, the doors, then the skyline, the stocks,
  the people, the works, the places. A new player's next step outranks the
  picture, as ADR 042 and #841 ask; the artifact drew the skyline first. At 1280 the left column holds the block, the
  doors and the works, and the right one the skyline, the stocks four
  across and the places. It measures 1 718 px at phone width in the
  artifact, from 4 556.
- **The school**: the next lesson as a block, the one pill under it, then the
  learning load, then the other lessons as rows that select one. The
  school path of #842 lives in these rows.
- **The word and the review**: one block, the word in `word`, the frame in
  `reading`, a 3 px progress line above it. Review choices are rows of
  radius `md`, 52 tall.
- **The Report**: the due count as a block with the pill under it when
  any is due, then the news as hairline rows.

### Places

**A place is a flat silhouette, and each level adds one window.** This
replaces the color illustrations. It answers *no pasa nada* directly: a
first build now changes the picture, and so does every level after it.

- **Level 0** is the silhouette in `surface-sunken`, with no windows. A
  place not built finally looks not built.
- **From level 1** the silhouette takes its hue, and `level` windows in
  `on-block` show. Ten windows per place, seventy in the town, for the ten
  levels of `apps/api/content/town/`.
- **The hue is fixed by order**, `index % 4` in homes, farm, school,
  office, factory, power station, storage.
- **The skyline** draws the seven side by side, overlapping, on one line
  of `ink`, with one `aria-label` that says how many are built. On a place
  row the same silhouette sits beside its name.
- **The level is always written**: *Level 1*, or that it is not built or
  in work. The picture is never the only way to read it.
- **The seven words with art** (`wordArtOf`) draw their silhouette in
  `on-block` on the word's block, with no windows. Every other word stays
  without art, as today.

**The file model.** Each place is one hand-written SVG,
`places/<word>.svg`, viewBox `0 0 100 142`: the silhouette's shapes first,
then its ten windows in level order. Filled `rect`, `circle` and `polygon`
alone, as today, and the file colors them from the blocks and `on-block`.
A client draws the silhouette and the first `level` windows. The web
inlines it, so level 0 takes `surface-sunken` from the theme. Android
keeps `pnpm --filter @mygame/web drawables`: it writes one VectorDrawable
per place and level, 77 in all, and tints level 0 in Compose.

This corrects the artifact's cost, which said the rule checker and the
converter stood. `artProblemsOf` loses its square viewBox rule and reads
the new palette, `artFramingOf` measures a silhouette instead of a scene,
and the converter's family loop learns to cut a file at a level.
`vectorDrawableOf` itself stands. A waste site, when #787 draws it, is one
single-fill silhouette tinted `ink-muted`, so a dump never reads as a
place. The 38 files and their 38 drawables are retired, and git keeps
them.

### Resources

**A resource reads by its icon, its name and its place, never its color.**
The five accents go, and the icons draw in the current ink. The order is
fixed: money, food, power, material. Each stock shows its icon and name,
its amount in `numeral`, its capacity and rate in `caption`, and a 3 px
line to the capacity. People are one line of words under them. A cost
shows the icon and the number, with the name for a screen reader. A
shortfall says so in words, in `warning-ink`. The season's line stays
under the stocks.

### What registers

The client compares the read it holds with the next one and animates only
the difference, as `finishNoticesOf` does for the fief. Today no town
screen does this, and #844 and #845's finish notice reads the same
comparison. Nothing advances on a timer, and every value drawn is the
server's (N1, N2, ADR 005).

| What happened | What shows | Duration | With reduced motion |
|---|---|---|---|
| A level finishes | the new window pops in; the row writes the level | `calm` | the window is there |
| A place is first built | the silhouette takes its hue | `calm` | it changes at once |
| An answer is right | the card leaves, the next hue comes off the stack, the progress line moves | `calm` | the card changes in place |
| A word is retained | the ring moves | `calm` | the ring shows the new count |
| A skill is earned | the rate changes value, with ADR 042's verdict | `calm` | the new value shows |

Each row also speaks, through the `LiveRegion` on the web and its
equivalent on Android: motion and picture are never the only way to know.
Every row uses `calm`, so no duration token is added. The artifact's
700 ms on the rate is dropped.

**The ring counts retained words, not days.** A learned word, in this
game, is a retained one (ADR 036), so that is what the ring shows: the
words at `retained` in the first lesson whose skill is unearned, among
the words the player holds. `TownOverview.learning` gains that count and
that total, nullable, and the ring hides while it is null, so no client
computes it (N1). It falls back when a later answer clears `retainedAt`,
as the school path does (ADR 042), and never counts a run of days (PRD
W10).

The ring is slow on purpose: it stays at 0 until the first word is
retained, a week or more after its lesson. The artifact moved it on every
right answer, and that would have promised memory a right answer has not
proved. Each answer moves the card and the progress line, and the steps
before `retained` show in the school path's counts of #842. Whether
retained words should do more than this is #850's question, not this
ADR's.

**A closed tab shows nothing.** The comparison needs a read to compare, so
it plays while the app stays open: after a re-read at
`work.slot.finishesAt`, which plays a level finish, at
`lessonSlot.finishesAt` or `nextDueAt`, or on regaining focus, as
`useTown` already reads. A fresh load shows the final state, and the
Report's news says what finished. No client stores the last seen state,
and ADR 042's return visit stands. The artifact's *you come back after a
while* is that open tab.

### Web and Android

**One design system, one source, generated.** `apps/web/src/design/tokens.ts`
stays the source. A new `pnpm --filter @mygame/web tokens` writes the
values of `core:designsystem` from it, committed, and the web suite fails
on a drift. It covers every family of `tokens.ts` that Android has: color,
type, spacing, radius, size, stroke width and motion, the durations, the
easings and the transitions. This is the check ADR 034 asks for, in the shape the repo already trusts for
`drawables` and the catalog: a generator and a test over its output, in
place of a second list compared by hand. `MyGameColorsContrastTest` stays.
The Compose and React components stay each client's own, as
`ui-components.md` says, and an Apple client would read the same source.

| | Web | Android |
|---|---|---|
| Color | `tokens.ts`, 20 tokens, its test pairs | generated `MyGameColors`, 20 fields |
| Type | Google Fonts link in `__root.tsx` as `Schibsted+Grotesk:wght@400..800`, no `ital`; `typeFamilies.sans` | generated `MyGameTypography`; one TTF in `res/font` and its OFL in `assets`; the two Atkinson files go |
| `meta` | CSS `text-transform` | uppercased when drawn, the original string kept for TalkBack |
| Navigation | `AppShell` loses the bar and the sign-out | `MyGameNavigationBar` leaves the town |
| Art | inline SVG | 77 generated drawables; `PlaceArt.kt` indexes by level |
| Registering | one pure comparison beside the hook that re-reads | the same in each `ViewModel`, read through `MyGameTransitions` |
| Reduced motion | `prefers-reduced-motion` | the system's animator scale at 0 |

## Considered options

- **Bricolage and Schibsted, as the artifact shows.** Closest to Hello,
  and refused by the table above: the English word cannot be set in a
  face whose *I* and *l* are one shape.
- **Bricolage for numbers and titles alone, Schibsted for the rest.** It
  keeps some of Hello's voice. But every title is English the player
  reads, ADR 038's chrome is taught as words, and *4 words* would mix two
  faces on one line. At 800 the two are close enough that this buys 408 KB
  and a rule to police for little that a player would see.
- **Atkinson for the frames alone.** It leads at the reading size, which is
  the real case for it, and *The type* says why that lead does not reach a
  learner.
- **Atkinson for the word and the frame.** The owner's question, and the
  safe-looking answer. At word size Schibsted leads on six of the nine
  pairs, *rn*, *m* by 0.109, so this keeps a tie at the reading size and
  gives up the lead where the word is largest.
- **A shipped dark default.** The first brief asked for it. Hello is light
  and outranks it, and both clients already follow the system.
- **Keep the color illustrations and restyle around them.** The cheapest
  art. Their pastel skies are the brightest thing on a dark screen and
  they do not change at a level, so they fail both halves of the owner's
  complaint.
- **Resource colors kept as small accents.** They are 5 of the 43, and
  they are the first thing to disagree with four block hues. Icons and
  words already carry the meaning, as `ui-components.md` requires.
- **Compare tokens across clients instead of generating them.** A second
  hand-written list and a test that reads Kotlin. It costs more than the
  generator and catches less.
- **Remember the last seen state, to play the changes on return.** It
  would make a return visit lively, at the price of client state that
  disagrees with the server, and ADR 042 rejected greeting a return.

## Consequences

**Expensive to reverse.** The owner saw both before accepting:

- The color illustrations retire, and with them the look of the town and
  of the seven word cards. The files stay in git. Only 7 words ever had
  art, and they keep a silhouette, so learning loses little.
- The Hello look replaces the signed Townword Design System of #720.
- Atkinson leaves, a face chosen for legibility. It ties Schibsted on
  letters at the reading size and leads on *i*, *l* at word size. Bringing
  it back takes a new ADR.

**What stands, verified.** PRD N7 needs no change: a silhouette is
hand-written SVG, the file is its source, and it complies with the bible.
N8 and the ADR 009 token mechanism stand, and `ui-components.md` already
holds every rule this look obeys. No new term enters `CONTEXT.md`, since
*silhouette*, *block* and *door* are design words, not game ones.

**What this ADR amends, in this change:**

| Row | Change |
|---|---|
| ADR 035, *The visual design is replaced* | flat bright illustration gives way to silhouettes; the one legible family stands |
| ADR 030, its art amendments | a new amendment: a place is a silhouette, one file per place |
| ADR 034, *One design system* | the check takes the generated shape above |
| ADR 040, *Navigation*, the order, the images | the bar goes; these are the tokens that come first; the art follows this ADR |
| ADR 041, *The navigation grows with the screens*, the edits of #774, #776, #783 and #784 | News and the map arrive as rows, not as navigation entries |
| ADR 042, *What differs from the shipped screens* | the rows that name the shell and the art read this ADR's |
| PRD S4 | a place has its silhouette, a resource its icon, never an image |
| `docs/art/art-bible.md` | status, Style, Palette, Framing, Consistency, Model and size |
| `docs/art/catalog.md` | the families |
| `docs/setting/town.md` | a place is a silhouette; its rows describe the place, not a picture |
| `docs/setting/chrome.md` | *map*, *news* and *report* name a row or a door, not the navigation |

**The order.** The first ticket changes most of what the player sees, so
it goes first, ahead of every open town screen ticket: #774, #776, #779,
#780, #783, #784, #787, #788, #791, #792 and #840 to #849. They draw on
these tokens, by ADR 040's rule that no town screen is drawn twice. One
exception: #859 merges first, on the current tokens, and the tokens ticket
moves its `bg-badge`, its `bg-right-soft` and the tab bar's due count.

The look goes first on the screens too. Items 4 to 6 below land before
#841, #842, #843, #846 and #847, so the remaining ADR 042 screens are
built once, in the new look. #840 is blocked by items 2 and 3, so it draws
the new look from the start and uses no deleted art. It owns the Android
words screen, and item 6 keeps no words row on Android.
It does not wait on #751. Those medieval files take each dropped token's
successor from the table above, a value change in code that is going, and
no token survives for them. That is no shim: nothing bridges old and new.

It does not wait on the art either. `artPalette.ts` builds the allowed
fills from `scene-*` and the accents, and four tests read `scene-*`:
`townArtFraming.test.ts`, `artFramingOf.test.ts`, `artProblemsOf.test.ts`
and `vectorDrawableOf.test.ts`. Dropping the tokens alone would fail all 38
SVGs. Item 1 moves those hex values into `artPalette.ts` and those tests
as the old art's own constants, used by no screen, and item 3 deletes them with the
files they check.

**What the tickets must close.** This list is the scope, and it holds no
ticket:

1. **The web's tokens and type.** `tokens.ts` to this ADR's values,
   `tailwindTheme.ts`, the font link, `tokens.test.ts` with every pair
   above and the four exemptions, every use of a dropped token moved. The
   `ledge` shadow removed from its 12 files, the accents from their 9.
   The old art's colors kept in `artPalette.ts`,
   `townArtFraming.test.ts`, `artFramingOf.test.ts`,
   `artProblemsOf.test.ts` and `vectorDrawableOf.test.ts`.
2. **The token generator and the Android values.** `tokens` writes
   `core:designsystem`, its drift test in the web suite, the bundled TTF
   and OFL, every read of a dropped color moved, in about 17 Kotlin
   files. The rendered words of *The type* checked on a device, to its bar.
   `ui-components.md` and `apps/android/CLAUDE.md` lose *until the check
   lands*.
3. **The silhouettes.** Seven `places/<word>.svg` from the artifact's
   shapes, `artProblemsOf`, `artFramingOf`, the drawables' level loop; the
   35 place and 3 waste files and their drawables deleted; `placeArtOf`,
   `wordArtOf`, `PlaceArt.kt` and `PlaceArtTest.kt` rewritten; the art bible and catalog rewritten so their
   amendment notes go.
4. **The web's shell.** The doors, the back link and every text link at
   `control` height, the header, the thin mail line, sign-out on the
   Report, the due count from the tab bar to the door.
5. **The web's screens.** The town home, the school, the words, the
   review, the Report, each with one ink pill and a test that says so.
6. **Android's shell and screens**, the same rows but the words screen,
   which #840 owns, with `MyGameNavigationBar`
   off the town.
7. **The ring.** `TownOverview.learning` gains the count and the total,
   the ring on both clients, `openapi.json` regenerated. This is the
   look's one wire change.
8. **What registers.** The comparison and the table's rows on the web,
   then on Android, each with its reduced-motion state and its spoken line.
9. **The notes and the open tickets.** `apps/web/CLAUDE.md` and
   `apps/android/CLAUDE.md` for each change above, including the Android
   note *Labels are sentence case, never `uppercase()`*, which `meta` ends.
   #753's PRD rewrite keeps S4's amendment. When the tickets are written,
   the open tickets' criteria that this look contradicts change:
   - #774, #776, #783, #784: *joins the navigation* becomes the row.
   - #841: *the card holds the one strong button* becomes the pill under
     the block.
   - #842: *the lesson slot and the learning load after it on a phone*
     becomes this ADR's order, under the next lesson.
   - #840: *draws the place's art where the word names one* reads the
     silhouette, and it gains its two blocking edges.
   - #845: *shows the due count on Report* reads the door, and
     `SignedInFrame` loses the bar.
   - #787, #788: *draws each waste site with its image* reads the
     silhouette, and these tickets hand-write the three `waste/` files that
     item 3 deletes, with their drawables.

## References

- The artifact (https://claude.ai/artifact/Xdp9JZ7hkLdr3uvAjGm9sZ, #855).
  Where it and this ADR differ, this ADR holds: the type, the ring, the
  rate's duration, the art's cost, the town home's order.
- ADR 005 (lazy evaluation), ADR 009 (the token mechanism), ADR 034 (one
  design system), ADR 035 (the visual design), ADR 036 (rule 7), ADR 040
  (navigation, the order), ADR 042 (the next step, the school path).
- `.claude/rules/ui-components.md`, `docs/art/art-bible.md`,
  `docs/PRODUCT_REQUIREMENTS.md` (N1, N2, N7, N8, S4, W10).
