import {
  type BandLine,
  bandLinesOf,
  type ChromePhase,
  cardsInLearningOf,
  chromePhaseOf,
  type DomainError,
  deriveLessonDurationSeconds,
  hasBandStartedAt,
  heldCardsOf,
  heldOutWordsAt,
  type Instant,
  type LessonSlot,
  type MemoryTerms,
  nextInLearningDueAtOf,
  ok,
  openTextsOf,
  placedOutBandsOf,
  type ReleasedLesson,
  type Result,
  type RetainedWords,
  releasedLessonsOf,
  retainedWordsOf,
  type SchoolLesson,
  type SchoolLevel,
  schoolLevelOf,
  studyPercentAt,
  type Text,
  type TownCatalog,
  type TownSkill,
} from '@mygame/domain'
import type { LessonLibrary, ShelvedLesson } from '#content/application/ports/LessonLibrary'
import type { TownReading } from '../../application/TownReading'
import {
  gatherLessonWordsView,
  type LessonWordsView,
  type SchoolLearner,
} from './gatherLessonWordsView'

export type LessonView<Shelf extends SchoolLesson> = LessonWordsView & {
  readonly lesson: Shelf
  readonly durationSeconds: number
}

export type LearningView = {
  readonly cap: number
  readonly inLearning: number
  readonly retainedWords: RetainedWords | null
  readonly nextInLearningDueAt: Instant | null
}

export type SchoolView = {
  readonly lessons: ReadonlyArray<LessonView<ShelvedLesson>>
  readonly releasedLessons: ReadonlyArray<LessonView<ReleasedLesson>>
  readonly texts: ReadonlyArray<Text>
  readonly hasBandStarted: boolean
  readonly bandLines: ReadonlyArray<BandLine>
  readonly skills: ReadonlyArray<TownSkill>
  readonly lessonSlot: LessonSlot
  readonly learning: LearningView
  readonly chromePhase: ChromePhase
}

const learnerOf = ({
  at,
  lessonSlot,
  cards,
  bandStarts,
  placementScores,
  scaffold,
}: TownReading): SchoolLearner => ({
  cards,
  heldCards: heldCardsOf(cards),
  heldOutWords: heldOutWordsAt(bandStarts, at),
  lessonSlot,
  placedOutBands: placedOutBandsOf(placementScores),
  scaffold,
})

const lessonViewsOf = (
  reading: TownReading,
  school: SchoolLevel,
  catalog: TownCatalog,
  lessons: LessonLibrary,
): Pick<SchoolView, 'lessons' | 'releasedLessons'> => {
  const learner = learnerOf(reading)
  const studyPercent = studyPercentAt(reading.at, catalog.townSettings())
  const lessonViewOf = <Shelf extends SchoolLesson>(lesson: Shelf): LessonView<Shelf> => ({
    lesson,
    durationSeconds: deriveLessonDurationSeconds(
      lesson.durationSeconds,
      school.lessonPercent,
      studyPercent,
    ),
    ...gatherLessonWordsView(lesson, learner, lessons),
  })
  const released = releasedLessonsOf(reading.bandStarts, reading.cards, {
    lessons,
    bands: lessons,
  })
  return {
    lessons: lessons.lessons().map((lesson) => lessonViewOf(lesson)),
    releasedLessons: released.map((lesson) => lessonViewOf(lesson)),
  }
}

export const gatherSchoolView = (
  reading: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<SchoolView, DomainError> => {
  const { town, at, lessonSlot, cards, bandStarts, placementScores, scaffold } = reading
  const school = schoolLevelOf(town.buildingLevels.school, catalog)
  if (!school.ok) {
    return school
  }
  const nextInLearningDueAt = nextInLearningDueAtOf(cards, memoryTerms)
  if (!nextInLearningDueAt.ok) {
    return nextInLearningDueAt
  }
  return ok({
    ...lessonViewsOf(reading, school.value, catalog, lessons),
    texts: openTextsOf(lessons.texts(), {
      curriculum: lessons.lessons(),
      cards,
      placedOutBands: placedOutBandsOf(placementScores),
      bands: lessons,
    }),
    hasBandStarted: hasBandStartedAt(bandStarts, at),
    bandLines: bandLinesOf(bandStarts, cards, { lessons, bands: lessons }),
    skills: town.skills,
    lessonSlot,
    learning: {
      cap: school.value.learningCap,
      inLearning: cardsInLearningOf(cards),
      retainedWords: retainedWordsOf(lessons.lessons(), town.skills, cards),
      nextInLearningDueAt: nextInLearningDueAt.value,
    },
    chromePhase: chromePhaseOf(scaffold, lessons.chromeLessons(), cards, town.skills),
  })
}
