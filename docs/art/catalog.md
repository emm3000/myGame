# Art catalog

Status: proposal, drafted 2026-09-22 for PRD S4, style switched to stylized 3D animation the same day before any image was generated. Every image the MVP shows, with the prompt that produces it. The rules come from `art-bible.md`; this page only applies them. When the two disagree, the bible wins and this page is edited.

## How to run it

1. Model: GPT Image, 1024×1024, one image per prompt. Run a whole family in one sitting so the style holds.
2. Codex's image tool has no size argument, so the prompts of the families it generates (library, barracks, camps, arts, convoys) end with the square output suffix under Common lines, after the tier line or the resource block. The 25 older building images and the 5 resource images keep their prompts and are not regenerated. Paste the prompt exactly. If an output breaks a rule (text, people, night, sci-fi material, a different framing), regenerate; never keep an outlier.
3. Codex outputs a PNG at the generation size. Keep the prompt as `apps/web/public/art/<family>/<term>-<tier>.prompt.txt`, byte for byte what was pasted (N7).
4. Lay the family out as a contact sheet from those PNG outputs before committing, and check it against the bible's palette and framing. One outlier means one regeneration; three mean the template changes and the family is regenerated.
5. The PR that adds the art converts each PNG output to a 768×768 WebP with `cwebp -q 78 -m 6 -resize 768 0 <in> -o <out>` and commits the WebP as `apps/web/public/art/<family>/<term>-<tier>.webp` beside its prompt; the PNG output is never committed under `public/`. Commit image and prompt together: `feat(art): <family> <term>` or `feat(art): <family>` for a whole family.

Every building has ten levels and five tiers, tier = ceil(level / 2), so a level shows the image of its tier: levels 1 and 2 share `sawmill-1.webp`, levels 9 and 10 share `sawmill-5.webp`. Level 0 shows no image; the screen shows the empty plot state from the design system.

Kingdom terrain for every prompt is Vadoalto's: a wide river valley with pine hills behind, the high ford in the distance (`docs/lore/names.md`). A fief on uplands or ridges shows the same images in the MVP; terrain-specific art is a later family.

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

`<framed>` is `building` for the library and `subject` for barracks, camps and arts. It follows the tier line (buildings, camps) or the resource block (arts) after `, `, and only on the families Codex generates. Closing clauses, when a prompt has any, follow it after `, `; they sit under each family heading or in its table, never in the Subject cell. The suffix is output framing, not part of the template.

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
| resources | wood, stone, iron, gold, food | the resource's own accent |
| camps | camp | pennant red |
| arts | smithing | iron dark blue-grey |
| arts | masonry | stone pale grey |
| convoys | convoy | ochre and umber |

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

## Family: resources

5 images. Large resource art for the screen and the art bible's contact sheet, not the UI icons (those stay hand-drawn SVG). Framing follows the bible's resource rule: 1:1, a single object on plain parchment, thick silhouette readable at 48 px.

```
<subject>, stylized 3D animated film look, soft cel shading, clean readable shapes, slightly exaggerated proportions,
warm studio light, gentle rim light, saturated but harmonious earth palette with <accent> as the brightest element,
single object centered on a plain parchment background, thick readable silhouette, soft ground shadow,
no photorealism, no outlines, no text, no watermark, no people
```

| File | Subject | Accent |
|---|---|---|
| `wood-1.webp` | three stacked pine logs with fresh-cut amber ends and rough bark | wood amber |
| `stone-1.webp` | three dressed blocks of pale grey stone, chisel marks on their faces | stone pale grey |
| `iron-1.webp` | three iron ingots, dark blue-grey, one with a hammer mark | iron dark blue-grey |
| `gold-1.webp` | a small heap of worn gold coins beside an open leather toll purse | gold warm yellow |
| `food-1.webp` | a bound sheaf of ripe wheat with a round loaf beside it | food wheat green |

## Family: camps

3 images, one per camp tier, 1 to 3. A camp's tier never rises, so a camp shows the one image of its tier for as long as it stands. Framing follows the bible's building rule, with no people: tents, a fire pit, a palisade and the loot carry the camp. Each prompt is the Common lines above with `<resource accent>` set to `pennant red` and the tier line taken from the Camp tier lines below, never from the building Tier lines. The image is saved as `apps/web/public/art/camps/camp-<tier>.webp` with `camp-<tier>.prompt.txt` next to it; the contact sheet is `docs/art/contact-sheets/camp.png`.

### Camp tier lines

| Tier | Line |
|---|---|
| 1 | `tier 1: a few tents around a fire pit, small, makeshift, patched canvas, trampled bare earth` |
| 2 | `tier 2: a palisaded camp, sharpened logs, a rough timber gate, more tents, a worn track` |
| 3 | `tier 3: a fortified ruined tower, old stone patched with timber, a palisade, a barred gate, the largest of its kind` |

### camp (campamento)

