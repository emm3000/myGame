# Art catalog

Every family the game draws.

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
