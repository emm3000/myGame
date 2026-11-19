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
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { admitSchoolLesson } from './admitSchoolLesson'
import type { LessonSlot } from './LessonSlot'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type NextStep =
  | {
      readonly kind: 'reviews'
      readonly count: number
      readonly readFirst: ReadonlyArray<LessonId>
    }
  | ({ readonly kind: 'holdoutCheck' } & DueHoldoutCheck)
  | { readonly kind: 'lessonRunning' }
  | {
      readonly kind: 'releasedLesson'
      readonly lessonId: LessonId
      readonly band: Band
      readonly position: number
    }
  | { readonly kind: 'lessonToStudy'; readonly lessonId: LessonId }
  | { readonly kind: 'caughtUp'; readonly reason: CaughtUpReason }

export type CaughtUpReason = 'learningCap' | 'schoolTooLow' | 'lessonsDone'

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

type Weighing<Admissible extends SchoolLesson> =
  | { readonly kind: 'admitted'; readonly lesson: Admissible }
  | { readonly kind: 'refused'; readonly reason: CaughtUpReason }

const reasonOf = (refusal: DomainError): Result<CaughtUpReason | undefined, DomainError> => {
  switch (refusal.kind) {
    case 'LearningCapReached':
      return ok('learningCap')
    case 'LessonSchoolTooLow':
      return ok('schoolTooLow')
    case 'LessonAlreadyStudied':
      return ok(undefined)
    default:
      return err(refusal)
  }
}

const refusalReasonOf = (
  lesson: SchoolLesson,
  heldOut: ReadonlyArray<Headword>,
  { town, lessonSlot, cards }: NextStepReading,
  catalog: TownCatalog,
): Result<CaughtUpReason | undefined, DomainError> | undefined => {
  const admitted = admitSchoolLesson(
    lesson,
    wordsEnteringOf(lesson, heldOut).length,
    { held: cards, slot: lessonSlot },
    town.buildingLevels.school,
    catalog,
  )
  return admitted.ok ? undefined : reasonOf(admitted.error)
}

const weighed = <Admissible extends SchoolLesson>(
  lessons: ReadonlyArray<Admissible>,
  reading: NextStepReading,
  catalog: TownCatalog,
): Result<Weighing<Admissible>, DomainError> => {
  const heldOut = heldOutWordsAt(reading.bandStarts, reading.at)
  let firstReason: CaughtUpReason | undefined
  for (const lesson of lessons) {
    const reason = refusalReasonOf(lesson, heldOut, reading, catalog)
    if (reason === undefined) {
      return ok({ kind: 'admitted', lesson })
    }
    if (!reason.ok) {
      return reason
    }
    firstReason ??= reason.value
  }
  return ok({ kind: 'refused', reason: firstReason ?? 'lessonsDone' })
}

const lessonStep = (
  reading: NextStepReading,
  { lessons, bands, catalog }: NextStepTerms,
): Result<NextStep, DomainError> => {
  const released = weighed(reading.released, reading, catalog)
  if (!released.ok) {
    return released
  }
  if (released.value.kind === 'admitted') {
    const { id, band, position } = released.value.lesson
    return ok({ kind: 'releasedLesson', lessonId: id, band, position })
  }
  const shelved = weighed(
    lessons.filter((lesson) => !isLessonPlacedOut(lesson, reading.placedOutBands, bands)),
    reading,
    catalog,
  )
  if (!shelved.ok) {
    return shelved
  }
  if (shelved.value.kind === 'admitted') {
    return ok({ kind: 'lessonToStudy', lessonId: shelved.value.lesson.id })
  }
  const releasedReason = released.value.reason
  return ok({
    kind: 'caughtUp',
    reason: releasedReason === 'lessonsDone' ? shelved.value.reason : releasedReason,
  })
}

export const nextStepOf = (
  reading: NextStepReading,
  terms: NextStepTerms,
): Result<NextStep, DomainError> => {
  const { at, lessonSlot, cards, bandStarts } = reading
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
    return ok({ kind: 'lessonRunning' })
  }
  return lessonStep(reading, terms)
}
