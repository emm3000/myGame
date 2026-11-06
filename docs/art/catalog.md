# Art catalog

Every family the game draws. The town's families come first; the medieval ones below them are retired.

## The town

Hand-written SVG under `apps/web/public/art/`, drawn to `art-bible.md` and checked by its rules (Model and size). The web inlines each file. Android draws the VectorDrawables in `apps/android/core/designsystem/src/main/res/drawable/`, cut from each file by `pnpm --filter @mygame/web drawables`.

### Family: places

7 files, `places/<word>.svg`, the seven places of `CONTEXT.md`, the word the `BuildingKind`: a silhouette and ten windows each, one window per level. Android: 77 drawables, `designsystem_place_<word>_<level>`, levels 0 to 10, the word in snake case (`designsystem_place_power_station_3`). A word of `wordArtOf` draws its place's silhouette in `on-block`, with no windows, on the word's block; every other word has no art.

| Word | Silhouette | Hue |
|---|---|---|
| `homes` | two gabled houses side by side | `block-peach` |
| `farm` | a barn with a hipped roof beside a round-topped silo | `block-mint` |
| `school` | a long hall under one roof, with a cupola | `block-periwinkle` |
| `office` | a tall block with a mast | `block-lavender` |
| `factory` | a sawtooth hall beside a chimney | `block-peach` |
| `powerStation` | a low station beside a pylon with two arms | `block-mint` |
| `storage` | a wide shed under one shallow gable | `block-periwinkle` |

The contact sheet of the family shows the seven at levels 0, 1 and 10, in light and in dark, each on the ground it is drawn on: the sheet of #863 is the reference.

### Family: waste

No files yet. A waste site is one single-fill silhouette, `waste/waste-<size>.svg`, sizes 1 to 3, tinted `ink-muted` by the client; #787 and #788 hand-write them with their drawables, `designsystem_waste_<size>`. The drawables' loop keeps the family.

## Retired: the medieval families

Status: retired. Its families are medieval, retired by ADR 035 (`docs/adr/035-townword-an-english-learning-town-builder.md`), and still served under `apps/web/public/art/` until the town rebuild replaces them.

Status: proposal, drafted 2026-09-22 for PRD S4, style switched to stylized 3D animation the same day before any image was generated. Every image the MVP shows, with the prompt that produces it. The rules come from `art-bible.md`; this page only applies them. When the two disagree, the bible wins and this page is edited.

## How to run it

