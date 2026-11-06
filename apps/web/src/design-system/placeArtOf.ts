import type { BuildingKind } from '@mygame/contracts/town'
import factory from '../../public/art/places/factory.svg?raw'
import farm from '../../public/art/places/farm.svg?raw'
import homes from '../../public/art/places/homes.svg?raw'
import office from '../../public/art/places/office.svg?raw'
import powerStation from '../../public/art/places/powerStation.svg?raw'
import school from '../../public/art/places/school.svg?raw'
import storage from '../../public/art/places/storage.svg?raw'
import type { ArtTag } from '../art/ArtTag'
import { placeShapesOf } from '../art/placeShapesOf'
import { type ColorToken, color } from '../design/tokens'

const placeFiles: Readonly<Record<BuildingKind, string>> = {
  homes,
  farm,
  school,
  office,
  factory,
  powerStation,
  storage,
}

export function placeSilhouetteOf(place: BuildingKind, token: ColorToken): ReadonlyArray<ArtTag> {
  return placeShapesOf(placeFiles[place]).silhouette.map((shape) => ({
    ...shape,
    attributes: { ...shape.attributes, fill: color(token) },
  }))
}

export function placeArtOf(place: BuildingKind, level: number): ReadonlyArray<ArtTag> {
  if (level === 0) {
    return placeSilhouetteOf(place, 'surface-sunken')
  }
  const { silhouette, windows } = placeShapesOf(placeFiles[place])
  return [...silhouette, ...windows.slice(0, level)]
}
