import type { Stocks } from '../resources/Stocks'

export type CleanUpQuote = {
  readonly strength: number
  readonly waste: number
  readonly pay: Stocks
  readonly covers: boolean
}
