import { PlacementBandSchema, type TownOverview } from '@mygame/contracts'
import {
  type Band,
  cardsInLearningOf,
  chromePhaseOf,
  type DomainError,
  deriveLessonDurationSeconds,
  type FrameReader,
  glossOf,
  type Headword,
  type HeldCard,
  hasBandStartedAt,
  heldOutWordsAt,
  isLessonPlacedOut,
  type LessonSlot,
  type LessonWord,
  ok,
  placedOutBandsOf,
  type ReleasedLesson,
  type Result,
  readableWordsOf,
  readingFrameOf,
  retainedWordsOf,
  type Scaffold,
  type SchoolLesson,
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
  | 'lessons'
  | 'releasedLessons'
  | 'hasBandStarted'
  | 'skills'
  | 'lessonSlot'
  | 'learning'
  | 'chromePhase'
>

type LessonState = TownOverview['lessons'][number]

type ReleasedLessonState = TownOverview['releasedLessons'][number]

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
  reader: FrameReader,
): LessonWordState => {
  const { isReadable } = view
  return {
    wordId: word.id,
    standing: wordStandingOf(held),
    reading: isReadable
      ? {
          word: word.acceptedForms[0],
          gloss: glossOf(word, reader.scaffold),
          frame: [...readingFrameOf(word, reader)],
        }
      : null,
    support: supportStateOf(word, held, view, reader.scaffold),
  }
}

const lessonWordsOf = (
  lesson: SchoolLesson,
  learner: LearnerState,
  lessons: LessonLibrary,
): Pick<LessonState, 'isStudied' | 'words'> => {
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
        { cards, placedOutBands, scaffold, lessons },
      ),
    ),
  }
}

const lessonStateOf = (
  lesson: ShelvedLesson,
  learner: LearnerState,
  lessons: LessonLibrary,
  durationSeconds: number,
): LessonState => ({
  id: lesson.id,
  theme: lesson.theme,
  durationSeconds,
  requiredSchoolLevel: lesson.requiredSchoolLevel,
  skill: { ...lesson.skill },
  ...lessonWordsOf(lesson, learner, lessons),
})

const releasedLessonStateOf = (
  lesson: ReleasedLesson,
  learner: LearnerState,
  lessons: LessonLibrary,
  durationSeconds: number,
): ReleasedLessonState => ({
  id: lesson.id,
  band: PlacementBandSchema.parse(lesson.band),
  position: lesson.position,
  durationSeconds,
  requiredSchoolLevel: lesson.requiredSchoolLevel,
  ...lessonWordsOf(lesson, learner, lessons),
})

const lessonSlotOf = (slot: LessonSlot): TownOverview['lessonSlot'] =>
  slot.kind === 'idle'
    ? null
    : {
        lessonId: slot.lessonId,
        startedAt: isoOf(slot.startedAt),
        finishesAt: isoOf(slot.finishesAt),
      }

export const schoolOverviewOf = (
  { town, at, lessonSlot, cards, bandStarts, placementScores, scaffold }: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  released: ReadonlyArray<ReleasedLesson>,
): Result<SchoolOverview, DomainError> => {
  const school = schoolLevelOf(town.buildingLevels.school, catalog)
  if (!school.ok) {
    return school
  }
  const studyPercent = studyPercentAt(at, catalog.townSettings())
  const learner = {
    cards,
    heldOutWords: heldOutWordsAt(bandStarts, at),
    lessonSlot,
    placedOutBands: placedOutBandsOf(placementScores),
    scaffold,
  }
  const durationOf = ({ durationSeconds }: SchoolLesson): number =>
    deriveLessonDurationSeconds(durationSeconds, school.value.lessonPercent, studyPercent)
  return ok({
    lessons: lessons
      .lessons()
      .map((lesson) => lessonStateOf(lesson, learner, lessons, durationOf(lesson))),
    releasedLessons: released.map((lesson) =>
      releasedLessonStateOf(lesson, learner, lessons, durationOf(lesson)),
    ),
    hasBandStarted: hasBandStartedAt(bandStarts, at),
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
