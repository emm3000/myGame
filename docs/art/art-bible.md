# Art bible

Status: stub. Style set to stylized 3D animation on 2026-09-22, before any image was generated, because a painted muted style read flat at card size. One style for every image the game shows, so assets generated months apart sit together. Read before generating any image. The images the game needs and their prompts are listed in `catalog.md`. Every generated image is committed with the prompt that produced it (N7 in `docs/PRODUCT_REQUIREMENTS.md`).

## Style

- Stylized 3D animated film look, early-medieval. Soft cel shading, clean readable shapes, slightly exaggerated proportions (big roofs, big wheels, squat towers). No photorealism, no hard outlines, no pixel art, no painterly brushwork.
- Grounded and low-magic: no glowing runes, no neon, no sci-fi materials.
- Warm golden-hour light with a gentle rim light, so a silhouette separates from its backdrop. No night scenes in the base set.
- Human scale: a building is shown as a lord would see it from the road, three-quarter view, slightly elevated.

## Palette

- Earth base: ochre, umber, slate grey, moss green, river blue.
- One accent per resource, used consistently in UI and art: wood amber, stone pale grey, iron dark blue-grey, gold warm yellow, food wheat green.
- Pennant red is the bandit camps' accent: a non-resource accent, as the warehouse's ochre and umber is (`catalog.md`, Accents).
- Saturated but harmonious; the accent is the brightest element in a frame and the first thing read at thumbnail size.

## Framing

- Buildings: 1:1, subject centered, occupying 70% of the frame, neutral sky, ground shadow, no people unless the building is about people.
- Resources: 1:1 icon, single object on a plain parchment background, thick silhouette readable at 48 px.
- Bandit camps take the building rule, always with no people; arts take the resource rule, one object of the craft.
- Convoys take the building rule, always with no people; the escort is implied by its arms on the carts.
- Scenes: generated 1:1 and shown as a 3:1 band cropped by the screen, so the horizon sits in the middle third of the frame and nothing of worth sits in the top or bottom sixth. A wide landscape from slightly above, no building centred, no people, the accent of the terrain's resource. Served at 1024×1024, the one exception to the 768 rule, because the band is 1216 px wide from `lg` (Model and size); a plate weighs at most 200 KB, `-q 70` if 78 is over.
- Thumbnail: an image drawn at 48 px or less is served from a 96 px WebP derivative, `<name>-96.webp` beside its 768 source, made with `cwebp -q 78 -m 6 -resize 96 0 <in> -o <out>` and weighing at most 10 KB. The derivative is a conversion, never a regeneration: the source keeps its prompt and the derivative has none.
- Portraits (later): 3:4, bust, three-quarter turn, plain background in the house colour.
- Map tiles (later): top-down, 1:1, seamless edges.

## Base prompt template

```
<subject>, early-medieval <kingdom terrain>, stylized 3D animated film look, soft cel shading,
clean readable shapes, slightly exaggerated proportions, warm golden-hour light, gentle rim light,
saturated but harmonious earth palette with <resource accent> as the brightest element,
three-quarter elevated view, subject centered filling 70% of frame, soft sky, ground shadow,
no photorealism, no outlines, no text, no watermark, no people
```

Fill `<subject>` from `CONTEXT.md` and `docs/lore/`, `<kingdom terrain>` from the lore's land section, `<resource accent>` from the palette. Add a line for the art tier: `tier 1: wooden, small, unfinished` up to `tier 5: stone, walled, banners`. A building has ten levels and five tiers; tier = ceil(level / 2).

## Consistency rules

- One model and one template per asset family; a template change regenerates the whole family.
- The square output suffix (`docs/art/catalog.md`, Common lines) is output framing for Codex's image tool, which has no size argument, not a template change; it does not regenerate a family.
- Every asset is checked against a contact sheet of its family before commit; an outlier is regenerated, never kept.
- File name: `<family>/<term>-<level>.webp`, the term as in `CONTEXT.md`, or `arts/<term>.webp` for an art, `convoys/<term>.webp` for a convoy or `scenes/<terrain>.webp` for a scene, the terrain as `TerrainSchema` spells it, each with one image and no level in its name. The convoy's file name, `convoy`, is the family's own word and not a `CONTEXT.md` term: the glossary names the transport and its cargo, never the carts (#411, ADR 024).
- The prompt used is stored next to the image as `<term>-<level>.prompt.txt`, or `<term>.prompt.txt` for an art, a convoy or a scene.

## Model and size

GPT Image at 1024×1024 is the generation size of every family; the game serves a 768×768 WebP converted from that output (`docs/art/catalog.md`, How to run it), except the scenes, served at 1024×1024 (Framing), and the 96 px thumbnail derivatives (Framing), converted from the 768. Codex's image tool takes no size argument, so a prompt it runs ends with the square output suffix. Prompts are written by the agent in the ticket that delivers the family, from the template above; the author or Codex runs them and commits image and prompt together. A ticket Codex runs carries `ready-for-codex` (`docs/agents/triage-labels.md`).

## UI icons

Hand-drawn SVG in the design system, never generated: resources, peasants, clock, slot, the four seasons: a sprout for spring, a sun for summer, a leaf for autumn, a snowflake for winter (ADR 016), the infantry: a round shield beside a spear (#213, ADR 018), the rider: a horseshoe beside a lance (#347, ADR 021), the archer: a strung bow beside an arrow (#433, ADR 025), the settler: a loaded cart on its wheel, the shaft forward (#381, ADR 023), the march: a signpost (#259, ADR 019), and the camp: a tent with a pennant (#295, ADR 020), in a 24 px box with a 1.5 px stroke (`strokeWidths.icon`; 1.75 until S26, ADR 029) in the current ink. Crisp at 16 to 24 px and themeable. Generated images are reserved for buildings, camps, arts, convoys and large resource art; the camp keeps its tent with a pennant on the map's plot tile.

## Open questions

- The house colours, pending the lore.
