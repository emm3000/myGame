import type { UnitKind } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'

export type OpenRecruitOrder = {
  readonly kind: 'open'
  readonly unit: UnitKind
  readonly count: number
  readonly cost: Stocks
  readonly perUnitSeconds: number
  readonly startedAt: Instant
}

export type RecruitOrder = { readonly kind: 'idle' } | OpenRecruitOrder
