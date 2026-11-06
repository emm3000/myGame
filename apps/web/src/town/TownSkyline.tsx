import { townSkylineBuilt } from '@mygame/catalog'
import type { BuildingKind, TownOverview } from '@mygame/contracts/town'
import { createElement, type ReactElement } from 'react'
import { placeHeight, placeWidth } from '../art/placeShapesOf'
import { color } from '../design/tokens'
import { placeArtOf } from '../design-system/placeArtOf'

const placesAlongTheLine: ReadonlyArray<BuildingKind> = [
  'homes',
  'farm',
  'school',
  'office',
  'factory',
  'powerStation',
  'storage',
]

const groundY = 140
const groundHeight = 2
const placeStep = 72
const skylineWidth = placeStep * (placesAlongTheLine.length - 1) + placeWidth

export function TownSkyline({
  buildings,
}: {
  readonly buildings: TownOverview['buildings']
}): ReactElement {
  const built = placesAlongTheLine.filter((place) => buildings[place].level > 0).length
  return (
    <svg
      role="img"
      aria-label={townSkylineBuilt({ built, total: placesAlongTheLine.length })}
      viewBox={`0 0 ${skylineWidth} ${placeHeight}`}
      className="block w-full"
    >
      {placesAlongTheLine.map((place, index) =>
        createElement(
          'g',
          { key: place, transform: `translate(${index * placeStep} 0)` },
          ...placeArtOf(place, buildings[place].level).map(({ name, attributes }) =>
            createElement(name, attributes),
          ),
        ),
      )}
      <rect y={groundY} width={skylineWidth} height={groundHeight} fill={color('ink')} />
    </svg>
  )
}
