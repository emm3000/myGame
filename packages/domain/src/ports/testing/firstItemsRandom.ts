import type { RandomSource } from '../RandomSource'

export const firstItemsRandom: RandomSource = {
  sampleOf: (items, count) => {
    if (count > items.length) {
      throw new RangeError(`Cannot sample ${count} of ${items.length} items`)
    }
    return items.slice(0, count)
  },
}
