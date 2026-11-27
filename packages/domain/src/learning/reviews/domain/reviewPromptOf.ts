import type { MemoryCard } from '#memory/domain/MemoryCard'
import type { FrameLearner } from '../../frames/domain/FrameLearner'
import type { FrameSpans } from '../../frames/domain/FrameSpan'
import { frameSpansOf } from '../../frames/domain/frameSpansOf'
import { glossOf } from '../../scaffold/domain/glossOf'
import type { SupportText } from '../../scaffold/domain/supportTextOf'
import { reviewFormatOf } from './ReviewFormat'
import { recognitionChoicesOf } from './recognitionChoicesOf'
import type { TaughtWord } from './taughtWordOf'

export type ShownWord = TaughtWord & {
  readonly card: MemoryCard
  readonly shownFrame: string
}

export type ReviewChoice = { readonly choiceId: string; readonly gloss: string }

export type ReviewPrompt =
  | {
      readonly mode: 'recognition'
      readonly word: string
      readonly frame: FrameSpans
      readonly choices: ReadonlyArray<ReviewChoice>
    }
  | { readonly mode: 'recall'; readonly gloss: string; readonly gappedFrame: FrameSpans }

const holdsAnyForm = ({ text }: SupportText, forms: ReadonlySet<string>): boolean =>
  (text.toLowerCase().match(/[a-z]+/g) ?? []).some((token) => forms.has(token))

const recallOf = ({ word, shownFrame }: ShownWord, learner: FrameLearner): ReviewPrompt => {
  const forms = learner.lessons.answerFormsOf(word.id)
  return {
    mode: 'recall',
    gloss: glossOf(word, learner.scaffold),
    gappedFrame: frameSpansOf(
      shownFrame,
      learner.lessons.frameTokensOf(word.id, shownFrame),
      learner,
      (wordId, support) => wordId === word.id || holdsAnyForm(support, forms),
    ),
  }
}

const recognitionOf = (
  { lesson, word, card, shownFrame }: ShownWord,
  learner: FrameLearner,
): ReviewPrompt => {
  const choices = recognitionChoicesOf(word.id, lesson, card, learner.cards).flatMap(
    ({ choiceId, wordId }) =>
      lesson.words
        .filter(({ id }) => id === wordId)
        .map((offered) => ({ choiceId, gloss: glossOf(offered, learner.scaffold) })),
  )
  return {
    mode: 'recognition',
    word: word.acceptedForms[0],
    frame: frameSpansOf(
      shownFrame,
      learner.lessons.frameTokensOf(word.id, shownFrame),
      learner,
      (wordId, { text }) => wordId === word.id || choices.some(({ gloss }) => gloss === text),
    ),
    choices,
  }
}

export const reviewPromptOf = (shown: ShownWord, learner: FrameLearner): ReviewPrompt =>
  reviewFormatOf(shown.card) === 'recall' ? recallOf(shown, learner) : recognitionOf(shown, learner)
