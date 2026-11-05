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
import type { StudyPercents } from './StudyPercents'
import { schoolLevelOf } from './schoolLevelOf'
import { type SettledLessonSlot, settledLessonSlot } from './settledLessonSlot'
import { studyPercentAt } from './studyPercentAt'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownId } from './TownId'
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
  readonly studyPercents: StudyPercents
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
  if (schoolLevel < lesson.requiredLibraryLevel) {
    return err({
      kind: 'LessonLibraryTooLow',
      requiredLibraryLevel: lesson.requiredLibraryLevel,
      libraryLevel: schoolLevel,
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
  studyPercents: StudyPercents,
): Result<BusyLessonSlot, DomainError> => {
  const duration = Duration.ofSeconds(
    deriveLessonDurationSeconds(
      lesson.durationSeconds,
      school.lessonPercent,
      studyPercentAt(now, catalog.townSettings(), studyPercents),
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

const saveStartedLesson = async (
  playerId: PlayerId,
  townId: TownId,
  settled: SettledLessonSlot,
  started: BusyLessonSlot,
  { cards, lessonSlots, news }: StartSchoolLessonDependencies,
): Promise<Result<void, DomainError>> => {
  for (const card of settled.entered) {
    const saved = await cards.save(playerId, card)
    if (!saved.ok) {
      return saved
    }
  }
  const saved = await lessonSlots.save(townId, started)
  if (!saved.ok || settled.events.length === 0) {
    return saved
  }
  return news.record(townId, settled.events)
}

type AdmittedLesson = {
  readonly lesson: Lesson
  readonly school: SchoolLevel
  readonly settled: SettledLessonSlot
}

const admittedLessonOf = async (
  playerId: PlayerId,
  town: Town,
  lessonId: LessonId,
  { lessonSlots, cards, lessons, catalog }: StartSchoolLessonDependencies,
  now: Instant,
): Promise<Result<AdmittedLesson, DomainError>> => {
  const lesson = lessons.lessonOf(lessonId)
  if (lesson === undefined) {
    return err({ kind: 'LessonNotFound', lessonId })
  }
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const stored = await lessonSlots.lessonSlotOf(town.id)
  if (!stored.ok) {
    return stored
  }
  const settled = settledLessonSlot(stored.value, held.value, lessons, now)
  if (!settled.ok) {
    return settled
  }
  const { slot, entered } = settled.value
  const cardsAfterFinish = [...held.value, ...entered]
  const school = admitSchoolLesson(
    lesson,
    cardsAfterFinish,
    slot,
    town.buildingLevels.school,
    catalog,
  )
  if (!school.ok) {
    return school
  }
  return ok({ lesson, school: school.value, settled: settled.value })
}

export const startSchoolLesson = async (
  { playerId, lessonId }: StartSchoolLessonCommand,
  dependencies: StartSchoolLessonDependencies,
): Promise<Result<BusyLessonSlot, DomainError>> => {
  const { towns, catalog, studyPercents, clock } = dependencies
  const now = clock.now()
  const resolved = await resolvedTownOf(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const { town } = resolved.value
  const admitted = await admittedLessonOf(playerId, town, lessonId, dependencies, now)
  if (!admitted.ok) {
    return admitted
  }
  const { lesson, school, settled } = admitted.value
  const started = lessonStartedAt(lesson, school, now, catalog, studyPercents)
  if (!started.ok) {
    return started
  }
  const saved = await saveStartedLesson(playerId, town.id, settled, started.value, dependencies)
  if (!saved.ok) {
    return saved
  }
  return started
}
