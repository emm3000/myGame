---
status: accepted
date: 2026-10-09
---
# The visual layer

## Context

S22 rebuilt the signed-in screens as structure only and named the
visual look a later slice (ADR 027, Decision 1 of #463); S25 closed the
research gaps and left the Design System at v26 (ADR 028). Every card,
slot, strip cell, plot tile and banner was then framed by a hairline,
`line` or `line-strong`; the cards, the held and own plots, the bar,
the hints, the banner and the chronicle list also sat on a one-pixel
`line` shadow, while the slots and the strip cells did not; radii were
2 and 4 px, the display sizes were 40/44 and 26/32, the level badge
was `umber` on every card below its top level (the max-level badge was
`moss` already), the tracks were 4 px, the icons drew at a 1.75 px
stroke, and nothing animated. On 2026-10-09 the owner asked for a
look that reads modern and clean with the medieval tone kept (*que se
vea moderno y limpio*). #533 explored two directions on one artifact
(https://claude.ai/artifact/R4RJ9muoA3HodGm5Wjr19q), each drawn over
the fief at 1280 and 390 px in Parchment and Ledger and the map at 390
px with the form open, with its token delta, its component rules, its
computed WCAG table and its cost: **A, Parchment pared back**, which
keeps every colour of `tokens.ts` and removes the lines, and **B, Woad
and limestone**, which replaces the ground, the accent and the type.
The owner chose A the same day. The umbrella #534 grilled six
decisions. #535 republished the Design System at **v27** (the
platform's own counter reads 31) and the fief mockup at **v32** (the
platform's counter reads 34) in place, and its closing comment holds
the token delta and the component-rules table that #534's Decision 5
made the contract. #536 applied them in PR #538: `tokens.ts` line for
line, `tailwindTheme.ts`, their two tests and 26 component and route
files, with #526's measurements re-run and screenshots of every
affected screen at 390 and 1280 px in both themes. This ADR records
what shipped, checked against the code on trunk, and changes no code.

## Decision

- **Direction A: the palette stays, the lines leave, a card sits on a
  shadow** (#533; the owner's choice on 2026-10-09). No palette value
  moves: the 24 colours of `tokens.ts` keep their Parchment and Ledger
  hex, and every pair `tokens.test.ts` declared keeps its ratio. What
  changes is the token delta of #535, shipped as it reads in
  `apps/web/src/design/tokens.ts`:

  | Token | Trunk until S26 | Shipped |
  |---|---|---|
  | `spacing[5]` | absent | `20px` (a card's padding, `p-5`) |
  | `heights.track` | absent | `6px` (`h-track`) |
  | `strokeWidths.icon` | absent (`1.75` written in `IconFrame`) | `1.5` |
  | `radii.sm` | `2px` | `4px` |
  | `radii.md` | `4px` | `8px` |
  | `shadows.card` | `0 1px 0 ${color('line')}`, one value | `{ light: '0 1px 3px #2a20171a', dark: '0 0 0 1px #efe4cf24' }` |
  | `transitions.track` | absent | `width 400ms ease-out` |
  | `typeScale['display-xl']` | 40/44, weight 600 | 36/40, weight 500 |
  | `typeScale.title` | 26/32, weight 600 | 24/28, weight 600 |
  | `typeScale.label.letterSpacing` | `0.08em` | `0.06em` |

  `#2a20171a` is `ink` (Parchment) at 10 %, `#efe4cf24` is `ink`
  (Ledger) at 14 %: shadow values, not palette tokens. The track takes
  its own `heights` record and not `sizes`, because `size-*` sets width
  and height together and the track is `w-full`. `tailwindTheme.ts`
  emits a `--shadow-<token>` variable per scheme beside the colour
  variables and maps `shadow-card` to `var(--shadow-card)`, so one
  utility switches with the theme as a colour does; `h-track` is added
  under the theme's `extend`, and the plugin adds one utility per
  transition token, `.transition-track`. `strokeWidths` has no Tailwind
  exposure, by contract: a stroke width is an SVG attribute, and
  `IconFrame` reads `strokeWidths.icon` as its `strokeWidth` prop.
  `__root.tsx` loads Cormorant Garamond at 500 beside 600 for the new
  display weight.
- **The frame rule** (#535's component-rules table, applied row by row
  in PR #538). `Panel`, the frame of every card and of `AuthPanel`,
  draws `rounded-md shadow-card` with no border; a tone that wants a
  frame says so. Frames that stay, each because it carries a meaning:
  the dashed `line` frame of an idle slot, a free or camp plot, an idle
  strip cell, a locked unit card and an empty chronicle (dashed means
  empty); the dashed `line-strong` frame of a reserved plot on
  `surface-sunken`; the `moss` border of an affordable card, of a
  just-finished slot and of the banner's outcome line; the 2 px `river`
  frame of the own plot and of the current fief switcher entry; the 4
  px `ochre` left stripe of the banner; the `line-strong` border of
  every control; the `line` rules inside a card (the cancel row, the
  chronicle rows, the bar's peasants divider) and the `border-b` of the
  header and of the sticky status block. `WaitingUpgrades` keeps its
  solid `line` frame: it is a sub-section of the page, not a card. A
  busy slot, a busy strip cell, a held plot, a free plot with an action
  open, the bar, a hint and the chronicle list sit on `surface-raised`
  with `shadow-card` and no border; the banner sits on the same with
  its `ochre` stripe as its only border. A `Panel` card and a slot pad
  `p-5` (`LockedUnitCard`, outside #535's table, keeps `p-4`), the bar
  `p-4` (from `p-3`) and the strip cells keep `p-3`. The level badge of `CardHeader`,
  `BuildSlot` and `WaitingUpgrades` moves from `umber` to
  `surface-sunken` with `ink` text, a declared text pair at 11.40:1 in
  Parchment and 14.79:1 in Ledger; the max-level badge keeps `moss`,
  and `on-umber` on `umber` now serves the primary `Button` and the
  plot marker alone. The toggle's track and thumb are round
  (`rounded-pill`), and the busy strip cell's heading loses its
  underline, since the whole cell is the link. `AppShell`'s `h1` steps
  from `display-xl` to `title`; `AuthPanel`'s `h1` keeps `display-xl`.
- **Ledger keeps a visible edge: a low-alpha hairline, not a surface
  lift** (#534, Decision 1; #535). A soft shadow on a dark ground is
  near invisible, so `shadows.card.dark` is `0 0 0 1px #efe4cf24`:
  `ink` at 14 %, spread 1 px, no blur. Composited over `surface-raised`
  the edge pixel measures **1.65:1 against `surface`** by the WCAG 2.2
  formula of `tokens.test.ts`, the ratio the `line` hairline gave in
  Ledger until S26, so a card is told from the page as well as before,
  by an edge and not by colour alone, while Parchment loses its line
  and gains a blurred shadow. The alpha, not `line`, so the edge
  composites on whatever the card fills (`surface-raised`, the
  max-level card's `surface-sunken`) and the token stays a shadow: one
  utility in both themes. The one-step surface lift, `surface-raised`
  on `surface` with no edge, measures **1.12:1** in Ledger and 1.11:1
  in Parchment, and was rejected. WCAG 1.4.11 does not bind a card
  boundary; the research note's grouped density does.
- **Motion is one track transition, opt-out** (#534, Decision 3; PR
  #538). `transitions.track` is `width 400ms ease-out`, exposed as
  `transition-track` and applied in `Track.tsx` alone, on the fill
  `<rect>`, as `motion-safe:transition-track`, which Tailwind compiles
  to `@media (prefers-reduced-motion: no-preference)` (WCAG 2.3.3).
  Nothing else animates: no fade on a just-finished slot, no hover or
  focus motion, no entrance. ADR 027's repaint rules are untouched: a
  track repaints at most once a minute, and every second in any
  countdown's last minute (`repaintDelayMsOf`), so the transition plays
  at most once a minute, and up to once a second in a countdown's last
  minute, each time the fill's rounded percent changes.
  The fill's `width` is an SVG presentation attribute; in SVG 2 it is a
  geometry property, so a CSS transition on `width` runs when React
  rewrites the attribute. That was measured in headless Chromium only:
  under `no-preference` the computed transition reads `width 0.4s
  ease-out` and the width is mid-way two frames later; under `reduce`
  no animation runs and the width lands at once. Outside Chromium the
  transition is unverified, and where a browser does not transition the
  geometry property the fill jumps, as it did on trunk.
- **Icons draw at a 1.5 px stroke, in the same colours** (#534,
  Decision 4; #535). The stroke moves from 1.75 to `strokeWidths.icon`,
  1.5, and no colour moves, so every icon pair keeps its 3:1. #535 drew
  the nineteen icons at 1.5 at 16 and 20 px in both themes, each in the
  colour it takes on a screen, and read each on the rendered board at
  1x and 2x: every icon is legible at both sizes, the winter snowflake's
  six arms stay separate at 16 px, the cavalry's five nails are the
  finest mark in the set, 1 px dots at 16 px, and `cavalry` never draws
  at 16 px on trunk (`UnitCount` and `MarchSlot` use `size-icon`), so
  no icon needed a fix. `docs/art/art-bible.md` states 1.5 since this
  ADR; ADRs 021, 023 and 025 keep the 1.75 of their own slice.
- **Nothing shipped by #526 regresses** (#534, Decision 2; PR #538).
  With the display sizes a step down and 6 px tracks, PR #538 re-ran PR
  #531's queries on its seed: `scrollWidth` reads 320 at 320 px on the
  fief, the map with the form open and the chronicle, nothing but an
  `sr-only` span overflows, every target keeps 44 px, and at 768 px
  with five busy cells every time span's right edge sits at or left of
  its cell's, one pixel left of #531's values. The cells keep `p-3`,
  so their widths are unchanged.
- **Design first, the delta as the contract** (#534, Decision 5; #535;
  #536). The Design System moved to v27 and the mockup to v32 in place
  before any web ticket, the delta is the contract, and PR #538's
  `tokens.ts` diff prints exactly the delta's rows, old line as `-` and
  new line as `+`, with no palette hex among the removed lines. The
  component-rules table was applied as written; `Button` and
  `UnitCardHeader` take their change through the tokens alone.

## Considered options

- **Direction B, *Woad and limestone*** (#533): a cool limestone
  ground, graphite ink and one accent, woad blue, in place of `umber`,
  `river` folded into it, Marcellus for names and Alegreya Sans for all
  text, hairlines kept, no shadow, a square badge; 24 files, 14
  components, two waves. Declined by #534's Decision 6: a palette and
  type change for two waves with no evidence of benefit beyond taste.
  `docs/research/engaging-strategy-ui.md`, under HUD and glanceability,
  finds that juiciness, visual embellishment, improved visual appeal in
  every game tested but affected competence only under specific
  circumstances (Hicks et al. 2019), and concludes that polish is not a
  proven motivator. B's extra margin on the contrast pairs and the
  three ochre exemptions it made needless did not outweigh that: every
  declared pair already passes, and the exemptions stay as they were.
- **The one-step surface lift as Ledger's edge.** Rejected by #535's
  measurement: 1.12:1, near invisible; the card would be a card by
  colour alone.
- **`line` as a border in Ledger and a shadow in Parchment.** Rejected
  on #535: the edge has to composite on whatever the card fills,
  `surface-raised` or the max-level card's `surface-sunken`, and stay
  one token, `shadow-card`, in both themes; a border would be a second
  utility and a second rule per tone.
- **A fade on the just-finished slot, hover and focus motion, an
  entrance for a card.** None (#534, Decision 3): the one transition is
  the fill the player watches, and ADR 027's repaint rules already set
  how often it moves.
- **The track under `sizes`.** Rejected on #535: `size-*` sets both
  axes and the track is `w-full`, so a 6 px height is a `heights`
  record and `h-track`.
- **A Tailwind utility for the stroke width.** Not added: a stroke
  width is an SVG attribute on `IconFrame`, not a class on an element,
  so `strokeWidths` is a token family the component reads directly.
- **Dropping the dashed, `moss` and `river` frames with the rest.**
  Rejected by #535's frame rule: each carries a meaning the shadow does
  not, dashed means empty, `moss` means affordable, `river` means
  yours, and each already has its words beside it.
- **A shadow on `WaitingUpgrades`.** Rejected on #535: it is a
  sub-section on the page, not a card, so it keeps the solid `line`
  frame.

## Consequences

- ADR 027 is amended in two lines: its Context sentence *the visual
  look is a later slice* and its Consequences item that lists the
  visual look as out of scope each point here.
- `apps/web/CLAUDE.md` describes the tokens and the component rules as
  shipped: the heights, the stroke widths, the per-theme shadow, the
  transitions, `spacing[5]`, the radii, the type scale, the frame rule,
  the badges and the one transition. `docs/art/art-bible.md`'s UI
  icons line states the 1.5 px stroke.
- `CONTEXT.md` is unchanged: a token, a frame, a badge and a track are
  screen vocabulary, not domain terms.
- PRD: no row changes; the slice binds N8 and keeps every Won't-have.
- `tokens.test.ts` declares 40 pairs: `ink` on `surface-sunken` is
  added for the three badges, and the `usedBy` of `on-umber` on `umber`
  loses them. The four ochre exemptions stay needed, each still under
  its minimum in Parchment.
- The Design System's version by the tickets' count and the platform's
  counter drift further apart: v27 against 31, and the mockup v32
  against 34 (ADR 028 recorded the mockup at 31 against 32). The
  tickets keep counting by their own number.
- Known gap (the review of PR #538): the track transition is verified
  in headless Chromium alone. WebKit's and Gecko's handling of a
  transition on an SVG `rect`'s `width` geometry property was not
  measured; where it does not apply, the fill jumps as on trunk.
- Known gap (the review of PR #538): #536's criterion that `rg -n
  'transition|animate-' apps/web/src` print lines from `Track.tsx` and
  its test alone was too wide, because the delta names the token
  `transitions` and the utility built from it, so `tokens.ts`,
  `tailwindTheme.ts` and its test match the word. The intent held: the
  one transition applied to an element is `Track`'s fill.
- The nineteen icon files of the Design System were re-uploaded at 1.5;
  the 1.75 uploads stay in the artifact's asset store, unreferenced.
- Out of scope of #534, each a future ADR or an amendment of this one:
  any palette value, the house colours the art bible leaves open, a
  type family, and any motion beyond the track. Painted art in the
  first viewport, the band, the bar art and the map plate, is ADR 030.
