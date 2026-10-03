import type { CampTier } from '../camp/CampTier'
import type { ArtKind, BuildingKind, UnitKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'
import type { UnitCountsByKind } from './FiefUnitCounts'

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
  | {
      readonly kind: 'recruitsDelivered'
      readonly unit: UnitKind
      readonly count: number
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'recruitsCancelled'
      readonly unit: UnitKind
      readonly delivered: number
      readonly cancelled: number
      readonly occurredAt: Instant
      readonly refund: Stocks
    }
  | {
      readonly kind: 'marchReturned'
      readonly province: number
      readonly plot: number
      readonly units: UnitCountsByKind
      readonly loot: Stocks
      readonly recalled: boolean
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'battleFought'
      readonly province: number
      readonly plot: number
      readonly tier: CampTier
      readonly won: boolean
      readonly unitsLost: UnitCountsByKind
      readonly campLost: number
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'foundingSent'
      readonly province: number
      readonly plot: number
      readonly name: string
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'fiefFounded'
      readonly province: number
      readonly plot: number
      readonly name: string
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'transportSent'
      readonly province: number
      readonly plot: number
      readonly name: string
      readonly cargo: Stocks
      readonly occurredAt: Instant
    }
  | {
      readonly kind: 'transportArrived'
      readonly province: number
      readonly plot: number
      readonly name: string
      readonly cargo: Stocks
      readonly occurredAt: Instant
    }
