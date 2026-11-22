import type { DomainError } from '#DomainError'
import type { BandStartRepository } from '#holdout/domain/BandStartRepository'
import type { BandCatalog } from '#learning/curriculum/domain/BandCatalog'
import type { LessonCatalog } from '#learning/curriculum/domain/LessonCatalog'
import type { CardRepository } from '#learning/domain/CardRepository'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { TownNews } from '../../domain/TownNews'
import type { TownRepository } from '../../domain/TownRepository'
import type { LessonSlotRepository } from '../domain/LessonSlotRepository'
import { readSettledSchool } from './readSettledSchool'
import { saveLessonSlot } from './saveLessonSlot'

export type SettleSchoolLessonDependencies = {
  readonly towns: TownRepository
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'>
  readonly bands: Pick<BandCatalog, 'wordsOfBand'>
  readonly news: TownNews
  readonly clock: Clock
}

export const settleSchoolLesson = async (
  playerId: PlayerId,
  dependencies: SettleSchoolLessonDependencies,
): Promise<Result<void, DomainError>> => {
  const town = await dependencies.towns.townOf(playerId)
  if (!town.ok) {
    return town
  }
  if (town.value === undefined) {
    return ok(undefined)
  }
  const settled = await readSettledSchool(
    playerId,
    town.value.id,
    dependencies,
    dependencies.clock.now(),
  )
  if (!settled.ok) {
    return settled
  }
  if (settled.value.slot.kind === settled.value.stored.kind) {
    return ok(undefined)
  }
  return saveLessonSlot(playerId, town.value.id, settled.value, dependencies)
}
