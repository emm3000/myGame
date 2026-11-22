import {
  type Band,
  type FrameLearner,
  type FrameSpans,
  type Headword,
  type HeldCard,
  type HeldCards,
  holdsLessonCards,
  isLessonPlacedOut,
  isLessonUnderStudy,
  type LessonSlot,
  type LessonWord,
  readableWordsOf,
  readingFrameOf,
  type Scaffold,
  type SchoolLesson,
  type SupportLevel,
  type SupportText,
  supportLevelOf,
  supportTextOf,
  type WordId,
  type WordStanding,
  wordStandingOf,
  wordsEnteringOf,
} from '@mygame/domain'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'

export type LessonWordView = {
  readonly wordId: WordId
  readonly standing: WordStanding
  readonly reading: { readonly word: string; readonly frame: FrameSpans } | null
  readonly support: (Pick<SupportLevel, 'shown'> & SupportText) | null
}

export type LessonWordsView = {
  readonly isStudied: boolean
  readonly words: ReadonlyArray<LessonWordView>
  readonly enteringWordCount: number
}

export type SchoolLearner = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldCards: HeldCards
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly lessonSlot: LessonSlot
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
}

type WordInLesson = {
  readonly isReadable: boolean
  readonly isEntering: boolean
  readonly isPlacedOut: boolean
}

const supportOf = (
  word: LessonWord,
  held: HeldCard | undefined,
  { isEntering, isPlacedOut }: WordInLesson,
  scaffold: Scaffold,
): LessonWordView['support'] => {
  if (!isEntering) {
    return null
  }
  const support = supportLevelOf(held, isPlacedOut, scaffold)
  return { shown: support.shown, ...supportTextOf(word, support) }
}

const wordViewOf = (
  word: LessonWord,
  held: HeldCard | undefined,
  inLesson: WordInLesson,
  learner: FrameLearner,
): LessonWordView => ({
  wordId: word.id,
  standing: wordStandingOf(held),
  reading: inLesson.isReadable
    ? { word: word.acceptedForms[0], frame: readingFrameOf(word, learner) }
    : null,
  support: supportOf(word, held, inLesson, learner.scaffold),
})

export const gatherLessonWordsView = (
  lesson: SchoolLesson,
  learner: SchoolLearner,
  lessons: LessonLibrary,
): LessonWordsView => {
  const { cards, heldCards, heldOutWords, lessonSlot, placedOutBands, scaffold } = learner
  const readable = readableWordsOf(
    lesson,
    heldOutWords,
    heldCards,
    isLessonUnderStudy(lesson, lessonSlot),
  )
  const entering = wordsEnteringOf(lesson, heldOutWords)
  const isPlacedOut = isLessonPlacedOut(lesson, placedOutBands, lessons)
  const frameLearner = { cards: heldCards, placedOutBands, scaffold, lessons }
  return {
    isStudied: holdsLessonCards(lesson, cards),
    words: lesson.words.map((word) =>
      wordViewOf(
        word,
        heldCards.get(word.id),
        {
          isReadable: readable.includes(word),
          isEntering: entering.includes(word),
          isPlacedOut,
        },
        frameLearner,
      ),
    ),
    enteringWordCount: entering.length,
  }
}
