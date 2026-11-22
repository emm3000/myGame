import type { Stocks } from '../../resources/Stocks'
import type { WorkTarget } from './BuildingWork'

export type WaitingWork = WorkTarget & {
  readonly cost: Stocks
  readonly durationSeconds: number
}

export type WaitingList = ReadonlyArray<WaitingWork>
