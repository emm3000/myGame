import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { ownFiefOf } from '../fief/ownFiefOf'
import { readFiefsInLockOrder } from '../fief/readFiefsInLockOrder'
import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import type { Lesson, LessonId } from '../learning/Lesson'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { err, ok, type Result } from '../Result'
import { durationPercentAt } from '../season/durationPercentAt'

export type StartLessonCommand = FiefOfPlayer & {
  readonly lessonId: LessonId
}

export type StartLessonDependencies = {
  readonly fiefs: Pick<FiefRepository, 'fiefsOf' | 'fiefOf' | 'save'>
  readonly cards: Pick<CardRepository, 'cardsOf'>
  readonly lessons: LessonCatalog
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const admitLesson = (
  lesson: Lesson,
  cards: ReadonlyArray<HeldCard>,
  fiefs: ReadonlyArray<Fief>,
): Result<Lesson, DomainError> => {
  if (holdsLessonCards(lesson, cards)) {
    return err({ kind: 'LessonAlreadyStudied', lessonId: lesson.id })
  }
  const isUnderStudy = fiefs.some(
    ({ studySlot }) => studySlot.kind === 'lesson' && studySlot.lessonId === lesson.id,
  )
  if (isUnderStudy) {
    return err({ kind: 'LessonUnderStudy', lessonId: lesson.id })
  }
  return ok(lesson)
}

export const startLesson = async (
  command: StartLessonCommand,
  { fiefs, cards, lessons, catalog, clock }: StartLessonDependencies,
): Promise<Result<Fief, DomainError>> => {
  const locked = await readFiefsInLockOrder(command.playerId, fiefs)
  if (!locked.ok) {
    return locked
  }
  const owned = ownFiefOf(
    locked.value.find(({ id }) => id === command.fiefId),
    command,
  )
  if (!owned.ok) {
    return owned
  }
  const lesson = lessons.lessonOf(command.lessonId)
  if (lesson === undefined) {
    return err({ kind: 'LessonNotFound', lessonId: command.lessonId })
  }
  const held = await cards.cardsOf(command.playerId)
  if (!held.ok) {
    return held
  }
  const admitted = admitLesson(lesson, held.value, locked.value)
  if (!admitted.ok) {
    return admitted
  }
  const now = clock.now()
  const studying = owned.value.startLesson(
    admitted.value,
    now,
    durationPercentAt(now, catalog.fiefSettings()).study,
  )
  if (!studying.ok) {
    return studying
  }
  const saved = await fiefs.save(studying.value)
  if (!saved.ok) {
    return saved
  }
  return ok(studying.value)
}
