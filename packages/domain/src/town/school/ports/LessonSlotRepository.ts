import type { DomainError } from '#DomainError'
import type { Result } from '#Result'
import type { TownId } from '../../domain/TownId'
import type { LessonSlot } from '../LessonSlot'

export interface LessonSlotRepository {
  lessonSlotOf(townId: TownId): Promise<Result<LessonSlot, DomainError>>
  save(townId: TownId, slot: LessonSlot): Promise<Result<void, DomainError>>
}
