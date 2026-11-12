import wasteOne from '../../public/art/waste/waste-1.svg?raw'
import wasteTwo from '../../public/art/waste/waste-2.svg?raw'
import wasteThree from '../../public/art/waste/waste-3.svg?raw'
import type { ArtTag } from '../art/ArtTag'
import { artTagsOf } from '../art/artTagsOf'
import { color } from '../design/tokens'
import type { WasteSize } from './WasteSize'

const wasteFiles: Readonly<Record<WasteSize, string>> = { 1: wasteOne, 2: wasteTwo, 3: wasteThree }

export function wasteArtOf(size: WasteSize): ReadonlyArray<ArtTag> {
  const [, ...shapes] = artTagsOf(wasteFiles[size])
  return shapes.map((shape) => ({
    ...shape,
    attributes: { ...shape.attributes, fill: color('ink-muted') },
  }))
}
