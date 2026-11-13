import type { DomainError } from '../DomainError'
import type { DueHoldoutCheck } from '../holdout/DueHoldoutCheck'
import { dueHoldoutChecksOf } from '../holdout/dueHoldoutChecksOf'
import type { ReleasedLesson } from '../holdout/ReleasedLesson'
import type { Band, BandStart, Headword } from '../learning/BandStart'
import { dueCardsAt } from '../learning/dueCardsAt'
import type { HeldCard } from '../learning/HeldCard'
import { heldOutWordsAt } from '../learning/heldOutWordsAt'
import { isLessonPlacedOut } from '../learning/isLessonPlacedOut'
import type { Lesson, LessonId, SchoolLesson } from '../learning/Lesson'
import { readFirstOf } from '../learning/readFirstOf'
import { wordsEnteringOf } from '../learning/wordsEnteringOf'
import type { MemoryTerms } from '../memory/MemoryTerms'
import type { BandCatalog } from '../ports/BandCatalog'
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
  | ({ readonly kind: 'holdoutCheck' } & DueHoldoutCheck)
  | { readonly kind: 'lessonRunning'; readonly producer: ProducerBuilding | null }
  | {
      readonly kind: 'releasedLesson'
      readonly lessonId: LessonId
      readonly band: Band
      readonly position: number
    }
  | { readonly kind: 'lessonToStudy'; readonly lessonId: LessonId }
  | { readonly kind: 'caughtUp' }

export type NextStepReading = {
  readonly town: Town
  readonly at: Instant
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly bandStarts: ReadonlyArray<BandStart>
  readonly released: ReadonlyArray<ReleasedLesson>
  readonly placedOutBands: ReadonlyArray<Band>
}

export type NextStepTerms = {
  readonly lessons: ReadonlyArray<Lesson>
  readonly bands: Pick<BandCatalog, 'bandOfLesson'>
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

const isAdmitted = (
  lesson: SchoolLesson,
  heldOut: ReadonlyArray<Headword>,
  { town, lessonSlot, cards }: NextStepReading,
  catalog: TownCatalog,
): Result<boolean, DomainError> => {
  const admitted = admitSchoolLesson(
    lesson,
    wordsEnteringOf(lesson, heldOut).length,
    { held: cards, slot: lessonSlot },
    town.buildingLevels.school,
    catalog,
  )
  if (admitted.ok) {
    return ok(true)
  }
  return admitted.error.kind === 'UnknownTownBuildingLevel' ? admitted : ok(false)
}

const firstAdmittedOf = <Admissible extends SchoolLesson>(
  lessons: ReadonlyArray<Admissible>,
  reading: NextStepReading,
  catalog: TownCatalog,
): Result<Admissible | undefined, DomainError> => {
  const heldOut = heldOutWordsAt(reading.bandStarts, reading.at)
  for (const lesson of lessons) {
    const admitted = isAdmitted(lesson, heldOut, reading, catalog)
    if (!admitted.ok) {
      return admitted
    }
    if (admitted.value) {
      return ok(lesson)
    }
  }
  return ok(undefined)
}

const lessonStep = (
  reading: NextStepReading,
  { lessons, bands, catalog }: NextStepTerms,
): Result<NextStep, DomainError> => {
  const released = firstAdmittedOf(reading.released, reading, catalog)
  if (!released.ok) {
    return released
  }
  if (released.value !== undefined) {
    const { id, band, position } = released.value
    return ok({ kind: 'releasedLesson', lessonId: id, band, position })
  }
  const shelved = firstAdmittedOf(
    lessons.filter((lesson) => !isLessonPlacedOut(lesson, reading.placedOutBands, bands)),
    reading,
    catalog,
  )
  if (!shelved.ok) {
    return shelved
  }
  return ok(
    shelved.value === undefined
      ? { kind: 'caughtUp' }
      : { kind: 'lessonToStudy', lessonId: shelved.value.id },
  )
}

export const nextStepOf = (
  reading: NextStepReading,
  terms: NextStepTerms,
): Result<NextStep, DomainError> => {
  const { town, at, lessonSlot, cards, bandStarts } = reading
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
  const [dueCheck] = dueHoldoutChecksOf(bandStarts, at)
  if (dueCheck !== undefined) {
    return ok({ kind: 'holdoutCheck', ...dueCheck })
  }
  if (lessonSlot.kind === 'busy') {
    return ok(lessonRunningStep(lessonSlot, town, terms.lessons))
  }
  return lessonStep(reading, terms)
}
