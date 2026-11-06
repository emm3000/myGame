import type { DomainError } from '../DomainError'
import type { Headword } from '../learning/BandStart'
import { dueCardsAt } from '../learning/dueCardsAt'
import type { HeldCard } from '../learning/HeldCard'
import type { Lesson, LessonId } from '../learning/Lesson'
import { readFirstOf } from '../learning/readFirstOf'
import { wordsEnteringOf } from '../learning/wordsEnteringOf'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { admitSchoolLesson } from './admitSchoolLesson'
import type { BusyLessonSlot, LessonSlot } from './LessonSlot'
import { type ProducerBuilding, producerOf } from './producerOf'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type NextStep =
  | {
      readonly kind: 'reviews'
      readonly count: number
      readonly readFirst: ReadonlyArray<LessonId>
    }
  | { readonly kind: 'lessonRunning'; readonly producer: ProducerBuilding | null }
  | { readonly kind: 'lessonToStudy'; readonly lessonId: LessonId }
  | { readonly kind: 'caughtUp' }

export type NextStepReading = {
  readonly town: Town
  readonly at: Instant
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldOutWords: ReadonlyArray<Headword>
}

export type NextStepTerms = {
  readonly lessons: ReadonlyArray<Lesson>
  readonly memoryTerms: MemoryTerms
  readonly catalog: TownCatalog
}

const lessonRunningStep = (
  { lessonId }: BusyLessonSlot,
  town: Town,
  lessons: ReadonlyArray<Lesson>,
): NextStep => {
  const lesson = lessons.find(({ id }) => id === lessonId)
  if (lesson === undefined) {
    return { kind: 'lessonRunning', producer: null }
  }
  const producer = producerOf(lesson.skill.resource)
  const isStanding = producer === null || town.projectedLevels[producer] > 0
  return { kind: 'lessonRunning', producer: isStanding ? null : producer }
}

const lessonStep = (
  { town, lessonSlot, cards, heldOutWords }: NextStepReading,
  { lessons, catalog }: NextStepTerms,
): Result<NextStep, DomainError> => {
  for (const lesson of lessons) {
    const admitted = admitSchoolLesson(
      lesson,
      wordsEnteringOf(lesson, heldOutWords).length,
      { held: cards, slot: lessonSlot },
      town.buildingLevels.school,
      catalog,
    )
    if (admitted.ok) {
      return ok({ kind: 'lessonToStudy', lessonId: lesson.id })
    }
    if (admitted.error.kind === 'UnknownTownBuildingLevel') {
      return admitted
    }
  }
  return ok({ kind: 'caughtUp' })
}

export const nextStepOf = (
  reading: NextStepReading,
  terms: NextStepTerms,
): Result<NextStep, DomainError> => {
  const { town, at, lessonSlot, cards } = reading
  const due = dueCardsAt(cards, at, terms.memoryTerms)
  if (!due.ok) {
    return due
  }
  if (due.value.length > 0) {
    return ok({
      kind: 'reviews',
      count: due.value.length,
      readFirst: readFirstOf(terms.lessons, due.value),
    })
  }
  if (lessonSlot.kind === 'busy') {
    return ok(lessonRunningStep(lessonSlot, town, terms.lessons))
  }
  return lessonStep(reading, terms)
}
