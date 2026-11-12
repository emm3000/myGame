import type { WordId } from '../learning/Lesson'

export type PlacementWord = {
  readonly id: WordId
  readonly word: string
  readonly gloss: string
  readonly isChrome: boolean
}
