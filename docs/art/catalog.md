# Art catalog

Status: proposal, drafted 2026-09-22 for PRD S4. Every image the MVP shows, with the prompt that produces it. The rules come from `art-bible.md`; this page only applies them. When the two disagree, the bible wins and this page is edited.

## How to run it

1. Model: GPT Image, 1024×1024, one image per prompt. Run a whole family in one sitting so the style holds.
2. Paste the prompt exactly. If an output breaks a rule (text, people, night, sci-fi material, a different framing), regenerate; never keep an outlier.
3. Save the image as `apps/web/public/art/<family>/<term>-<tier>.png` and the prompt next to it as `<term>-<tier>.prompt.txt`, byte for byte what was pasted (N7).
4. Lay the family out as a contact sheet before committing, and check it against the bible's palette and framing. One outlier means one regeneration; three mean the template changes and the family is regenerated.
5. Commit image and prompt together: `feat(art): <family> <term>` or `feat(art): <family>` for a whole family.

Every building has ten levels and five tiers, tier = ceil(level / 2), so a level shows the image of its tier: levels 1 and 2 share `sawmill-1.png`, levels 9 and 10 share `sawmill-5.png`. Level 0 shows no image; the screen shows the empty plot state from the design system.

Kingdom terrain for every prompt is Vadoalto's: a wide river valley with pine hills behind, the high ford in the distance (`docs/lore/names.md`). A fief on uplands or ridges shows the same images in the MVP; terrain-specific art is a later family.

## Common lines

Every building prompt is the bible's template with three slots filled: `<subject>` from the entry, `<resource accent>` from the family table, and the tier line from the tier table. Written out once here so the entries below stay short; the file `<term>-<tier>.prompt.txt` holds the full text.

```
<subject>, early-medieval river valley with pine hills, painted illustration, visible brushwork,
soft edges, muted earth palette with <resource accent> accent, overcast daylight,
three-quarter elevated view, subject centered filling 70% of frame, neutral sky,
ground shadow, no text, no watermark, no people, <tier line>
```

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
| resources | wood, stone, iron, gold, food | the resource's own accent |

## Family: buildings

25 images. Subject per term and tier; the rest of the prompt is the common lines above.

### sawmill (aserradero)

| File | Subject |
|---|---|
| `sawmill-1.png` | a small open-sided sawmill shed by a stream, one saw pit, a few felled pine logs, sawdust on bare earth |
| `sawmill-2.png` | a wooden sawmill with a small water wheel on a stream, a log pile under a lean-to, planks drying on racks |
| `sawmill-3.png` | a sawmill on a stone footing with a large water wheel, a tiled roof, a mill race, stacked timber in rows |
| `sawmill-4.png` | a stone-walled sawmill with a double water wheel, a slate roof, a walled timber yard, an iron-banded sluice |
| `sawmill-5.png` | a great stone sawmill with two water wheels and a timber tower, banners on the gate, a paved yard of cut beams |

### quarry (cantera)

| File | Subject |
|---|---|
| `quarry-1.png` | a shallow cut in a pale hillside, a wooden hoist, a few split blocks, chisels on a bench |
| `quarry-2.png` | a hillside quarry with a wooden crane, a fenced cutting floor, a sled path down the slope |
| `quarry-3.png` | a terraced quarry with stone-footed sheds, a tiled tool house, a cart track, dressed blocks in rows |
| `quarry-4.png` | a deep terraced quarry with stone masons' halls, a slate roof, an iron windlass, a walled block yard |
| `quarry-5.png` | a vast terraced quarry with a stone gatehouse, banners, a paved loading yard, block stacks like walls |

### ironMine (mina de hierro)

| File | Subject |
|---|---|
| `ironMine-1.png` | a timber-framed mine mouth in a red-brown ridge, a wheelbarrow of ore, a small charcoal heap |
| `ironMine-2.png` | a mine mouth with a wooden headframe and a bloomery hearth, an ore cart on wooden rails, a fence |
| `ironMine-3.png` | a mine with a stone-footed headframe, a tiled smelting house with a chimney, ore sledges on a track |
| `ironMine-4.png` | a stone mine entrance with an iron gate, a slate-roofed forge, a walled ore yard, a bellows house |
| `ironMine-5.png` | a fortified mine with a stone tower over the shaft, banners, twin smelting chimneys, a paved ore yard |

### farm (granja)

| File | Subject |
|---|---|
| `farm-1.png` | a small farmstead, a single thatched hut, a fenced strip of young wheat, a goat pen |
| `farm-2.png` | a farmstead with a thatched house and a barn, two wheat fields, a wooden fence, a well |
| `farm-3.png` | a farm on a stone footing with a tiled house, a large barn, ripe wheat fields, a cart track, hayricks |
| `farm-4.png` | a stone farmhouse with a slate roof, a walled yard, a dovecote, wide golden fields, an iron-banded gate |
| `farm-5.png` | a great stone manor farm with a gatehouse and banners, a granary tower, terraced fields to the horizon |

### warehouse (almacén)

| File | Subject |
|---|---|
| `warehouse-1.png` | a small timber storehouse on stilts, a few sacks and barrels under its eaves |
| `warehouse-2.png` | a wooden storehouse with a loading ramp, stacked barrels, sacks and logs behind a fence |
| `warehouse-3.png` | a long storehouse on a stone footing with a tiled roof, a covered loading bay, crates in rows |
| `warehouse-4.png` | a stone warehouse with a slate roof, a walled goods yard, iron-banded doors, a hoist beam |
| `warehouse-5.png` | a great stone warehouse with a gate tower and banners, a paved yard of carts, barrels and stone blocks |

## Family: resources

5 images. Large resource art for the screen and the art bible's contact sheet, not the UI icons (those stay hand-drawn SVG). Framing follows the bible's resource rule: 1:1, a single object on plain parchment, thick silhouette readable at 48 px.

```
<subject>, painted illustration, visible brushwork, soft edges, muted earth palette with <accent> accent,
single object centered on a plain parchment background, thick readable silhouette, soft ground shadow,
no text, no watermark, no people
```

| File | Subject | Accent |
|---|---|---|
| `wood-1.png` | three stacked pine logs with fresh-cut amber ends and rough bark | wood amber |
| `stone-1.png` | three dressed blocks of pale grey stone, chisel marks on their faces | stone pale grey |
| `iron-1.png` | three iron ingots, dark blue-grey, one with a hammer mark | iron dark blue-grey |
| `gold-1.png` | a small heap of worn gold coins beside an open leather toll purse | gold warm yellow |
| `food-1.png` | a bound sheaf of ripe wheat with a round loaf beside it | food wheat green |

## Where the screen reads them

`apps/web` resolves a building image as `/art/buildings/<term>-<tier>.png` with tier = ceil(level / 2) and shows nothing at level 0; a resource image as `/art/resources/<term>-1.png`. The mapping lives in one design-system helper, never inline in a screen. Wiring is the S4 ticket's, not this page's.

## Open questions

- Whether uplands and ridges get their own building backdrops once a second kingdom opens.
- Whether the resource family grows to one image per capacity tier (a fuller heap as the warehouse grows).
