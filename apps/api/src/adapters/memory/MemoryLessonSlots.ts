import { type DomainError, ok, type Result } from '@mygame/domain'
import {
  idleLessonSlot,
  type LessonSlot,
  type LessonSlotRepository,
  type TownId,
} from '@mygame/domain/town'

export class MemoryLessonSlots implements LessonSlotRepository {
  private readonly slots = new Map<TownId, LessonSlot>()

  async lessonSlotOf(townId: TownId): Promise<Result<LessonSlot, DomainError>> {
    return ok(this.slots.get(townId) ?? idleLessonSlot)
  }

  async save(townId: TownId, slot: LessonSlot): Promise<Result<void, DomainError>> {
    this.slots.set(townId, slot)
    return ok(undefined)
  }
}
