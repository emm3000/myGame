import type { Stocks } from '../../resources/domain/Stocks'

export type HireTerms = {
  readonly cost: Stocks
  readonly durationSeconds: number
  readonly people: number
  readonly strength: number
  readonly carry: number
  readonly roadPercent: number
}
