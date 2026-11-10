import type { Instant } from '../time/Instant'
import type { HireKind } from './HireKind'
import type { Stocks } from './Stocks'

export type HiringOrder = {
  readonly kind: 'busy'
  readonly hire: HireKind
  readonly count: number
  readonly costPerHire: Stocks
  readonly secondsPerHire: number
  readonly startedAt: Instant
}

export type HiringSlot = { readonly kind: 'idle' } | HiringOrder

export type HiringTarget = Pick<HiringOrder, 'hire' | 'startedAt'>

export const idleHiringSlot: HiringSlot = { kind: 'idle' }
