import type { Instant } from '../time/Instant'
import type { ResourceKind } from './ResourceKind'

export type FullSince = Readonly<Record<ResourceKind, Instant | null>>

export const noStoreFull: FullSince = {
  money: null,
  food: null,
  power: null,
  material: null,
}
