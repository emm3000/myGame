import { createElement, type ReactElement } from 'react'
import type { ArtTag } from '../art/ArtTag'
import { placeViewBox } from '../art/placeShapesOf'

export interface PlaceArtProps {
  readonly shapes: ReadonlyArray<ArtTag>
  readonly sizeClass?: string
}

export function PlaceArt({ shapes, sizeClass = 'size-place-card' }: PlaceArtProps): ReactElement {
  return createElement(
    'svg',
    { viewBox: placeViewBox, 'aria-hidden': true, className: `${sizeClass} shrink-0 self-center` },
    ...shapes.map(({ name, attributes }) => createElement(name, attributes)),
  )
}
