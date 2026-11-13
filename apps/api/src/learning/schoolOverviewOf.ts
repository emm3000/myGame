import type { TownOverview } from '@mygame/contracts'
import {
  anchorFrameOf,
  type Band,
  cardsInLearningOf,
  chromePhaseOf,
  type DomainError,
  deriveLessonDurationSeconds,
  glossOf,
  type Headword,
  type HeldCard,
  isLessonPlacedOut,
  type LessonSlot,
  type LessonWord,
  ok,
  placedOutBandsOf,
  type Result,
  readableWordsOf,
  retainedWordsOf,
  type Scaffold,
  schoolLevelOf,
  studyPercentAt,
  supportLevelOf,
  supportTextOf,
  type TownCatalog,
  wordStandingOf,
  wordsEnteringOf,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { TownReading } from '../town/TownReading'
import type { LessonLibrary, ShelvedLesson } from './LessonLibrary'

type SchoolOverview = Pick<
  TownOverview,
  'lessons' | 'skills' | 'lessonSlot' | 'learning' | 'chromePhase'
>

type LessonState = TownOverview['lessons'][number]

type LearnerState = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly lessonSlot: LessonSlot
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
}

type LessonWordState = LessonState['words'][number]

type WordView = {
  readonly isReadable: boolean
  readonly isEntering: boolean
  readonly isPlacedOut: boolean
}

const supportStateOf = (
  word: LessonWord,
  held: HeldCard | undefined,
  { isEntering, isPlacedOut }: WordView,
  scaffold: Scaffold,
): LessonWordState['support'] => {
  if (!isEntering) {
    return null
  }
  const support = supportLevelOf(held, isPlacedOut, scaffold)
  return { shown: support.shown, ...supportTextOf(word, support) }
}

const wordStateOf = (
  word: LessonWord,
  held: HeldCard | undefined,
  view: WordView,
  scaffold: Scaffold,
): LessonWordState => {
  const { isReadable } = view
  return {
    wordId: word.id,
    standing: wordStandingOf(held),
    reading: isReadable
      ? {
          word: word.acceptedForms[0],
          gloss: glossOf(word, scaffold),
          frame: anchorFrameOf(word).frame,
        }
      : null,
    support: supportStateOf(word, held, view, scaffold),
  }
}

const lessonStateOf = (
  lesson: ShelvedLesson,
  learner: LearnerState,
  lessons: LessonLibrary,
  durationSeconds: number,
): LessonState => {
  const { cards, heldOutWords, lessonSlot, placedOutBands, scaffold } = learner
  const isRunning = lessonSlot.kind === 'busy' && lessonSlot.lessonId === lesson.id
  const readable = readableWordsOf(lesson, heldOutWords, cards, isRunning)
  const entering = wordsEnteringOf(lesson, heldOutWords)
  const isPlacedOut = isLessonPlacedOut(lesson, placedOutBands, lessons)
  const words = lesson.words.map((word) => ({
    word,
    held: cards.find(({ wordId }) => wordId === word.id),
  }))
  return {
    id: lesson.id,
    theme: lesson.theme,
    durationSeconds,
    requiredSchoolLevel: lesson.requiredSchoolLevel,
    skill: { ...lesson.skill },
    isStudied: words.some(({ held }) => held !== undefined),
    words: words.map(({ word, held }) =>
      wordStateOf(
        word,
        held,
        {
          isReadable: readable.includes(word),
          isEntering: entering.includes(word),
          isPlacedOut,
        },
        scaffold,
      ),
    ),
  }
}

const lessonSlotOf = (slot: LessonSlot): TownOverview['lessonSlot'] =>
  slot.kind === 'idle'
    ? null
    : {
        lessonId: slot.lessonId,
        startedAt: isoOf(slot.startedAt),
        finishesAt: isoOf(slot.finishesAt),
      }

export const schoolOverviewOf = (
  { town, at, lessonSlot, cards, heldOutWords, placementScores, scaffold }: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
): Result<SchoolOverview, DomainError> => {
  const school = schoolLevelOf(town.buildingLevels.school, catalog)
  if (!school.ok) {
    return school
  }
  const studyPercent = studyPercentAt(at, catalog.townSettings())
  const learner = {
    cards,
    heldOutWords,
    lessonSlot,
    placedOutBands: placedOutBandsOf(placementScores),
    scaffold,
  }
  return ok({
    lessons: lessons
      .lessons()
      .map((lesson) =>
        lessonStateOf(
          lesson,
          learner,
          lessons,
          deriveLessonDurationSeconds(
            lesson.durationSeconds,
            school.value.lessonPercent,
            studyPercent,
          ),
        ),
      ),
    skills: town.skills.map(({ lessonId, resource, ratePercent, earnedAt }) => ({
      lessonId,
      resource,
      ratePercent,
      earnedAt: isoOf(earnedAt),
    })),
    lessonSlot: lessonSlotOf(lessonSlot),
    learning: {
      cap: school.value.learningCap,
      inLearning: cardsInLearningOf(cards),
      retainedWords: retainedWordsOf(lessons.lessons(), town.skills, cards),
    },
    chromePhase: chromePhaseOf(scaffold, lessons.chromeLessons(), cards, town.skills),
  })
}