1. Model: GPT Image, 1024×1024, one image per prompt. Run a whole family in one sitting so the style holds.
2. Codex's image tool has no size argument, so the prompts of the families it generates (library, barracks, camps) end with the square output suffix under Common lines, after the tier line. The 25 older building images keep their prompts and are not regenerated. Paste the prompt exactly. If an output breaks a rule (text, people, night, sci-fi material, a different framing), regenerate; never keep an outlier.
3. Codex outputs a PNG at the generation size. Keep the prompt as `apps/web/public/art/<family>/<term>-<tier>.prompt.txt`, byte for byte what was pasted (N7).
4. Lay the family out as a contact sheet from those PNG outputs before committing, and check it against the bible's palette and framing. One outlier means one regeneration; three mean the template changes and the family is regenerated.
5. The PR that adds the art converts each PNG output to a 768×768 WebP with `cwebp -q 78 -m 6 -resize 768 0 <in> -o <out>` and commits the WebP as `apps/web/public/art/<family>/<term>-<tier>.webp` beside its prompt; the PNG output is never committed under `public/`. An image a screen draws at 48 px or less also gets its 96 px derivative, `<term>-<tier>-96.webp` beside the 768 source, with `cwebp -q 78 -m 6 -resize 96 0 <in> -o <out>` (the bible's Thumbnail rule); the derivative has no prompt file of its own. Commit image and prompt together: `feat(art): <family> <term>` or `feat(art): <family>` for a whole family.

Every building has ten levels and five tiers, tier = ceil(level / 2), so a level shows the image of its tier: levels 1 and 2 share `sawmill-1.webp`, levels 9 and 10 share `sawmill-5.webp`. Level 0 shows no image; the screen shows the empty plot state from the design system.

Kingdom terrain for every prompt is Vadoalto's: a wide river valley with pine hills behind, the high ford in the distance (`docs/lore/names.md`). A fief on uplands or ridges shows the same building images; the terrain shows in words on the map.

## Common lines

Every building prompt is the bible's template with three slots filled: `<subject>` from the entry, `<resource accent>` from the family table, and the tier line from the tier table. Written out once here so the entries below stay short; the file `<term>-<tier>.prompt.txt` holds the full text.

```
<subject>, early-medieval river valley with pine hills, stylized 3D animated film look, soft cel shading,
clean readable shapes, slightly exaggerated proportions, warm golden-hour light, gentle rim light,
saturated but harmonious earth palette with <resource accent> as the brightest element,
three-quarter elevated view, subject centered filling 70% of frame, soft sky, ground shadow,
no photorealism, no outlines, no text, no watermark, no people, <tier line>
```

### Square output suffix

```
, square 1:1 composition, output image 1024 x 1024 pixels, keep the entire <framed> and ground shadow inside the square frame
```

`<framed>` is `building` for the library and `subject` for barracks and camps. It follows the tier line after `, `, and only on the families Codex generates. Closing clauses, when a prompt has any, follow it after `, `; they sit under each family heading or in its table, never in the Subject cell. The suffix is output framing, not part of the template.

### Tier lines

| Tier | Levels | Line |
|---|---|---|
| 1 | 1-2 | `tier 1: wooden, small, unfinished, fresh-cut timber, a single shed, bare earth around it` |
| 2 | 3-4 | `tier 2: wooden, complete, weathered timber, two sheds, a fence, a worn path` |
| 3 | 5-6 | `tier 3: timber on a stone footing, larger, a tiled roof, a cart track, stacked stores` |
| 4 | 7-8 | `tier 4: stone walls, slate roof, a walled yard, iron fittings, a well-kept road` |
| 5 | 9-10 | `tier 5: stone, walled, banners, a tower or gatehouse, paved yard, the largest of its kind` |

### Accents

| Family | Term | Accent |
|---|---|---|
| buildings | sawmill | wood amber |
| buildings | quarry | stone pale grey |
| buildings | ironMine | iron dark blue-grey |
| buildings | farm | food wheat green |
| buildings | warehouse | ochre and umber |
| buildings | library | gold warm yellow |
| buildings | barracks | iron dark blue-grey |
| camps | camp | pennant red |

## Family: buildings

35 images. Subject per term and tier; the rest of the prompt is the common lines above.

### sawmill (aserradero)

| File | Subject |
|---|---|
| `sawmill-1.webp` | a small open-sided sawmill shed by a stream, one saw pit, a few felled pine logs, sawdust on bare earth |
| `sawmill-2.webp` | a wooden sawmill with a small water wheel on a stream, a log pile under a lean-to, planks drying on racks |
| `sawmill-3.webp` | a sawmill on a stone footing with a large water wheel, a tiled roof, a mill race, stacked timber in rows |
| `sawmill-4.webp` | a stone-walled sawmill with a double water wheel, a slate roof, a walled timber yard, an iron-banded sluice |
| `sawmill-5.webp` | a great stone sawmill with two water wheels and a timber tower, banners on the gate, a paved yard of cut beams |

### quarry (cantera)

| File | Subject |
|---|---|
| `quarry-1.webp` | a shallow cut in a pale hillside, a wooden hoist, a few split blocks, chisels on a bench |
| `quarry-2.webp` | a hillside quarry with a wooden crane, a fenced cutting floor, a sled path down the slope |
| `quarry-3.webp` | a terraced quarry with stone-footed sheds, a tiled tool house, a cart track, dressed blocks in rows |
| `quarry-4.webp` | a deep terraced quarry with stone masons' halls, a slate roof, an iron windlass, a walled block yard |
| `quarry-5.webp` | a vast terraced quarry with a stone gatehouse, banners, a paved loading yard, block stacks like walls |

### ironMine (mina de hierro)

| File | Subject |
|---|---|
| `ironMine-1.webp` | a timber-framed mine mouth in a red-brown ridge, a wheelbarrow of ore, a small charcoal heap |
| `ironMine-2.webp` | a mine mouth with a wooden headframe and a bloomery hearth, an ore cart on wooden rails, a fence |
| `ironMine-3.webp` | a mine with a stone-footed headframe, a tiled smelting house with a chimney, ore sledges on a track |
| `ironMine-4.webp` | a stone mine entrance with an iron gate, a slate-roofed forge, a walled ore yard, a bellows house |
| `ironMine-5.webp` | a fortified mine with a stone tower over the shaft, banners, twin smelting chimneys, a paved ore yard |

### farm (granja)

| File | Subject |
|---|---|
| `farm-1.webp` | a small farmstead, a single thatched hut, a fenced strip of young wheat, a goat pen |
| `farm-2.webp` | a farmstead with a thatched house and a barn, two wheat fields, a wooden fence, a well |
| `farm-3.webp` | a farm on a stone footing with a tiled house, a large barn, ripe wheat fields, a cart track, hayricks |
| `farm-4.webp` | a stone farmhouse with a slate roof, a walled yard, a dovecote, wide golden fields, an iron-banded gate |
| `farm-5.webp` | a great stone manor farm with a gatehouse and banners, a granary tower, terraced fields to the horizon |

### warehouse (almacén)

| File | Subject |
|---|---|
| `warehouse-1.webp` | a small timber storehouse on stilts, a few sacks and barrels under its eaves |
| `warehouse-2.webp` | a wooden storehouse with a loading ramp, stacked barrels, sacks and logs behind a fence |
| `warehouse-3.webp` | a long storehouse on a stone footing with a tiled roof, a covered loading bay, crates in rows |
| `warehouse-4.webp` | a stone warehouse with a slate roof, a walled goods yard, iron-banded doors, a hoist beam |
| `warehouse-5.webp` | a great stone warehouse with a gate tower and banners, a paved yard of carts, barrels and stone blocks |

### library (biblioteca)

The suffix says `building` here, not `subject`. Closing clauses are per image.

| File | Subject | Closing clauses |
|---|---|---|
| `library-1.webp` | a small open-fronted wooden shed with one lectern, a lit candle on it, a few scrolls in a basket | `every parchment and scroll is blank and unmarked, no lettering or scribbles anywhere` |
| `library-2.webp` | a wooden library hall with a copying shed beside it, open shutters on a lectern and a shelf of scrolls, a candle lantern by the door |  |
| `library-3.webp` | a library on a stone footing with a tiled roof, wide doors open on rows of shelves, a lectern by a window, scroll chests under the eaves |  |
| `library-4.webp` | a stone library with a slate roof, arched windows lit by candles, iron-banded doors open on tall shelves of books, a walled yard | `a secular low rectangular stone library hall with a simple uninterrupted slate gable roof and a modest walled courtyard, no tower or turret or spire or steeple or gatehouse, plain shallow round-arched windows with no pointed arches or tracery or quatrefoils or rose windows, no cross or religious symbols or church architecture anywhere, iron-banded doors open to clearly visible tall bookshelves, absolutely no humans and no lettering anywhere` |
| `library-5.webp` | a great stone room of shelves with a tower, tall arched doors open on the shelves, candles in every window, banners, a paved yard | `one library hall with one squat tower and a small walled paved yard, human-scale medieval village building, no cathedral or sprawling castle, absolutely no humans or human silhouettes anywhere including roads gates and background, books and scrolls have no lettering, no cross or religious symbols anywhere, plain gable ends with no finials, round arches only, no pointed gothic arches, a secular civic library with a long broad slate-roofed hall and one squat square tower, no chapel or church silhouette, the tower roof has no ornament or crossbar, precise architectural correction: keep the long secular hall and the one squat square tower and the simple roofs, every single door and window has a broad perfectly semicircular Roman arch with a smooth curved crown and no apex or point, replace any pointed opening with a rounded half-circle opening, no triangular arch tops, preserve the shelves candles banners courtyard framing colors and lighting` |

### barracks (cuartel)

Closing clauses: `a human-scale village training yard, the training dummies are clearly inanimate rough straw bundles on wooden posts, absolutely no living humans or human silhouettes anywhere including the background, no lettering or scribbles on shields or banners`

| File | Subject |
|---|---|
| `barracks-1.webp` | a small fenced drill ground with a spear shed, one straw training dummy on a post, a few round shields against the fence |
| `barracks-2.webp` | a fenced drill ground with a spear shed and a store shed, a row of training dummies, spear racks, round shields hung on the fence |
| `barracks-3.webp` | a drill ground beside a timber armoury on a stone footing, a tiled roof over the spear racks, training dummies in rows, stacked shields |
| `barracks-4.webp` | a walled yard with a drill ground and a roof for the spears, a slate-roofed spear gallery along the stone wall, training dummies, iron-bossed shields |
| `barracks-5.webp` | a great walled yard with a drill ground and a roof for the spears, a stone gatehouse with banners, a paved drill ground, long spear racks, rows of training dummies and shields |

## Family: camps

3 images, one per camp tier, 1 to 3, committed as the 96 px derivatives `camp-<tier>-96.webp` under `apps/web/public/art/camps/`, which the map's plot tile draws (the bible's Thumbnail rule). The 768 sources and their prompts were removed when the attack form dropped its image (v29 redesign, ADR 030 amendment); a regeneration starts from the Common lines, the Camp tier lines below with `<resource accent>` set to `pennant red`, and the closing clauses `a modest camp at human scale, absolutely no humans or human silhouettes anywhere including the background, red pennants are solid fabric with no lettering or symbols`.

