# Art bible

Status: flat vector present-day town, ADR 035 (`docs/adr/035-townword-an-english-learning-town-builder.md`), the Townword Design System (https://claude.ai/artifact/BLNf2broSoGPHBKfCNd81f). Every earlier image is retired; N7 stays. One style for every image the game shows, so assets generated months apart sit together. Read before generating any image. Every generated image is committed with the prompt that produced it (N7 in `docs/PRODUCT_REQUIREMENTS.md`). `catalog.md` lists the retired image families and is not extended until the town's families are generated.

## Style

- Flat vector illustration of everyday present-day places. Solid fills, no outlines, no gradients, no textures, no 3D shading, no photorealism.
- Bright and friendly, for adults: clean geometric shapes, gently rounded corners, slightly simplified proportions. Never childish, never faces on buildings.
- Shading only as one flat darker tone of the same color.
- Daylight, clear sky, soft white clouds. No night scenes in the base set.
- No text, letters, numbers, signs, logos, real flags, real brands, real places, real people or politics.
- One illustration per place serves both the town and that word's card.

## Palette

Illustration-only colors, the same in both UI schemes:

| Token | Hex | Use |
|---|---|---|
| `scene-sky` | `#cdeaf7` | sky |
| `scene-cloud` | `#ffffff` | clouds, window frames |
| `scene-grass` | `#8bcf6a` | ground |
| `scene-grass-deep` | `#5fae4f` | ground shadow, hedges, field rows |
| `scene-tree` | `#3f9f5a` | trees, bushes |
| `scene-trunk` | `#8a5a3c` | trunks, timber |
| `scene-wall` | `#f7e6c8` | walls, trim |
| `scene-brick` | `#e0674a` | brick, doors |
| `scene-brick-deep` | `#c24e36` | brick in shade, chimneys |
| `scene-barn` | `#d24a3f` | barns |
| `scene-roof` | `#3c5ea8` | roofs |
| `scene-roof-deep` | `#2f4b8a` | eaves |
| `scene-window` | `#9fdcf5` | glass |
| `scene-sun` | `#ffcf3f` | sun, lamps, plain flags; the brightest element |
| `scene-steel` | `#a9b8c4` | silos, poles, power lines |
| `scene-path` | `#e8e3d6` | paths, steps |

Resource accents, the same in UI and art:

| Resource | Hex |
|---|---|
| money | `#2a7034` |
| food | `#b8303f` |
| power | `#7a5c00` (art may use `scene-sun` for light itself) |
| material | `#4f6377` |
| people | `#7046ad` |

A producing building shows its resource's accent as one clearly visible element.

## Framing

- Places are 1:1, the subject centered and filling about 70 % of the frame, front view slightly elevated, sky behind, a flat ground band and one flat ground shadow.
- No people in place images.
- Ten levels and five art tiers, tier = ceil(level / 2). A higher tier is the same place grown, never a new style.
- Files are `places/<word>-<tier>.webp` with `<word>-<tier>.prompt.txt` beside each.
- Thumbnail: an image drawn at 96 px or less is served from a 96 px WebP derivative, `<name>-96.webp` beside its 768 source, made with `cwebp -q 78 -m 6 -resize 96 0 <in> -o <out>` and weighing at most 10 KB. The derivative is a conversion, never a regeneration: the source keeps its prompt and the derivative has none.

## Base prompt template

```
<subject>, a present-day <place word> in a small town, flat vector illustration,
solid flat colors, no outlines, no gradients, no textures, clean geometric shapes,
gently rounded corners, simplified friendly proportions for an adult audience,
bright daylight, clear light-blue sky (#cdeaf7) with one or two soft white clouds,
green ground band (#8bcf6a) with one flat darker ground shadow,
palette: brick #e0674a, roof blue #3c5ea8, wall cream #f7e6c8, glass #9fdcf5,
tree green #3f9f5a, sun yellow #ffcf3f, steel #a9b8c4,
<resource accent> as one clearly visible element,
front view slightly elevated, subject centered filling 70% of the frame, square 1:1,
no text, no letters, no numbers, no signs, no logos, no brands, no real places,
no people, no photorealism, no 3D, no watermark
```

Fill `<subject>` and `<place word>` from `CONTEXT.md` and the table in ADR 035. Fill `<resource accent>` from the accents above, or drop that line. Add one tier line, from `tier 1: small, new, one floor` up to `tier 5: large, busy, several floors, modern additions`.

## Consistency rules

- One model and one template per asset family; a template change regenerates the whole family.
- The square output suffix is output framing for Codex's image tool, which has no size argument, not a template change; it does not regenerate a family.
- Every asset is checked against a contact sheet of its family before commit; an outlier is regenerated, never kept.
- File name: `places/<word>-<tier>.webp`, the word as in `CONTEXT.md`.
- The prompt used is stored next to the image as `<word>-<tier>.prompt.txt`.

## Model and size

GPT Image at 1024×1024 is the generation size of every family; the game serves a 768×768 WebP converted from that output, except the 96 px thumbnail derivatives (Framing), converted from the 768. Codex's image tool takes no size argument, so a prompt it runs ends with a square output suffix. Prompts are written by the agent in the ticket that delivers the family, from the template above; the author or Codex runs them and commits image and prompt together. A ticket Codex runs carries `ready-for-codex` (`docs/agents/triage-labels.md`).

## UI icons

Hand-drawn SVG in the design system, never generated, never emoji. Each sits in a 24 px box with a 2 px stroke (`stroke-icon`), round caps and joins, in the current ink:

- the resources: money, food, power, material, people;
- time and slots: clock, slot;
- the seasons: spring (a sprout), summer (a sun), fall (a leaf), winter (a snowflake);
- learning: due-review (stacked cards), hint (a light bulb), audio (a speaker), check, retry (a circular arrow).

Crisp at 16 to 24 px and themeable. The paths are the design system's Icons assets.
