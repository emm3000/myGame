import type { OpenText } from '@mygame/contracts'
import type { LessonLibrary, TownReading } from '@mygame/domain'
import {
  heldCardsOf,
  openTextsOf,
  placedOutBandsOf,
  type TextId,
  textReadingOf,
} from '@mygame/domain'

export const presentOpenText = (
  textId: TextId,
  { cards, placementScores, scaffold }: TownReading,
  lessons: LessonLibrary,
): OpenText | undefined => {
  const placedOutBands = placedOutBandsOf(placementScores)
  const opened = openTextsOf(lessons.texts(), {
    curriculum: lessons.lessons(),
    cards,
    placedOutBands,
    bands: lessons,
  })
  const text = opened.find(({ id }) => id === textId)
  if (text === undefined) {
    return undefined
  }
  const reader = { cards: heldCardsOf(cards), placedOutBands, scaffold, lessons }
  const { id, title, sentences } = textReadingOf(text, reader, lessons)
  return { id, title, sentences: sentences.map((spans) => [...spans]) }
}
