import {
  Instant,
  idleLessonSlot,
  type LessonSlot,
  type LessonSlotRepository,
  Town,
  TownAddress,
  TownName,
  type TownReader,
  type TownRepository,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

export type TownReaderArrangement = {
  readonly reader: TownReader
  readonly towns: TownRepository
  readonly lessonSlots: LessonSlotRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<string>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const anasTown = (): Town => {
  const address = TownAddress.create(1, 1, 1)
  const name = TownName.create('Maple Falls')
  assert(address.ok && name.ok)
  return Town.found({
    id: '00000000-0000-4000-8000-00000000000a',
    playerId: ana,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: instantAt('2026-11-10T08:00:00Z'),
  })
}

const lessonOneUnderStudy: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: instantAt('2026-11-10T08:55:00Z'),
  finishesAt: instantAt('2026-11-10T09:00:00Z'),
}

export const townReaderContract = (
  adapterName: string,
  arrange: () => Promise<TownReaderArrangement>,
): void => {
  describe(`${adapterName} as a TownReader`, () => {
    it('answers no town for a player who holds none', async () => {
      const { reader, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await reader.townWithSchoolOf(ana)).toEqual({ ok: true, value: undefined })
    })

    it('reads the saved town with the lesson slot saved for it', async () => {
      const { reader, towns, lessonSlots, registerPlayers } = await arrange()
      await registerPlayers([ana])
      const town = anasTown()
      assert((await towns.save(town)).ok)
      assert((await lessonSlots.save(town.id, lessonOneUnderStudy)).ok)

      const read = await reader.townWithSchoolOf(ana)

      assert(read.ok && read.value !== undefined)
      expect([read.value.town.id, read.value.lessonSlot]).toEqual([town.id, lessonOneUnderStudy])
    })

    it('reads an idle school, no card and no band start for a town just founded', async () => {
      const { reader, towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      assert((await towns.save(anasTown())).ok)

      const read = await reader.townWithSchoolOf(ana)

      assert(read.ok && read.value !== undefined)
      expect([read.value.lessonSlot, read.value.cards, read.value.bandStarts]).toEqual([
        idleLessonSlot,
        [],
        [],
      ])
    })
  })
}
