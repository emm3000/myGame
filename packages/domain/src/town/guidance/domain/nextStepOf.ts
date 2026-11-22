import type { DomainError } from '#DomainError'
import type { BandStart } from '#holdout/BandStart'
import { dueHoldoutChecksOf } from '#holdout/dueHoldoutChecksOf'
import { heldOutWordsAt } from '#holdout/heldOutWordsAt'
import type { ReleasedLesson } from '#holdout/ReleasedLesson'
import type { Band } from '#learning/curriculum/Band'
import type { Headword } from '#learning/curriculum/Headword'
import { isLessonPlacedOut } from '#learning/curriculum/isLessonPlacedOut'
import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import { wordsEnteringOf } from '#learning/curriculum/wordsEnteringOf'
import { openTextsOf } from '#learning/frames/openTextsOf'
import type { Text } from '#learning/frames/Text'
import type { HeldCard } from '#learning/HeldCard'
import type { Lesson } from '#learning/Lesson'
import { dueCardsAt } from '#learning/reviews/dueCardsAt'
import { readFirstOf } from '#learning/reviews/readFirstOf'
import type { MemoryTerms } from '#memory/domain/MemoryTerms'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import { admitSchoolLesson, type SchoolLessonRefusal } from '../../school/domain/admitSchoolLesson'
import type { LessonSlot } from '../../school/domain/LessonSlot'
import type { SchoolLesson } from '../../school/domain/SchoolLesson'
import type { CaughtUpReason, NextStep, NextStepText } from './NextStep'

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
  readonly texts: ReadonlyArray<Text>
  readonly bands: Pick<BandCatalog, 'bandOfLesson'>
  readonly memoryTerms: MemoryTerms
  readonly catalog: TownCatalog
}

type RefusalReason = Exclude<CaughtUpReason, 'lessonsDone'>

type Refusal = { readonly kind: 'refused'; readonly reason: RefusalReason }

type Studied = { readonly kind: 'studied' }

type Admission = { readonly kind: 'admitted' } | Studied | Refusal

type Unadmitted = Refusal | { readonly kind: 'noneRefused' }

type Weighing<Admissible extends SchoolLesson> =
  | { readonly kind: 'admitted'; readonly lesson: Admissible }
  | Unadmitted

const reasonOf = (refusal: SchoolLessonRefusal): Result<Refusal | Studied, SchoolLessonRefusal> => {
  switch (refusal.kind) {
    case 'LearningCapReached':
      return ok({ kind: 'refused', reason: 'learningCap' })
    case 'LessonSchoolTooLow':
      return ok({ kind: 'refused', reason: 'schoolTooLow' })
    case 'LessonAlreadyStudied':
      return ok({ kind: 'studied' })
    case 'UnknownTownBuildingLevel':
    case 'LessonUnderStudy':
    case 'StudySlotBusy':
      return err(refusal)
  }
}

const admissionOf = (
  lesson: SchoolLesson,
  heldOut: ReadonlyArray<Headword>,
  { town, lessonSlot, cards }: NextStepReading,
  catalog: TownCatalog,
): Result<Admission, DomainError> => {
  const admitted = admitSchoolLesson(
    lesson,
    wordsEnteringOf(lesson, heldOut).length,
    { held: cards, slot: lessonSlot },
    town.buildingLevels.school,
    catalog,
  )
  return admitted.ok ? ok({ kind: 'admitted' }) : reasonOf(admitted.error)
}

const weighed = <Admissible extends SchoolLesson>(
  lessons: ReadonlyArray<Admissible>,
  reading: NextStepReading,
  catalog: TownCatalog,
): Result<Weighing<Admissible>, DomainError> => {
  const heldOut = heldOutWordsAt(reading.bandStarts, reading.at)
  let unadmitted: Unadmitted = { kind: 'noneRefused' }
  for (const lesson of lessons) {
    const admission = admissionOf(lesson, heldOut, reading, catalog)
    if (!admission.ok) {
      return admission
    }
    if (admission.value.kind === 'admitted') {
      return ok({ kind: 'admitted', lesson })
    }
    if (admission.value.kind === 'refused' && unadmitted.kind === 'noneRefused') {
      unadmitted = admission.value
    }
  }
  return ok(unadmitted)
}

const caughtUpReasonOf = (released: Unadmitted, shelved: Unadmitted): CaughtUpReason => {
  if (released.kind === 'refused') {
    return released.reason
  }
  if (shelved.kind === 'refused') {
    return shelved.reason
  }
  return 'lessonsDone'
}

const newestTextOf = (
  { cards, placedOutBands }: NextStepReading,
  { lessons, texts, bands }: NextStepTerms,
): NextStepText | null => {
  const [newest] = openTextsOf(texts, { curriculum: lessons, cards, placedOutBands, bands })
  return newest === undefined ? null : { id: newest.id, title: newest.title }
}

const lessonStep = (
  reading: NextStepReading,
  terms: NextStepTerms,
): Result<NextStep, DomainError> => {
  const { lessons, bands, catalog } = terms
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
  return ok({
    kind: 'caughtUp',
    reason: caughtUpReasonOf(released.value, shelved.value),
    text: newestTextOf(reading, terms),
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
    return ok({ kind: 'lessonRunning', text: newestTextOf(reading, terms) })
  }
  return lessonStep(reading, terms)
}
