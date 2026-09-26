import type { BuildingKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'

export type BuildSlot =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'busy'
      readonly building: BuildingKind
      readonly targetLevel: number
      readonly startedAt: Instant
      readonly finishesAt: Instant
      readonly cost: Stocks
    }

export type BusySlot = Extract<BuildSlot, { readonly kind: 'busy' }>
