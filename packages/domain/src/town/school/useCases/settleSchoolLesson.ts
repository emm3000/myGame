import type { DomainError } from '../../../DomainError'
import type { BandStartRepository } from '../../../holdout/ports/BandStartRepository'
import type { BandCatalog } from '../../../learning/curriculum/ports/BandCatalog'
import type { LessonCatalog } from '../../../learning/curriculum/ports/LessonCatalog'
import type { CardRepository } from '../../../learning/ports/CardRepository'
import type { PlayerId } from '../../../player/PlayerId'
import type { Clock } from '../../../ports/Clock'
import { ok, type Result } from '../../../Result'
import type { TownNews } from '../../ports/TownNews'
import type { TownRepository } from '../../ports/TownRepository'
import type { LessonSlotRepository } from '../ports/LessonSlotRepository'
import { readSettledSchool } from '../services/readSettledSchool'
import { saveLessonSlot } from '../services/saveLessonSlot'

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
