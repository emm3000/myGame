import {
  type DomainError,
  idleLessonSlot,
  type LessonSlot,
  type LessonSlotRepository,
  ok,
  type Result,
  type TownId,
} from '@mygame/domain'

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
