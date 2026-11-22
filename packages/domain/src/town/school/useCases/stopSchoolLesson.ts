import type { DomainError } from '#DomainError'
import type { BandStartRepository } from '#holdout/ports/BandStartRepository'
import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import type { LessonId } from '#learning/Lesson'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { err, type Result } from '#Result'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveResolvedTown } from '../../application/saveResolvedTown'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownNews } from '../../domain/TownNews'
import type { TownRepository } from '../../domain/TownRepository'
import { idleLessonSlot } from '../LessonSlot'
import type { LessonSlotRepository } from '../ports/LessonSlotRepository'
import { readSettledSchool } from '../services/readSettledSchool'
import { saveLessonSlot } from '../services/saveLessonSlot'

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
  const resolved = await resolveStoredTown(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const { town } = resolved.value
  const settled = await readSettledSchool(playerId, town.id, dependencies, now)
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
