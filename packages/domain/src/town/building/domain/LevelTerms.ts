import type { Stocks } from '../../resources/Stocks'

export type LevelTerms = {
  readonly level: number
  readonly cost: Stocks
  readonly durationSeconds: number
  readonly people: number
}
