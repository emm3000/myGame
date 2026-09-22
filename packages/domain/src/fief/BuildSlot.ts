import type { BuildingKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'

export type BuildSlot =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'busy'
      readonly building: BuildingKind
      readonly targetLevel: number
      readonly finishesAt: Instant
    }
