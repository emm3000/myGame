import type { MemoryCard } from '../memory/MemoryCard'
import type { FrameReader } from './FrameReader'
import type { FrameSpans } from './FrameSpan'
import { frameSpansOf } from './frameSpansOf'
import { glossOf } from './glossOf'
import { reviewFormatOf } from './ReviewFormat'
import { recognitionChoicesOf } from './recognitionChoicesOf'
import type { SupportText } from './supportTextOf'
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

const recallOf = ({ word, shownFrame }: ShownWord, reader: FrameReader): ReviewPrompt => {
  const forms = reader.lessons.answerFormsOf(word.id)
  return {
    mode: 'recall',
    gloss: glossOf(word, reader.scaffold),
    gappedFrame: frameSpansOf(
      shownFrame,
      reader.lessons.frameTokensOf(word.id, shownFrame),
      reader,
      (support) => holdsAnyForm(support, forms),
    ),
  }
}

const recognitionOf = (
  { lesson, word, card, shownFrame }: ShownWord,
  reader: FrameReader,
): ReviewPrompt => {
  const choices = recognitionChoicesOf(word.id, lesson, card, reader.cards).flatMap(
    ({ choiceId, wordId }) =>
      lesson.words
        .filter(({ id }) => id === wordId)
        .map((offered) => ({ choiceId, gloss: glossOf(offered, reader.scaffold) })),
  )
  return {
    mode: 'recognition',
    word: word.acceptedForms[0],
    frame: frameSpansOf(
      shownFrame,
      reader.lessons.frameTokensOf(word.id, shownFrame),
      reader,
      ({ text }) => choices.some(({ gloss }) => gloss === text),
    ),
    choices,
  }
}

export const reviewPromptOf = (shown: ShownWord, reader: FrameReader): ReviewPrompt =>
  reviewFormatOf(shown.card) === 'recall' ? recallOf(shown, reader) : recognitionOf(shown, reader)
