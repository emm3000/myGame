import type { Stocks } from './Stocks'

export type HireTerms = {
  readonly cost: Stocks
  readonly durationSeconds: number
  readonly people: number
  readonly strength: number
  readonly carry: number
  readonly roadPercent: number
}
