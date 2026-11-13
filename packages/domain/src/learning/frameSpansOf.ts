import type { FrameReader } from './FrameReader'
import type { FrameSpan, FrameSpans } from './FrameSpan'
import type { FrameToken } from './FrameToken'
import { isLessonPlacedOut } from './isLessonPlacedOut'
import { supportLevelOf } from './supportLevelOf'
import { type SupportText, supportTextOf } from './supportTextOf'
import type { WordSupport } from './WordSupport'

export type Withholding = (support: SupportText) => boolean

const supportOf = (
  { wordId }: FrameToken,
  { cards, placedOutBands, scaffold, lessons }: FrameReader,
): WordSupport | null => {
  if (wordId === null) {
    return null
  }
  const lesson = lessons.lessonOfWord(wordId)
  const word = lesson?.words.find(({ id }) => id === wordId)
  if (lesson === undefined || word === undefined) {
    return null
  }
  const held = cards.find((card) => card.wordId === wordId)
  const level = supportLevelOf(held, isLessonPlacedOut(lesson, placedOutBands, lessons), scaffold)
  return { shown: level.shown, ...supportTextOf(word, level) }
}

const spanOf = (token: FrameToken, reader: FrameReader, isWithheld: Withholding): FrameSpan => {
  const support = supportOf(token, reader)
  return { text: token.text, support: support === null || isWithheld(support) ? null : support }
}

export const frameSpansOf = (
  frame: string,
  tokens: ReadonlyArray<FrameToken> | undefined,
  reader: FrameReader,
  isWithheld: Withholding,
): FrameSpans => {
  const [first, ...rest] = tokens ?? []
  if (first === undefined) {
    return [{ text: frame, support: null }]
  }
  return [
    spanOf(first, reader, isWithheld),
    ...rest.map((token) => spanOf(token, reader, isWithheld)),
  ]
}
