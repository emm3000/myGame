import type { Instant } from '../time/Instant'
import type { BuildingKind } from './BuildingKind'
import type { Stocks } from './Stocks'

export type WorkTarget = {
  readonly building: BuildingKind
  readonly level: number
}

export type WaitingWork = WorkTarget & {
  readonly cost: Stocks
  readonly durationSeconds: number
}

export type WaitingList = ReadonlyArray<WaitingWork>

export type BusyWorkSlot = WorkTarget & {
  readonly kind: 'busy'
  readonly cost: Stocks
  readonly startedAt: Instant
  readonly finishesAt: Instant
}

export type WorkSlot = { readonly kind: 'idle' } | BusyWorkSlot

export const idleWorkSlot: WorkSlot = { kind: 'idle' }
