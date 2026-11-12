import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { BandCatalog } from '../ports/BandCatalog'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { ok, type Result } from '../Result'
import type { LessonSlotRepository } from './LessonSlotRepository'
import { saveLessonSlot } from './saveLessonSlot'
import { settledSchoolOf } from './settledSchoolOf'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

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
  const settled = await settledSchoolOf(
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
