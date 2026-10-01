import type { CampTier } from '../camp/CampTier'
import type { Stocks } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'

type MarchOnTheRoad = {
  readonly kind: 'away'
  readonly province: number
  readonly plot: number
  readonly units: UnitCountsByKind
  readonly stayHours: number
  readonly departedAt: Instant
  readonly oneWaySeconds: number
  readonly loot: Stocks
  readonly lootPercent: Readonly<Record<ResourceKind, number>>
  readonly recalledAt?: Instant
}

export type AttackedCamp = {
  readonly tier: CampTier
  readonly strength: number
}

export type ForageMarch = MarchOnTheRoad & { readonly order: 'forage' }

export type AttackMarch = MarchOnTheRoad & {
  readonly order: 'attack'
  readonly camp: AttackedCamp
  readonly fought: boolean
}

export type AwayMarch = ForageMarch | AttackMarch

export type March = { readonly kind: 'idle' } | AwayMarch
