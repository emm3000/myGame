import type { Instant } from '../../time/Instant'
import type { Stocks } from '../Stocks'
import type { BuildingKind } from './BuildingKind'

export type WorkTarget = {
  readonly building: BuildingKind
  readonly level: number
}

export type BusyWorkSlot = WorkTarget & {
  readonly kind: 'busy'
  readonly cost: Stocks
  readonly startedAt: Instant
  readonly finishesAt: Instant
}

export type WorkSlot = { readonly kind: 'idle' } | BusyWorkSlot

export const idleWorkSlot: WorkSlot = { kind: 'idle' }
