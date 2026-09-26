import type { BuildingKind } from '../ports/BuildingCatalog'
import type { Stocks } from './Fief'

export type BuildQueueEntry = {
  readonly building: BuildingKind
  readonly targetLevel: number
  readonly cost: Stocks
  readonly durationSeconds: number
}

export type BuildQueue = ReadonlyArray<BuildQueueEntry>

export type UpgradeTarget = Pick<BuildQueueEntry, 'building' | 'targetLevel'>
