import type { ArtKind, BuildingKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'

export type FiefEvent =
  | {
      readonly kind: 'upgradeFinished'
      readonly building: BuildingKind
      readonly level: number
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'artLearned'
      readonly art: ArtKind
      readonly level: number
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'upgradeCancelled'
      readonly building: BuildingKind
      readonly level: number
      readonly occurredAt: Instant
      readonly refund: Stocks
    }
  | {
      readonly kind: 'studyCancelled'
      readonly art: ArtKind
      readonly level: number
      readonly occurredAt: Instant
      readonly refund: Stocks
    }