### Camp tier lines

| Tier | Line |
|---|---|
| 1 | `tier 1: a few tents around a fire pit, small, makeshift, patched canvas, trampled bare earth` |
| 2 | `tier 2: a palisaded camp, sharpened logs, a rough timber gate, more tents, a worn track` |
| 3 | `tier 3: a fortified ruined tower, old stone patched with timber, a palisade, a barred gate, the largest of its kind` |

## Where the screen reads them

`buildingArtOf(building, level)` in `apps/web/src/design-system/buildingArtOf.ts` resolves a building image as `/art/buildings/<term>-<tier>.webp` with tier = ceil(level / 2), and answers nothing at level 0, where the fief screen's building card shows no image. It is the only place a screen reads the building family from, and `BuildingCard` is the only card that draws an image (`CardArt`). `campThumbnailOf(tier)` in `apps/web/src/design-system/campThumbnailOf.ts` resolves a bandit camp's 96 px derivative as `/art/camps/camp-<tier>-96.webp` for tiers 1 to 3 (#557, ADR 030); the map's plot tile draws it at the top of a camp tile, above the row with the hand-drawn `CampIcon` beside the camp's name. The resource bar, the art card, the cargo card, the march forms, the sign-in screens, the fief header and the map plate draw no raster image: the resource bar draws each resource's hand-drawn stroke icon, and no scene band exists (v29 redesign, ADR 030 amendment).

## Open questions

- Whether uplands and ridges get their own building backdrops once a second kingdom opens.
