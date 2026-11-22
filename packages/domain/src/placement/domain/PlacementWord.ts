import type { Headword } from '#learning/curriculum/domain/Headword'
import type { WordId } from '#learning/domain/Lesson'

export type PlacementWord = {
  readonly id: WordId
  readonly headword: Headword
  readonly word: string
  readonly gloss: string
  readonly definition: string
  readonly isChrome: boolean
}
