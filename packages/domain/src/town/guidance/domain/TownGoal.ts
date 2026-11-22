import type { BuildingKind } from '../../building/domain/BuildingKind'

export type TownGoal = {
  readonly building: BuildingKind
  readonly level: number
}
