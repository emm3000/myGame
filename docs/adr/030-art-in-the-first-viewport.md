---
status: accepted
date: 2026-10-10
---
# Art in the first viewport

## Context

S26 shipped direction A (ADR 029): the lines left, a card sat on a
shadow, the radii, the track and the stroke moved. The owner's verdict
on 2026-10-09 was *se ve igual*. The diagnosis of the umbrella #551:
direction A changed sub-perceptual properties only, and the first
viewport of every screen was still text on beige. The only painted art,
the building cards, began below the fold; the map was text tiles
(`PlotTile`); the sign-in was a plain panel (`AuthPanel`); the five
rendered resource images under `apps/web/public/art/resources/` had no
consumer, and the five resource WebPs are opaque parchment squares with
no alpha channel. The owner delegated every decision to a design lead
on Fable, who self-grilled the plan and set seven forks (#551):

1. Village view or hero band: **hero band**. A village needs 35 sprites
   at one angle, an S29-scale Codex run.
2. Hero source, raster or code-drawn SVG: **the SVG `SceneBand` ships
   first**; three raster terrain plates are optional, through
   `sceneArtOf(terrain)` answering `undefined` until a path is listed.
3. Bar icons at a 16 px stroke or the rendered resource art: **the art,
   40 px from `md` and 28 px below**, from 96 px WebP derivatives; the
   strokes stay for every use at 24 px or less.
4. The peasants cell: **one new Codex object image**, a hat on a hoe
   beside a sickle, no people; `PeasantsIcon` in a roundel until it
   lands.
5. The map: **the terrain plate behind the grid**; tiles keep their
   solid surfaces; camp tiles get `camp-<tier>-96.webp`.
6. Does the band hold the sticky block: **no**, it sits under the block
   in `FiefScreen`'s header (#506's measured margins).
7. The season in the band: **a sky tint in the SVG only**; colour
   carries no information, the season line says it.

