import type { BuildingKind } from '../building/BuildingKind'

export type TownGoal = {
  readonly building: BuildingKind
  readonly level: number
}
