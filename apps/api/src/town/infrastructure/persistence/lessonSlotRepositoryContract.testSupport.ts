import {
  type BusyLessonSlot,
  Instant,
  idleLessonSlot,
  type LessonSlotRepository,
  type TownId,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type LessonSlotRepositoryFixture = {
  readonly lessonSlots: LessonSlotRepository
  readonly registerTowns: (townIds: ReadonlyArray<TownId>) => Promise<void>
}

const mapleFalls = '00000000-0000-4000-8000-00000000000a'
const cedarCreek = '00000000-0000-4000-8000-00000000000b'

const startedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:57:30Z'))

const lessonUnderStudy = (lessonId: string): BusyLessonSlot => ({
  kind: 'busy',
  lessonId,
  startedAt,
  finishesAt: Instant.fromEpochMilliseconds(startedAt.epochMilliseconds + 150_000),
})

export const lessonSlotRepositoryContract = (
  adapterName: string,
  arrange: () => Promise<LessonSlotRepositoryFixture>,
): void => {
  describe(`${adapterName} as a LessonSlotRepository`, () => {
    it('answers an idle slot for a town that never studied', async () => {
      const { lessonSlots, registerTowns } = await arrange()
      await registerTowns([mapleFalls])

      expect(await lessonSlots.lessonSlotOf(mapleFalls)).toEqual({
        ok: true,
        value: idleLessonSlot,
      })
    })

    it('reads back the lesson under study with its start and finish', async () => {
      const { lessonSlots, registerTowns } = await arrange()
      await registerTowns([mapleFalls])

      await lessonSlots.save(mapleFalls, lessonUnderStudy('lesson-1'))

      expect(await lessonSlots.lessonSlotOf(mapleFalls)).toEqual({
        ok: true,
        value: lessonUnderStudy('lesson-1'),
      })
    })

    it('reads an idle slot after the lesson leaves it', async () => {
      const { lessonSlots, registerTowns } = await arrange()
      await registerTowns([mapleFalls])
      await lessonSlots.save(mapleFalls, lessonUnderStudy('lesson-1'))

      await lessonSlots.save(mapleFalls, idleLessonSlot)

      expect(await lessonSlots.lessonSlotOf(mapleFalls)).toEqual({
        ok: true,
        value: idleLessonSlot,
      })
    })

    it('replaces the lesson under study with the next one', async () => {
      const { lessonSlots, registerTowns } = await arrange()
      await registerTowns([mapleFalls])
      await lessonSlots.save(mapleFalls, lessonUnderStudy('lesson-1'))

      await lessonSlots.save(mapleFalls, lessonUnderStudy('lesson-2'))

      expect(await lessonSlots.lessonSlotOf(mapleFalls)).toEqual({
        ok: true,
        value: lessonUnderStudy('lesson-2'),
      })
    })

    it('keeps the slot of one town from another', async () => {
      const { lessonSlots, registerTowns } = await arrange()
      await registerTowns([mapleFalls, cedarCreek])

      await lessonSlots.save(mapleFalls, lessonUnderStudy('lesson-1'))

      expect(await lessonSlots.lessonSlotOf(cedarCreek)).toEqual({
        ok: true,
        value: idleLessonSlot,
      })
    })
  })
}
