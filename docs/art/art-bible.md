# Art bible

Status: stub. One style for every image the game shows, so assets generated months apart sit together. Read before generating any image. Every generated image is committed with the prompt that produced it (N7 in `docs/PRODUCT_REQUIREMENTS.md`).

## Style

- Painted, illustrative, early-medieval. Visible brushwork, soft edges, no photorealism, no 3D render look, no pixel art.
- Grounded and low-magic: no glowing runes, no neon, no sci-fi materials.
- Daylight, overcast or golden hour. No night scenes in the base set.
- Human scale: a building is shown as a lord would see it from the road, three-quarter view, slightly elevated.

## Palette

- Earth base: ochre, umber, slate grey, moss green, river blue.
- One accent per resource, used consistently in UI and art: wood amber, stone pale grey, iron dark blue-grey, gold warm yellow, food wheat green.
- Muted saturation; the accent is the brightest thing in a frame.

## Framing

- Buildings: 1:1, subject centered, occupying 70% of the frame, neutral sky, ground shadow, no people unless the building is about people.
- Resources: 1:1 icon, single object on a plain parchment background, thick silhouette readable at 48 px.
- Portraits (later): 3:4, bust, three-quarter turn, plain background in the house colour.
- Map tiles (later): top-down, 1:1, seamless edges.

## Base prompt template

```
<subject>, early-medieval <kingdom terrain>, painted illustration, visible brushwork,
soft edges, muted earth palette with <resource accent> accent, overcast daylight,
three-quarter elevated view, subject centered filling 70% of frame, neutral sky,
no text, no watermark, no people
```

Fill `<subject>` from `CONTEXT.md` and `docs/lore/`, `<kingdom terrain>` from the lore's land section, `<resource accent>` from the palette. Add a line for the art tier: `tier 1: wooden, small, unfinished` up to `tier 5: stone, walled, banners`. A building has ten levels and five tiers; tier = ceil(level / 2).

## Consistency rules

- One model and one template per asset family; a template change regenerates the whole family.
- Every asset is checked against a contact sheet of its family before commit; an outlier is regenerated, never kept.
- File name: `<family>/<term>-<level>.png`, the term as in `CONTEXT.md`.
- The prompt used is stored next to the image as `<term>-<level>.prompt.txt`.

## Model and size

GPT Image at 1024×1024 for every generated family. Prompts are written by the agent in the ticket that delivers the family, from the template above; the author runs them and commits image and prompt together.

## UI icons

Hand-drawn SVG in the design system, never generated: resources, peasants, clock, slot. Crisp at 16 to 24 px and themeable. Generated images are reserved for buildings and large resource art.

## Open questions

- The house colours, pending the lore.
