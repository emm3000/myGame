import { isLessonPlacedOut } from '../../curriculum/domain/isLessonPlacedOut'
import type { WordId } from '../../domain/Lesson'
import { supportLevelOf } from '../../scaffold/domain/supportLevelOf'
import { type SupportText, supportTextOf } from '../../scaffold/domain/supportTextOf'
import type { WordSupport } from '../../scaffold/domain/WordSupport'
import type { FrameLearner } from './FrameLearner'
import type { FrameSpan, FrameSpans } from './FrameSpan'
import type { FrameToken } from './FrameToken'

export type Withholding = (wordId: WordId, support: SupportText) => boolean

export const withholdingNothing: Withholding = () => false

const supportOf = (
  wordId: WordId,
  { cards, placedOutBands, scaffold, lessons }: FrameLearner,
): WordSupport | null => {
  const lesson = lessons.lessonOfWord(wordId)
  const word = lesson?.words.find(({ id }) => id === wordId)
  if (lesson === undefined || word === undefined) {
    return null
  }
  const held = cards.get(wordId)
  const level = supportLevelOf(held, isLessonPlacedOut(lesson, placedOutBands, lessons), scaffold)
  return { shown: level.shown, ...supportTextOf(word, level) }
}

const spanOf = (
  { text, wordId }: FrameToken,
  learner: FrameLearner,
  isWithheld: Withholding,
): FrameSpan => {
  if (wordId === null) {
    return { text, support: null }
  }
  const support = supportOf(wordId, learner)
  return { text, support: support === null || isWithheld(wordId, support) ? null : support }
}

export const frameSpansOf = (
  frame: string,
  tokens: ReadonlyArray<FrameToken> | undefined,
  learner: FrameLearner,
  isWithheld: Withholding,
): FrameSpans => {
  const [first, ...rest] = tokens ?? []
  if (first === undefined) {
    return [{ text: frame, support: null }]
  }
  return [
    spanOf(first, learner, isWithheld),
    ...rest.map((token) => spanOf(token, learner, isWithheld)),
  ]
}
