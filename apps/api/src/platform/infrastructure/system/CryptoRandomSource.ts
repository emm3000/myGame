import { randomInt } from 'node:crypto'
import type { RandomSource } from '@mygame/domain'

export class CryptoRandomSource implements RandomSource {
  sampleOf<T>(items: ReadonlyArray<T>, count: number): ReadonlyArray<T> {
    if (count > items.length) {
      throw new RangeError(`Cannot sample ${count} of ${items.length} items`)
    }
    const remaining = [...items]
    return Array.from({ length: count }).flatMap(() =>
      remaining.splice(randomInt(remaining.length), 1),
    )
  }
}