Closing clauses: `a modest camp at human scale, absolutely no humans or human silhouettes anywhere including the background, red pennants are solid fabric with no lettering or symbols`

| File | Subject |
|---|---|
| `camp-1.webp` | a few patched canvas tents around a stone-ringed fire pit, a red pennant on a leaning pole, a small pile of stolen sacks and a barrel |
| `camp-2.webp` | a camp of tents inside a ring of sharpened log palisade, a rough timber gate with a red pennant above it, a fire pit, a handcart, stolen crates and barrels |
| `camp-3.webp` | a ruined stone tower patched with timber hoardings, a palisade and a barred gate closing its breach, tents at its foot, red pennants on its broken top, stacked loot chests |

## Family: arts

2 images, one per art and never per level: an art shows the same image at every level. Framing follows the bible's resource rule, and each prompt is the resource template block above with `<subject>` and `<accent>` from the table. Each subject is one object of the craft as `docs/lore/arts.md` tells it, never the resource's own object. The image is saved as `apps/web/public/art/arts/<term>.webp` with `<term>.prompt.txt` next to it, no tier in the name; the contact sheet is `docs/art/contact-sheets/arts.png`.

| File | Subject | Accent | Closing clauses |
|---|---|---|---|
| `smithing.webp` | a forge bellows of wood and leather with a dark blue-grey iron nozzle, a small heap of charcoal under it | iron dark blue-grey | |
| `masonry.webp` | a rough boulder of pale grey stone split clean along its grain, an iron wedge between two feathers standing in the cleft | stone pale grey | `the two feathers are curved dark iron shims flanking the central iron wedge, no wooden shims and no bird feathers` |

## Family: convoys

1 image, no tiers. Framing follows the bible's building rule, always with no people; the escort is implied by its arms on the carts. The image is saved as `apps/web/public/art/convoys/convoy.webp` with `convoy.prompt.txt` next to it; the contact sheet is `docs/art/contact-sheets/convoy.png`.

The prompt is the subject, `, `, the Common lines above with their line breaks turned into single spaces and `<resource accent>` set to `ochre and umber`, without a tier line, then the square output suffix with `<framed>` set to `subject`, then `, ` and the closing clauses.

### convoy (transporte)

| File | Subject | Closing clauses |
|---|---|---|
| `convoy.webp` | a small convoy of two laden ox carts on a dirt road, one heaped with fresh-cut timber and dressed pale stone blocks, the other with dark iron ingots, a small iron-bound chest of gold coins and grain sacks, spears and two lances lashed upright to the carts, a plain round shield hung on each cart side, the oxen yoked and standing on the road | `a modest convoy at human scale, absolutely no humans or human silhouettes anywhere including the background, shields are plain and unpainted, any pennant is solid ochre fabric with no lettering or symbols, no cross or religious symbols anywhere including pennants, shields, carts and pole tops, plain pole tops with no finials or crossbars, no lettering on chests or sacks` |

## Where the screen reads them

`buildingArtOf(building, level)` in `apps/web/src/design-system/buildingArtOf.ts` resolves a building image as `/art/buildings/<term>-<tier>.webp` with tier = ceil(level / 2), and answers nothing at level 0, where the fief screen's building card shows no image. It is the only place a screen reads the building family from. `campArtOf(tier)` in `apps/web/src/design-system/campArtOf.ts` resolves a bandit camp image as `/art/camps/camp-<tier>.webp` for tiers 1 to 3; its one consumer is `attackFormOf` in `apps/web/src/map/attackFormOf.ts`, which puts the target camp's image at the top of the attack form on `/mapa`. The forage form shows none, and the map's plot tile keeps its hand-drawn `CampIcon`. `artArtOf(art)` in `apps/web/src/design-system/artArtOf.ts` resolves an art image as `/art/arts/<art>.webp`, one image per art with no tiers; its one consumer is `artCardOf` in `apps/web/src/fief/artCardOf.ts`, which puts the image at the top of every art card of the library section at every level, *sin estudiar* and the top level included. `convoyArtOf()` in `apps/web/src/design-system/convoyArtOf.ts` resolves the convoy image as `/art/convoys/convoy.webp`, one image with no tiers; its first consumer is the *Carga en camino* card of the destination's fief screen (`IncomingCargoOf` in `apps/web/src/fief/FiefScreen.tsx`, #415), which puts it at the top of the card as `BuildingCard` draws its `artSrc`; its second consumer is the transport form on `/mapa` (`transportFormOf` in `apps/web/src/map/transportFormOf.ts`, #416), which puts it at the top of the form as the attack form shows its camp. The resource family (`/art/resources/<term>-1.webp`) has no consumer yet: no MVP screen has a place for large resource art, and the resource bar, the build slot and the cost list keep their hand-drawn SVG icons.

## Open questions

- Whether uplands and ridges get their own building backdrops once a second kingdom opens.
- Whether the resource family grows to one image per capacity tier (a fuller heap as the warehouse grows).
