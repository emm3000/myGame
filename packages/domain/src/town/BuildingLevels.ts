import type { BuildingKind } from './BuildingKind'

export type BuildingLevels = Readonly<Record<BuildingKind, number>>

export const foundingLevels: BuildingLevels = {
  homes: 1,
  farm: 0,
  factory: 0,
  powerStation: 0,
  storage: 0,
  school: 1,
  office: 0,
}
