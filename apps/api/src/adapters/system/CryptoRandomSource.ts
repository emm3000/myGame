import { randomInt } from 'node:crypto'
import type { RandomSource } from '@mygame/domain'

export class CryptoRandomSource implements RandomSource {
  sampleOf<T>(items: ReadonlyArray<T>, count: number): ReadonlyArray<T> {
    const remaining = [...items]
    return Array.from({ length: count }).flatMap(() =>
      remaining.splice(randomInt(remaining.length), 1),
    )
  }
}
