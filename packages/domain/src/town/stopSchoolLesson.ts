import type { DomainError } from '../DomainError'
import type { LessonId } from '../learning/Lesson'
import type { PlayerId } from '../player/PlayerId'
import type { BandCatalog } from '../ports/BandCatalog'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { err, type Result } from '../Result'
import { idleLessonSlot } from './LessonSlot'
import type { LessonSlotRepository } from './LessonSlotRepository'
import { resolvedTownOf } from './resolvedTownOf'
import { saveLessonSlot } from './saveLessonSlot'
import { saveResolvedTown } from './saveResolvedTown'
import { settledSchoolOf } from './settledSchoolOf'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type StopSchoolLessonCommand = {
  readonly playerId: PlayerId
  readonly lessonId: LessonId
}

export type StopSchoolLessonDependencies = {
  readonly towns: TownRepository
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'>
  readonly bands: Pick<BandCatalog, 'wordsOfBand'>
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const stopSchoolLesson = async (
  { playerId, lessonId }: StopSchoolLessonCommand,
  dependencies: StopSchoolLessonDependencies,
): Promise<Result<void, DomainError>> => {
  const { towns, news, catalog, clock } = dependencies
  const now = clock.now()
  const resolved = await resolvedTownOf(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const { town } = resolved.value
  const settled = await settledSchoolOf(playerId, town.id, dependencies, now)
  if (!settled.ok) {
    return settled
  }
  const { slot, entered, events } = settled.value
  if (slot.kind === 'idle' || slot.lessonId !== lessonId) {
    return err({ kind: 'LessonStudyNotFound', lessonId })
  }
  const saved = await saveResolvedTown(resolved.value, towns, news)
  if (!saved.ok) {
    return saved
  }
  return saveLessonSlot(
    playerId,
    town.id,
    {
      entered,
      slot: idleLessonSlot,
      events: [...events, { kind: 'lessonStopped', lessonId, occurredAt: now }],
    },
    dependencies,
  )
}
