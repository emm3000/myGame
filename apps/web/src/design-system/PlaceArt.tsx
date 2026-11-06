import { createElement, type ReactElement } from 'react'
import type { ArtTag } from '../art/ArtTag'
import { placeViewBox } from '../art/placeShapesOf'

export interface PlaceArtProps {
  readonly shapes: ReadonlyArray<ArtTag>
}

export function PlaceArt({ shapes }: PlaceArtProps): ReactElement {
  return createElement(
    'svg',
    { viewBox: placeViewBox, 'aria-hidden': true, className: 'size-place-card self-center' },
    ...shapes.map(({ name, attributes }) => createElement(name, attributes)),
  )
}
