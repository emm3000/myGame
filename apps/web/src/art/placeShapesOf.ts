import type { ArtTag } from './ArtTag'
import { artTagsOf } from './artTagsOf'

export const placeViewBox = '0 0 100 142'

export const windowCount = 10

export type PlaceShapes = {
  readonly silhouette: ReadonlyArray<ArtTag>
  readonly windows: ReadonlyArray<ArtTag>
}

export function placeShapesOf(svg: string): PlaceShapes {
  const [, ...shapes] = artTagsOf(svg)
  const firstWindow = Math.max(0, shapes.length - windowCount)
  return { silhouette: shapes.slice(0, firstWindow), windows: shapes.slice(firstWindow) }
}
