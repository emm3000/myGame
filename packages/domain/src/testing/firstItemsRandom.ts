import type { RandomSource } from '../ports/RandomSource'

export const firstItemsRandom: RandomSource = {
  sampleOf: (items, count) => items.slice(0, count),
}
