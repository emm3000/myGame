import {
  type CleanUp,
  type CleanUpRepository,
  Instant,
  type PlayerId,
  Town,
  TownAddress,
  TownName,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const at = (time: string): Instant =>
  Instant.fromEpochMilliseconds(Date.parse(`2026-11-11T${time}Z`))

const townAt = (id: string, playerId: PlayerId, name: string, site: number): Town => {
  const address = TownAddress.create(1, 1, site)
  const townName = TownName.create(name)
  assert(address.ok && townName.ok)
  return Town.found({
    id,
    playerId,
    name: townName.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: at('07:00:00'),
  })
}

const mapleFalls = townAt('00000000-0000-4000-8000-00000000000a', ana, 'Maple Falls', 1)
const cedarBend = townAt('00000000-0000-4000-8000-00000000000b', bruno, 'Cedar Bend', 2)

const wasteSite = { region: 1, area: 2, site: 4 }

const otherWasteSite = { region: 1, area: 2, site: 5 }

const cleanUpOf = (town: Town, sentAt: string, cleanedAt: string, site = wasteSite): CleanUp => ({
  townId: town.id,
  sentAt: at(sentAt),
  site,
  cleanedAt: at(cleanedAt),
})

const firstCleanUp = cleanUpOf(mapleFalls, '08:00:00', '08:10:00')

const laterCleanUp = cleanUpOf(cedarBend, '09:00:00', '09:20:00')

const recordAll = async (
  cleanUps: CleanUpRepository,
  recorded: ReadonlyArray<CleanUp>,
): Promise<void> => {
  for (const cleanUp of recorded) {
    assert((await cleanUps.record(cleanUp)).ok)
  }
}

export const cleanUpRepositoryContract = (
  adapterName: string,
  arrange: (heldTowns: ReadonlyArray<Town>) => Promise<CleanUpRepository>,
): void => {
  describe(`${adapterName} as a CleanUpRepository`, () => {
    it('answers no clean-up for a site never cleaned', async () => {
      const cleanUps = await arrange([mapleFalls])

      expect(await cleanUps.lastCleanedAt(wasteSite, at('12:00:00'))).toBeUndefined()
    })

    it('answers the latest clean-up of the site at or before the instant', async () => {
      const cleanUps = await arrange([mapleFalls, cedarBend])
      await recordAll(cleanUps, [laterCleanUp, firstCleanUp])

      expect([
        await cleanUps.lastCleanedAt(wasteSite, at('09:19:59')),
        await cleanUps.lastCleanedAt(wasteSite, at('09:20:00')),
      ]).toEqual([at('08:10:00'), at('09:20:00')])
    })

    it('answers no clean-up whose team has not reached the site yet', async () => {
      const cleanUps = await arrange([mapleFalls])
      await recordAll(cleanUps, [firstCleanUp])

      expect(await cleanUps.lastCleanedAt(wasteSite, at('08:09:59'))).toBeUndefined()
    })

    it('keeps the clean-ups of other sites apart', async () => {
      const cleanUps = await arrange([mapleFalls, cedarBend])
      await recordAll(cleanUps, [
        firstCleanUp,
        cleanUpOf(cedarBend, '08:30:00', '08:40:00', otherWasteSite),
      ])

      expect(await cleanUps.lastCleanedAt(wasteSite, at('12:00:00'))).toEqual(at('08:10:00'))
    })

    it('answers the latest clean-up of each site of an area at or before the instant', async () => {
      const cleanUps = await arrange([mapleFalls, cedarBend])
      await recordAll(cleanUps, [
        firstCleanUp,
        laterCleanUp,
        cleanUpOf(cedarBend, '08:30:00', '08:40:00', otherWasteSite),
        cleanUpOf(mapleFalls, '08:30:00', '08:45:00', { region: 1, area: 3, site: 4 }),
      ])

      expect(await cleanUps.lastCleanedAtIn(1, 2, at('09:00:00'))).toEqual(
        new Map([
          [4, at('08:10:00')],
          [5, at('08:40:00')],
        ]),
      )
    })

    it("cancels one team's clean-up and keeps the others", async () => {
      const cleanUps = await arrange([mapleFalls, cedarBend])
      await recordAll(cleanUps, [firstCleanUp, laterCleanUp])

      assert((await cleanUps.cancel(cedarBend.id, at('09:00:00'))).ok)

      expect(await cleanUps.lastCleanedAt(wasteSite, at('12:00:00'))).toEqual(at('08:10:00'))
    })

    it('cancels nothing for a team that recorded no clean-up', async () => {
      const cleanUps = await arrange([mapleFalls])
      await recordAll(cleanUps, [firstCleanUp])

      assert((await cleanUps.cancel(mapleFalls.id, at('10:00:00'))).ok)

      expect(await cleanUps.lastCleanedAt(wasteSite, at('12:00:00'))).toEqual(at('08:10:00'))
    })
  })
}
