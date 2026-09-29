import type { Stocks } from '../fief/Fief'
import type { Instant } from '../time/Instant'

export type AwayMarch = {
  readonly kind: 'away'
  readonly province: number
  readonly plot: number
  readonly infantry: number
  readonly stayHours: number
  readonly departedAt: Instant
  readonly oneWaySeconds: number
  readonly loot: Stocks
  readonly recalledAt?: Instant
}

export type March = { readonly kind: 'idle' } | AwayMarch
