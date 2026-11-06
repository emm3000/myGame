import type { DomainError } from '../DomainError'
import { cardsInLearningOf } from '../learning/cardsInLearningOf'
import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import type { Lesson } from '../learning/Lesson'
import { err, ok, type Result } from '../Result'
import type { SchoolLevel } from './BuildingLevel'
import type { LessonSlot } from './LessonSlot'
import { schoolLevelOf } from './schoolLevelOf'
import type { TownCatalog } from './TownCatalog'

export type SchoolState = {
  readonly held: ReadonlyArray<HeldCard>
  readonly slot: LessonSlot
}

const admitToLearningCap = (
  lessonWordCount: number,
  cards: ReadonlyArray<HeldCard>,
  school: SchoolLevel,
): Result<SchoolLevel, DomainError> => {
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
  lesson: Lesson,
  enteringWordCount: number,
  { held: cards, slot }: SchoolState,
  schoolLevel: number,
  catalog: TownCatalog,
): Result<SchoolLevel, DomainError> => {
  if (holdsLessonCards(lesson, cards)) {
    return err({ kind: 'LessonAlreadyStudied', lessonId: lesson.id })
  }
  if (slot.kind === 'busy') {
    return err(
      slot.lessonId === lesson.id
        ? { kind: 'LessonUnderStudy', lessonId: lesson.id }
        : { kind: 'StudySlotBusy' },
    )
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