#552 designed it (Design System **v28**, the platform's counter 33;
fief mockup **v33**, the platform's counter 36, both republished in
place) and its closing comment set ten decisions and the token delta as
the contract for the web tickets. #554 (PR #559) carried the scene
family and the thumbnail rule into the art bible and the catalog; #553
(PR #560) shipped the band on the fief and the guest screens; #556 (PR
#561) the bar art; #557 (PR #562) the map plate and the camp
thumbnails. #555, the three raster plates and the peasants image, is
the owner's Codex run and is open as this ADR is written. This ADR
records what shipped, checked against the code on trunk, and changes no
code.

## Decision

- **Painted art enters the first viewport of the fief, the map and
  the sign-in, reusing the art the repo has, with code-drawn fallbacks
  so nothing waits on Codex** (#551). Palette and type stay: no value of
  `palette` in `apps/web/src/design/tokens.ts` moves, and every pair
  `tokens.test.ts` declares keeps its ratio, because no text sits on an
  image: the band carries no text node, the fief name and the season
  line sit under it on `surface`, the guest panel is `surface-raised`,
  every plot tile keeps its own surface.
- **The band is one `svg` drawn from the palette tokens alone**
  (`apps/web/src/design-system/SceneBand.tsx`; Forks 2 and 7; #552,
  decisions 2 and 9). `SceneBand` takes `terrain`, `season`, `artSrc`
  and `isFullBleed`. Its box is `aspect-3/1 max-h-band w-full
  overflow-hidden`, `rounded-md` unless `isFullBleed`, so the ratio
  holds up to 720 px of width and above it the drawing is cropped top
  and bottom with the horizon kept, by `preserveAspectRatio="xMidYMid
  slice"` on a 1200 by 400 `viewBox`. The box needs the definite
  `w-full`: with `width: auto` a block honours `aspect-ratio` by
  shrinking its width once `max-height` clamps. The sky is a
  `surface-raised` rect, a radial glow of `ochre` from 40 % to 0 and a
  sun disc of `ochre` at 55 %: no new colour, and no `gold` disc, which
  reads as mud in Parchment (`#886c14`). The season is one rect over the
  sky: `river` at 18 % for spring, `gold` at 22 % for summer, `ochre` at
  30 % for autumn, `slate` at 34 % for winter, none for `season: null`.
  The box is `aria-hidden` and carries `data-terrain` and `data-season`
  (`none` for null), which the route tests read since a hidden drawing
  has no role or text to query. Nothing animates: `rg -n
  "transition|animate" SceneBand.tsx` prints nothing. The ridges scene
  closes its slate layer under the opaque ground so no seam shows
  through the half-transparent iron layer (f03685a).
- **A raster plate lays over the drawing only when `sceneArtOf` lists
  one, and Ledger veils it with `surface` at 35 %** (#552, decision 2,
  as folded by PR #560's review). `apps/web/src/design-system/sceneArtOf.ts`
  is a `Record<Terrain, string | undefined>` and answers `undefined`
  for `lowlands`, `uplands` and `ridges` on trunk; its test is `answers
  no raster scene for any terrain`. Given a path, the band draws it as
  `<img alt="" width="1024" height="1024" decoding="async">` with
  `object-cover` over the `svg`, then a second `svg`
  (`preserveAspectRatio="none"`) whose first rect is `surface` at 35 %
  with `hidden dark:inline`, so Parchment lays nothing, and whose
  second is the same season tint at the same opacity, so the season
  reads the same on both. `surface`, not `ink`: #552 wrote `ink`, the
  review of PR #560 changed it, and the tests `dims the raster scene
  with the surface at 35 %` and `tints the raster scene with the season
  as the drawing tints its sky` fix it. The three plates are
  `apps/web/public/art/scenes/<terrain>.webp`, the terrain as
  `TerrainSchema` spells it, served at 1024 by 1024 (`cwebp -q 78 -m 6
  -resize 1024 0`, the one exception to the catalog's 768 rule, because
  the band is 1216 px wide at 1280), each at most 200 KB, with its
  `<terrain>.prompt.txt` beside it and the contact sheet
  `docs/art/contact-sheets/scenes.png` (#552, decision 6; the bible's
  Scenes rule). The directory does not exist on trunk: #555 lists the
  paths.
- **The fief band sits under the sticky block from `md`, and above the
  bar below it** (Fork 6; the orchestrator's comment on #553).
  `FiefSceneBand` (`apps/web/src/fief/FiefSceneBand.tsx`) draws the
  overview's terrain and season with `sceneArtOf`. From `md` the route
  passes `isSceneInHeader` and `FiefScreen` opens its header on the
  band, then the address link, the name and the season line. Below `md`
  the status block is not sticky and scrolls away, so the fief layout
  (`feudo.$fiefId.tsx`) draws the band above `FiefStatus`, on
  `/feudo/$fiefId` alone, and the first viewport opens on the scene.
  `useIsStatusBlockSticky` (`matchMedia` on `breakpoints.md`, 48rem,
  `false` where `matchMedia` is absent) picks the place, so one band
  renders at a time. PR #560 measured in headless Chromium: at 1280 by
  900 the band spans y 465 to 705 under a sticky block of five busy
  cells; at 1280 by 720 the band is in view and the fief name is below
  the fold; at 390 by 844 the band's top is at y 304, inside the first
  viewport, and the bar follows it.
- **The guest screens draw the vega with no season, full bleed, the
  panel overlapping its foot** (#552, decision 5). `AuthPanel` draws
  `SceneBand` with `lowlands`, `season: null`,
  `sceneArtOf('lowlands')` and `isFullBleed`; the next block is
  `relative -mt-12`, 48 px over the band's foot; the game's title
  (`copy.shell.title`, *Vadoalto*) moved inside the panel above the
  `h1`, so no text sits on the band. No fief is on the wire for a
  guest, so the first kingdom's river plain and no season claim the
  server did not make. The five guest screens share the frame through
  `AuthPanel`.
- **Each resource cell of the bar opens on its art in a ringed
  roundel** (Fork 3; #552, decision 3; PR #561).
  `apps/web/src/design-system/resourceArtOf.ts` is the only file that
  knows a resource image's path, `/art/resources/<kind>-1-96.webp` for
  the five resources and `undefined` for `peasants`. `ResourceBar`'s
  `CellArt` draws `<img alt="" width="96" height="96">` cropped by
  `rounded-pill` and `object-cover` with a 1 px `border-line` ring, at
  `size-roundel-sm` (28 px) and `md:size-roundel` (40 px). The ring
  because the WebPs are opaque parchment squares and read as pale
  stickers on Ledger's `surface-raised`; cropped to a circle with the
  ring they read as medallions in both themes, the same silhouette as
  the peasants roundel, so the six cells open alike. The label wraps
  under the art and the capacity under the amount (`flex-wrap`), the
  320 px shape #523 named. The stroke icons stay on every use at 24 px
  or less: `CostList`, `ArtCard`, the `FiefSwitcher` chips and the
  hints each still draw `<Icon />`.
- **The peasants cell draws `PeasantsIcon` in a `surface-sunken`
  roundel until its art lands** (Fork 4; #552, decisions 4 and 7).
  `CellArt` falls back to a `bg-surface-sunken` disc of the same
  roundel size with the accent's icon at `size-4 md:size-icon`. The
  pair `peasants` on `surface-sunken` computes 5.69:1 in Parchment and
  5.39:1 in Ledger from the trunk palette by the formula of
  `tokens.test.ts`. The image is `apps/web/public/art/resources/
  peasants-1.webp` with its derivative `peasants-1-96.webp`, accent
  *ochre and umber*, the warehouse's phrase, because the `peasants`
  token is `umber` and umber alone is never the brightest element in a
  frame; the hat's straw carries the light in ochre, the hoe's wood in
  umber. When it lands, `resourceArtOf`'s `peasants` entry takes the
  path and the `ResourceBar` test `draws no art in the peasants cell
  while no peasants art is listed` is replaced; `resourceArtOf.test.ts`
  (`lists the peasants art only once its derivative is under
  public/art`) fails until the entry is set, by design.
- **The province grid sits on its terrain plate** (Fork 5; #552,
  decision 10; PR #562). In `MapScreen` the plots `ul` sits in a
  `rounded-md` well of `surface-sunken` (`overflow-hidden pb-3`) whose
  top is `SceneBand` for `map.terrain` with `sceneArtOf(map.terrain)`.
  The season is the one of the fief the map is read from:
  `ProvinceMapPage` passes the `useLayoutFief` overview's
  `season.kind`, or `null` while it loads or before the first spring.
  The list is `mx-3 mt-3` under the band and overlaps its foot by
  `md:-mt-8` (32 px) from `md`, where the band is up to 240 px tall;
  below `md` it gets no overlap (PR #560 measured the band 119 px tall
  at 390 px). The
  heading and *Terreno: …* stay above the plate on `surface`. Every
  tile keeps the surface and frame it had: the diff of `PlotTile.tsx`
  touched no `frameClass`, `bg-surface` or `border-` line. The own
  tile's 2 px `river` frame now also meets `surface-sunken`, at 3.89:1
  in Parchment and 7.45:1 in Ledger; the dashed `line` frame of a free
  tile against the well measures 1.35:1 and 1.75:1, as it measured
  1.53:1 and 1.65:1 against `surface`, a card boundary WCAG 1.4.11 does
  not bind (ADR 029), and the free tile still reads *libre* in words.
- **A camp tile draws its tier's 96 px thumbnail above the row it
  had, and `CampIcon` stays** (#552, decision 1).
  `apps/web/src/design-system/campThumbnailOf.ts` resolves
  `/art/camps/camp-<tier>-96.webp`, in its own file beside `campArtOf`,
  which keeps resolving the 768 image for the attack form. `PlotTile`'s
  camp holder takes `artSrc` and draws `<img alt="" width="96"
  height="96">` at `size-thumbnail rounded-sm object-cover` at the top,
  then the row trunk had: the tent in `ochre` at `size-icon` beside
  *Campamento de bandidos*, then *nivel N, fuerza M*. Stacked, not side
  by side: on #552's 390 px board a tile is 167 px wide, and 96 px of
  image beside an 18 px bold name leaves 39 px for the words. The camp is still told by
  the tent while the image loads, and the tier stays in words. So PRD
  S4's last clause, *the camp keeps its icon on the map's plot tile*,
  stays true and this ADR amends no row: the thumbnail is an addition.
- **The thumbnail is a derivative, never a regeneration** (Fork 3;
  the bible's Thumbnail rule, PR #559). An image drawn at 96 px or less
  is served from `<name>-96.webp` beside its 768 source, made with
  `cwebp -q 78 -m 6 -resize 96 0 <in> -o <out>`, at most 10 KB, with no
  prompt of its own. The eight on trunk:

  | File | Bytes |
  |---|---|
  | `resources/wood-1-96.webp` | 1 960 |
  | `resources/stone-1-96.webp` | 1 062 |
  | `resources/iron-1-96.webp` | 1 346 |
  | `resources/gold-1-96.webp` | 1 756 |
  | `resources/food-1-96.webp` | 2 244 |
  | `camps/camp-1-96.webp` | 3 126 |
  | `camps/camp-2-96.webp` | 3 132 |
  | `camps/camp-3-96.webp` | 2 884 |

  `fd -S +10k -- '-96\.webp$' apps/web/public/art` prints nothing.
- **Four size tokens and one max height, no palette change** (#552,
  decision 8 and the token delta, as `tokens.ts` reads):

  | Token | Value | Utility | Used by |
  |---|---|---|---|
  | `sizes.roundel` | `40px` | `size-roundel` | the bar's art from `md` |
  | `sizes['roundel-sm']` | `28px` | `size-roundel-sm` | the bar's art below `md` |
  | `sizes.thumbnail` | `96px` | `size-thumbnail` | the camp tile's image |
  | `maxHeights.band` | `240px` | `max-h-band` | the band |
  | `breakpoints.md`, `breakpoints.lg` | `48rem`, `64rem` | `md:`, `lg:` | Tailwind's defaults, named once; `useIsStatusBlockSticky` reads `md` |

  `sizes.icon` (20 px) predates the slice. `tailwindTheme.ts` puts
  `maxHeight: maxHeights` and `screens: breakpoints` under `extend`
  beside `maxWidth`; `sizes` replaces Tailwind's `size` scale as
  before. `tailwindTheme.test.ts` checks every size token and
  `max-h-band`. The bar's cell top row grows from a 16 px icon
  (`IconFrame`'s default `size-4`, as the bar drew `<Icon />` until S28) to a 40 px roundel from `md`, so the
  sticky block grows by 24 px, not the 20 #552 expected: PR #561
  measured `--status-block-height` at 768 px from 531 to 555 and at
  1280 px from 361 to 385, and every strip link still lands its section
  at or below the block (`scroll-mt-status` follows the measured
  height, #506).
- **Design first, the delta as the contract** (#551; #552). The Design
  System moved to v28 and the mockup to v33 in place before any web
  ticket; the closing comment's ten decisions bound #553 to #557, and a
  peer that found one contradicted by trunk reported instead of
  adapting. Two folds happened in review, both recorded above: the
  Ledger veil token (`surface`, not `ink`) and the band's place below
  `md` (above the bar, not under the block). A third, outside #552's
  table: `Chip` lost `whitespace-nowrap` and took `max-w-full`, so a
  switcher chip's *Almacén lleno* line wraps inside the chip at 320 px
  instead of overflowing.

## Considered options

- **A village view** (Fork 1): the fief drawn as a scene of its
  buildings. Declined: 35 sprites at one angle is an S29-scale Codex
  run, and if the owner still says *igual* after S28, S29 is the
  village view.
- **Raster plates as the only band** (Fork 2): the fief would have
  waited on Codex. The SVG ships first as the fallback and as the
  ground of the map plate, where a flat drawing under solid tiles is
  the right weight. #552 read the SVG next to the rendered art and
  found it clean but a different medium, plainest on the map beside
  the camp thumbnails, and recommended the raster plates as required
  for the fief's first viewport; the orchestrator accepted: the fief
  band is done only when `sceneArtOf` answers the three paths (#555).
- **A dim overlay on the SVG in Ledger** (`ink` at some alpha over the
  Parchment drawing). Rejected on #552: the band draws every fill from
  the tokens and is drawn in the dark values already, reading as dusk
  by itself; an overlay muddies the hues and reads as a disabled state.
  The one place a veil is needed is a raster plate, which cannot
  re-ink itself.
- **A square frame or alpha-matting for the resource art.** A bordered
  square is still a pale square on Ledger, the corners are the problem;
  matting the parchment away is a regenerated family, a template change
  by the bible's consistency rules. The ringed roundel crops both away.
- **The art beside the name on the camp tile.** Rejected on #552,
  decision 1: 39 px for the words at 390 px. Stacked instead, with
  `CampIcon` kept, so the PRD, the bible and the catalog stay true.
- **Removing `CampIcon` from the camp tile.** It would have amended PRD
  S4 by row id and the bible's UI icons line. Kept: the tent tells the
  camp while the image loads, and a 96 px thumbnail at the top of a
  tile does not replace a 20 px icon beside its name.
- **The band holding the sticky block** (Fork 6): the bar and the
  strip would have moved under the band and the measured margins of
  #506 with them. Declined: the block stays first from `md`, and the
  band follows it. #552 reported that at 1280 by 720 this leaves the
  fief name below the fold and offered `max-h-band` at 200 (a 6:1
  strip) as the lever; the orchestrator kept 240.
- **The season as a drawn change in the scene** (Fork 7): snow, bare
  trees, ripe wheat. Declined: colour carries no information the season
  line does not already say, and one tint rect over the sky is the
  whole seasonal cost. The band is `aria-hidden` for the same reason.
- **A 768 scene plate.** Rejected on #552, decision 6: the band is
  1216 px wide at 1280 and a 768 source upscales 1.6x; a 1024 square
  at q 78 weighs about 150 to 190 KB, under the 200 KB cap, `-q 70` if
  one is over.
- **The band on the map and the chronicle below `md`.** The map draws
  its own plate band; the fief header band renders above the bar on
  `/feudo/$fiefId` alone, the rule `fiefSceneBandRoute.test.tsx`
  guards as *draws no scene band above the resource bar on the map
  below md*.

## Consequences

- ADR 029's out-of-scope item points here for painted art in the first
  viewport.
- `apps/web/CLAUDE.md` describes the band, the resolvers, the roundels,
  the thumbnail and the plate well as shipped, and names this ADR.
- `docs/art/art-bible.md`'s UI icons line states what the plot tile
  draws: the tier's 96 px thumbnail above the tent with a pennant.
  `docs/art/catalog.md`'s consumers paragraph says the same of
  `campThumbnailOf`; its `sceneArtOf` sentence was written by PR #559
  and its `resourceArtOf` sentence by PR #561.
- `CONTEXT.md` is unchanged: a band, a plate, a roundel and a thumbnail
  are screen vocabulary, as ADR 029 ruled for its tokens.
- PRD: no row changes. S4's last clause holds because `CampIcon` still
  draws on the camp tile. The slice binds N8 and keeps every Won't-have.
- `tokens.test.ts` declares **39 pairs**, unchanged by S28: `rg -c
  "kind: '"` prints 39; `rg -c "foreground:"` prints 40 because the
  `Pair` interface's own `readonly foreground: ColorToken` line matches
  too, which is how ADR 029 counted *40 pairs*. Two non-text pairs S28
  draws are computed above and not declared, because #553, #556 and
  #557 froze the file: `peasants` on `surface-sunken` (the fallback
  roundel's icon, 5.69 / 5.39) and `river` on `surface-sunken` (the own
  tile's frame against the well, 3.89 / 7.45). A later ticket may add
  them. The 1 px `line` ring of an art roundel against `surface-raised`
  is 1.70:1 in Parchment and 1.47:1 in Ledger: a boundary around an
  image, not a control, so WCAG 1.4.11 does not bind it.
- `sceneArtOf` answers `undefined` for every terrain and
  `resourceArtOf('peasants')` answers `undefined` until #555, the
  owner's Codex run, lands `scenes/lowlands.webp`, `uplands.webp`,
  `ridges.webp` and `resources/peasants-1.webp` with its `-96`
  derivative and lists the paths. #555 is optional for shipping; the
  fief band is called done only when the three plates are listed.
  `docs/art/contact-sheets/scenes.png` does not exist until then.
- The Design System's version by the tickets' count and the platform's
  counter drift further: v28 against 33, the mockup v33 against 36,
  since the platform counts an asset upload as a version.
- Known gap (PR #560): the raster veil was measured on a probe rect in
  headless Chromium (`display: inline` in Ledger, `none` in Parchment);
  no plate is listed on trunk, so there is no screenshot of a veiled
  plate until #555.
- Known gap (PR #560): at 1280 by 720 with five busy strip cells the
  fief name sits below the fold; the band is in view. The lever, if the
  owner wants the name above the fold, is `maxHeights.band` at 200 or
  the band above the bar from `md`, which Fork 6 declined.
- Known gap (PR #562): the seed has no tier 1 camp in a province with
  room, so the tier 1 thumbnail was checked on the tile by its test
  (`draws the camp image of its tier on a camp tile`) and the mockup,
  not by a screenshot.
- Out of scope of #551, each a future ADR or an amendment of this one:
  the village view (S29 if the owner still says *igual*), any motion in
  the band, a plate for the chronicle, the house colours the art bible
  leaves open, and any palette value.
