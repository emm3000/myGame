import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'

export type FullSince = Readonly<Record<ResourceKind, Instant | null>>

export const noStoreFull: FullSince = {
  wood: null,
  stone: null,
  iron: null,
  gold: null,
  food: null,
}
