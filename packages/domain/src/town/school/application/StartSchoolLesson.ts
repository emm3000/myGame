import type { DomainError } from '#DomainError'
import type { BandStart } from '#holdout/domain/BandStart'
import type { BandStartRepository } from '#holdout/domain/BandStartRepository'
import { bandStartDrawn } from '#holdout/domain/bandStartDrawn'
import { heldOutWordsAt } from '#holdout/domain/heldOutWordsAt'
import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import { practisedWordsOf } from '#learning/curriculum/practisedWordsOf'
import { wordsEnteringOf } from '#learning/curriculum/wordsEnteringOf'
import type { LessonId } from '#learning/Lesson'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { PlacementRepository } from '#placement/domain/PlacementRepository'
import { placedOutBandsOf } from '#placement/domain/placedOutBandsOf'
import { placementScoresOf } from '#placement/domain/placementScoresOf'
import type { Clock } from '#platform/domain/Clock'
import type { RandomSource } from '#platform/domain/RandomSource'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import { Duration } from '#time/Duration'
import type { Instant } from '#time/Instant'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveResolvedTown } from '../../application/saveResolvedTown'
import type { ChangedTown } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownNews } from '../../domain/TownNews'
import type { TownReading } from '../../domain/TownReading'
import type { TownRepository } from '../../domain/TownRepository'
import { admitSchoolLesson } from '../domain/admitSchoolLesson'
import type { BusyLessonSlot } from '../domain/LessonSlot'
import type { LessonSlotRepository } from '../domain/LessonSlotRepository'
import { lessonDurationSecondsAt } from '../domain/lessonDurationSecondsAt'
import type { SchoolLesson } from '../domain/SchoolLesson'
import type { SchoolLevel } from '../domain/SchoolLevel'
import { schoolLessonsOf } from '../domain/schoolLessonsOf'
import { readSettledSchool, type SettledSchool } from './readSettledSchool'
import { saveLessonSlot } from './saveLessonSlot'

export type StartSchoolLessonCommand = {
  readonly playerId: PlayerId
  readonly lessonId: LessonId
}

export type StartSchoolLessonDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
  readonly random: RandomSource
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'> &
    Pick<BandCatalog, 'bandOfLesson' | 'wordsOfBand'>
}

type StartLessonPorts = {
  readonly towns: TownRepository
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly bandStarts: BandStartRepository
  readonly bands: Pick<BandCatalog, 'bandOfLesson' | 'wordsOfBand'>
  readonly placements: Pick<PlacementRepository, 'placementOf'>
  readonly random: RandomSource
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'>
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const lessonStartedAt = (
  lesson: SchoolLesson,
  school: SchoolLevel,
  now: Instant,
  catalog: TownCatalog,
): Result<BusyLessonSlot, DomainError> => {
  const duration = Duration.ofSeconds(
    lessonDurationSecondsAt(lesson, school, now, catalog.townSettings()),
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
  readonly lesson: SchoolLesson
  readonly school: SchoolLevel
  readonly settled: SettledSchool
  readonly drawn: BandStart | undefined
}

const readDrawnBandStart = async (
  playerId: PlayerId,
  lesson: SchoolLesson,
  { bandStarts: started, held }: SettledSchool,
  { bands, placements, random, lessons }: StartLessonPorts,
  now: Instant,
): Promise<Result<BandStart | undefined, DomainError>> => {
  const band = bands.bandOfLesson(lesson.id)
  if (band === undefined || started.some((start) => start.band === band)) {
    return ok(undefined)
  }
  const placement = await placements.placementOf(playerId)
  if (!placement.ok) {
    return placement
  }
  if (placedOutBandsOf(placementScoresOf(placement.value)).includes(band)) {
    return ok(undefined)
  }
  return ok(
    bandStartDrawn(band, bands.wordsOfBand(band), practisedWordsOf(held, lessons), now, random),
  )
}

const admitLesson = async (
  playerId: PlayerId,
  resolved: ChangedTown,
  lessonId: LessonId,
  dependencies: StartLessonPorts,
  now: Instant,
): Promise<Result<AdmittedLesson, DomainError>> => {
  const settled = await readSettledSchool(playerId, resolved.town.id, dependencies, now)
  if (!settled.ok) {
    return settled
  }
  const { bandStarts, released } = settled.value
  const lesson = schoolLessonsOf(dependencies.lessons, released).lessonOf(lessonId)
  if (lesson === undefined) {
    return err({ kind: 'LessonNotFound', lessonId })
  }
  const drawn = await readDrawnBandStart(playerId, lesson, settled.value, dependencies, now)
  if (!drawn.ok) {
    return drawn
  }
  const heldOut = heldOutWordsAt(
    drawn.value === undefined ? bandStarts : [...bandStarts, drawn.value],
    now,
  )
  const school = admitSchoolLesson(
    lesson,
    wordsEnteringOf(lesson, heldOut).length,
    settled.value,
    resolved.town.buildingLevels.school,
    dependencies.catalog,
  )
  if (!school.ok) {
    return school
  }
  return ok({ lesson, school: school.value, settled: settled.value, drawn: drawn.value })
}

const saveStartedLesson = async (
  playerId: PlayerId,
  resolved: ChangedTown,
  { settled: { entered, events }, drawn }: AdmittedLesson,
  started: BusyLessonSlot,
  dependencies: StartLessonPorts,
): Promise<Result<void, DomainError>> => {
  const saved = await saveResolvedTown(resolved, dependencies.towns, dependencies.news)
  if (!saved.ok) {
    return saved
  }
  if (drawn !== undefined) {
    const stored = await dependencies.bandStarts.save(playerId, drawn)
    if (!stored.ok) {
      return stored
    }
  }
  return saveLessonSlot(
    playerId,
    resolved.town.id,
    { entered, slot: started, events },
    dependencies,
  )
}

const startLessonIn = async (
  { playerId, lessonId }: StartSchoolLessonCommand,
  dependencies: StartLessonPorts,
): Promise<Result<BusyLessonSlot, DomainError>> => {
  const { towns, catalog, clock } = dependencies
  const now = clock.now()
  const resolved = await resolveStoredTown(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const admitted = await admitLesson(playerId, resolved.value, lessonId, dependencies, now)
  if (!admitted.ok) {
    return admitted
  }
  const { lesson, school } = admitted.value
  const started = lessonStartedAt(lesson, school, now, catalog)
  if (!started.ok) {
    return started
  }
  const saved = await saveStartedLesson(
    playerId,
    resolved.value,
    admitted.value,
    started.value,
    dependencies,
  )
  if (!saved.ok) {
    return saved
  }
  return started
}

export class StartSchoolLesson {
  constructor(private readonly dependencies: StartSchoolLessonDependencies) {}

  async execute(command: StartSchoolLessonCommand): Promise<Result<TownReading, DomainError>> {
    const { lessons, random, townCatalog } = this.dependencies
    return changeTown(
      command.playerId,
      async (stores, clock) => {
        const slot = await startLessonIn(command, {
          ...stores,
          news: stores.townNews,
          lessons,
          bands: lessons,
          random,
          catalog: townCatalog,
          clock,
        })
        return slot.ok ? ok(clock.now()) : slot
      },
      this.dependencies,
    )
  }
}
