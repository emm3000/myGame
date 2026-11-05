import { ok } from '../Result'
import { idleLessonSlot, type LessonSlot } from '../town/LessonSlot'
import type { LessonSlotRepository } from '../town/LessonSlotRepository'
import type { TownId } from '../town/TownId'

export type StoredLessonSlot = {
  readonly townId: TownId
  readonly slot: LessonSlot
}

export const inMemoryLessonSlots = (
  existing: ReadonlyArray<StoredLessonSlot>,
): LessonSlotRepository => {
  const slots = new Map(existing.map(({ townId, slot }) => [townId, slot]))
  return {
    lessonSlotOf: async (townId) => ok(slots.get(townId) ?? idleLessonSlot),
    save: async (townId, slot) => {
      slots.set(townId, slot)
      return ok(undefined)
    },
  }
}
