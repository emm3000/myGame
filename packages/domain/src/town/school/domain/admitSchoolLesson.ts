import type { DomainError } from '#DomainError'
import type { HeldCard } from '#learning/HeldCard'
import { holdsLessonCards } from '#learning/holdsLessonCards'
import { cardsInLearningOf } from '#learning/retention/cardsInLearningOf'
import { err, ok, type Result } from '#Result'
import type { TownCatalog } from '../../domain/TownCatalog'
import { isLessonUnderStudy } from './isLessonUnderStudy'
import type { LessonSlot } from './LessonSlot'
import type { SchoolLesson } from './SchoolLesson'
import type { SchoolLevel } from './SchoolLevel'
import { schoolLevelOf } from './schoolLevelOf'

export type SchoolLessonRefusal = Extract<
  DomainError,
  {
    readonly kind:
      | 'LessonAlreadyStudied'
      | 'LessonUnderStudy'
      | 'StudySlotBusy'
      | 'LessonSchoolTooLow'
      | 'UnknownTownBuildingLevel'
      | 'LearningCapReached'
  }
>

export type SchoolState = {
  readonly held: ReadonlyArray<HeldCard>
  readonly slot: LessonSlot
}

const admitToLearningCap = (
  lessonWordCount: number,
  cards: ReadonlyArray<HeldCard>,
  school: SchoolLevel,
): Result<SchoolLevel, SchoolLessonRefusal> => {
  const cardsInLearning = cardsInLearningOf(cards)
  if (cardsInLearning + lessonWordCount > school.learningCap) {
    return err({
      kind: 'LearningCapReached',
      learningCap: school.learningCap,
      cardsInLearning,
      lessonWordCount,
    })
  }
  return ok(school)
}

export const admitSchoolLesson = (
  lesson: SchoolLesson,
  enteringWordCount: number,
  { held: cards, slot }: SchoolState,
  schoolLevel: number,
  catalog: TownCatalog,
): Result<SchoolLevel, SchoolLessonRefusal> => {
  if (holdsLessonCards(lesson, cards)) {
    return err({ kind: 'LessonAlreadyStudied', lessonId: lesson.id })
  }
  if (isLessonUnderStudy(lesson, slot)) {
    return err({ kind: 'LessonUnderStudy', lessonId: lesson.id })
  }
  if (slot.kind === 'busy') {
    return err({ kind: 'StudySlotBusy' })
  }
  if (schoolLevel < lesson.requiredSchoolLevel) {
    return err({
      kind: 'LessonSchoolTooLow',
      requiredSchoolLevel: lesson.requiredSchoolLevel,
      schoolLevel,
    })
  }
  const school = schoolLevelOf(schoolLevel, catalog)
  if (!school.ok) {
    return school
  }
  return admitToLearningCap(enteringWordCount, cards, school.value)
}
