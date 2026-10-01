import type { ArtKind, BuildingKind, UnitKind } from '@mygame/domain'
import type { art, building, unit } from './schema'

export type StoredBuilding = (typeof building.enumValues)[number]

export type StoredArt = (typeof art.enumValues)[number]

export type StoredUnit = (typeof unit.enumValues)[number]

export const storedArts: Readonly<Record<ArtKind, StoredArt>> = {
  smithing: 'smithing',
  masonry: 'masonry',
}

export const artKinds: Readonly<Record<StoredArt, ArtKind>> = {
  smithing: 'smithing',
  masonry: 'masonry',
}

export const storedBuildings: Readonly<Record<BuildingKind, StoredBuilding>> = {
  sawmill: 'sawmill',
  quarry: 'quarry',
  ironMine: 'iron_mine',
  farm: 'farm',
  warehouse: 'warehouse',
  library: 'library',
  barracks: 'barracks',
}

export const buildingKinds: Readonly<Record<StoredBuilding, BuildingKind>> = {
  sawmill: 'sawmill',
  quarry: 'quarry',
  iron_mine: 'ironMine',
  farm: 'farm',
  warehouse: 'warehouse',
  library: 'library',
  barracks: 'barracks',
}

export const storedUnits: Readonly<Record<UnitKind, StoredUnit>> = {
  infantry: 'infantry',
  cavalry: 'cavalry',
}

export const unitKinds: Readonly<Record<StoredUnit, UnitKind>> = {
  infantry: 'infantry',
  cavalry: 'cavalry',
}
