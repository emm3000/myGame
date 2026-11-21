import type { BuildingKind } from './BuildingKind'

const everyBuilding: Readonly<Record<BuildingKind, true>> = {
  homes: true,
  farm: true,
  factory: true,
  powerStation: true,
  storage: true,
  school: true,
  office: true,
}

const isBuildingKind = (key: string): key is BuildingKind => key in everyBuilding

export const buildingKinds: ReadonlyArray<BuildingKind> =
  Object.keys(everyBuilding).filter(isBuildingKind)
