import type { DomainError } from '../DomainError'
import { cardsInLearningOf } from '../learning/cardsInLearningOf'
import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import type { Lesson, LessonId } from '../learning/Lesson'
import type { PlayerId } from '../player/PlayerId'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { err, ok, type Result } from '../Result'
import { Duration } from '../time/Duration'
import type { Instant } from '../time/Instant'
import type { SchoolLevel } from './BuildingLevel'
import { deriveLessonDurationSeconds } from './deriveLessonDurationSeconds'
import type { BusyLessonSlot, LessonSlot } from './LessonSlot'
import type { LessonSlotRepository } from './LessonSlotRepository'
import { resolvedTownOf } from './resolvedTownOf'
import { saveLessonSlot } from './saveLessonSlot'
import { saveResolvedTown } from './saveResolvedTown'
import { schoolLevelOf } from './schoolLevelOf'
import { type SettledSchool, settledSchoolOf } from './settledSchoolOf'
import { studyPercentAt } from './studyPercentAt'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type StartSchoolLessonCommand = {
  readonly playerId: PlayerId
  readonly lessonId: LessonId
}

export type StartSchoolLessonDependencies = {
  readonly towns: TownRepository
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly lessons: Pick<LessonCatalog, 'lessonOf'>
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const admitToLearningCap = (
  lesson: Lesson,
  cards: ReadonlyArray<HeldCard>,
  school: SchoolLevel,
): Result<SchoolLevel, DomainError> => {
  const cardsInLearning = cardsInLearningOf(cards)
  const lessonWordCount = lesson.words.length
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

const admitSchoolLesson = (
  lesson: Lesson,
  cards: ReadonlyArray<HeldCard>,
  slot: LessonSlot,
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
  return admitToLearningCap(lesson, cards, school.value)
}

const lessonStartedAt = (
  lesson: Lesson,
  school: SchoolLevel,
  now: Instant,
  catalog: TownCatalog,
): Result<BusyLessonSlot, DomainError> => {
  const duration = Duration.ofSeconds(
    deriveLessonDurationSeconds(
      lesson.durationSeconds,
      school.lessonPercent,
      studyPercentAt(now, catalog.townSettings()),
    ),
  )
  if (!duration.ok) {
    return duration
  }
  return ok({
    kind: 'busy',
    lessonId: lesson.id,
    startedAt: now,
    finishesAt: now.plus(duration.value),
  })
}

type AdmittedLesson = {
  readonly lesson: Lesson
  readonly school: SchoolLevel
  readonly settled: SettledSchool
}

const admittedLessonOf = async (
  playerId: PlayerId,
  resolved: ChangedTown,
  lessonId: LessonId,
  dependencies: StartSchoolLessonDependencies,
  now: Instant,
): Promise<Result<AdmittedLesson, DomainError>> => {
  const lesson = dependencies.lessons.lessonOf(lessonId)
  if (lesson === undefined) {
    return err({ kind: 'LessonNotFound', lessonId })
  }
  const settled = await settledSchoolOf(playerId, resolved.town.id, dependencies, now)
  if (!settled.ok) {
    return settled
  }
  const { slot, held } = settled.value
  const school = admitSchoolLesson(
    lesson,
    held,
    slot,
    resolved.town.buildingLevels.school,
    dependencies.catalog,
  )
  if (!school.ok) {
    return school
  }
  return ok({ lesson, school: school.value, settled: settled.value })
}

const saveStartedLesson = async (
  playerId: PlayerId,
  resolved: ChangedTown,
  { entered, events }: SettledSchool,
  started: BusyLessonSlot,
  dependencies: StartSchoolLessonDependencies,
): Promise<Result<void, DomainError>> => {
  const saved = await saveResolvedTown(resolved, dependencies.towns, dependencies.news)
  if (!saved.ok) {
    return saved
  }
  return saveLessonSlot(
    playerId,
    resolved.town.id,
    { entered, slot: started, events },
    dependencies,
  )
}

export const startSchoolLesson = async (
  { playerId, lessonId }: StartSchoolLessonCommand,
  dependencies: StartSchoolLessonDependencies,
): Promise<Result<BusyLessonSlot, DomainError>> => {
  const { towns, catalog, clock } = dependencies
  const now = clock.now()
  const resolved = await resolvedTownOf(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const admitted = await admittedLessonOf(playerId, resolved.value, lessonId, dependencies, now)
  if (!admitted.ok) {
    return admitted
  }
  const { lesson, school, settled } = admitted.value
  const started = lessonStartedAt(lesson, school, now, catalog)
  if (!started.ok) {
    return started
  }
  const saved = await saveStartedLesson(
    playerId,
    resolved.value,
    settled,
    started.value,
    dependencies,
  )
  if (!saved.ok) {
    return saved
  }
  return started
}
