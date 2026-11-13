import type { Headword } from '../learning/BandStart'
import type { WordId } from '../learning/Lesson'

export type PlacementWord = {
  readonly id: WordId
  readonly headword: Headword
  readonly word: string
  readonly gloss: string
  readonly definition: string
  readonly isChrome: boolean
}
