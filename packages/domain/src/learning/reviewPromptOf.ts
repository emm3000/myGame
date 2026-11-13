import type { MemoryCard } from '../memory/MemoryCard'
import { glossOf } from './glossOf'
import type { HeldCard } from './HeldCard'
import { reviewFormatOf } from './ReviewFormat'
import { recognitionChoicesOf } from './recognitionChoicesOf'
import type { Scaffold } from './Scaffold'
import type { TaughtWord } from './taughtWordOf'

export type ShownWord = TaughtWord & {
  readonly card: MemoryCard
  readonly shownFrame: string
}

export type ReviewPrompt =
  | {
      readonly mode: 'recognition'
      readonly word: string
      readonly frame: string
      readonly choices: ReadonlyArray<{ readonly choiceId: string; readonly gloss: string }>
    }
  | { readonly mode: 'recall'; readonly gloss: string; readonly gappedFrame: string }

export const reviewPromptOf = (
  { lesson, word, card, shownFrame }: ShownWord,
  cards: ReadonlyArray<HeldCard>,
  scaffold: Scaffold,
): ReviewPrompt => {
  if (reviewFormatOf(card) === 'recall') {
    return { mode: 'recall', gloss: glossOf(word, scaffold), gappedFrame: shownFrame }
  }
  return {
    mode: 'recognition',
    word: word.acceptedForms[0],
    frame: shownFrame,
    choices: recognitionChoicesOf(word.id, lesson, card, cards).flatMap(({ choiceId, wordId }) =>
      lesson.words
        .filter(({ id }) => id === wordId)
        .map((offered) => ({ choiceId, gloss: glossOf(offered, scaffold) })),
    ),
  }
}
