import { type CampBattle, type CampRegistry, Instant, ok } from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type CampRegistryFixture = {
  readonly camps: CampRegistry
}

const camp = { kingdom: 1, province: 3, plot: 7 }

const battleOn = (
  address: { readonly province: number; readonly plot: number },
  strength: number,
  foughtAt: string,
): CampBattle => ({
  kingdom: 1,
  ...address,
  strength,
  foughtAt: Instant.fromEpochMilliseconds(Date.parse(foughtAt)),
})

const recordAll = async (
  camps: CampRegistry,
  battles: ReadonlyArray<CampBattle>,
): Promise<void> => {
  for (const battle of battles) {
    expect(await camps.record(battle)).toEqual(ok(undefined))
  }
}

export const campRegistryContract = (
  adapter: string,
  arrange: () => Promise<CampRegistryFixture>,
): void => {
  describe(`${adapter} as a CampRegistry`, () => {
    it('reads no battle for a camp never fought', async () => {
      const { camps } = await arrange()
      await recordAll(camps, [battleOn({ province: 3, plot: 8 }, 2, '2026-09-22T09:00:00Z')])

      expect(await camps.lastBattleOf(camp)).toBeUndefined()
    })

    it('reads the latest battle of a camp', async () => {
      const { camps } = await arrange()
      const latest = battleOn(camp, 1, '2026-09-22T11:00:00Z')

      await recordAll(camps, [battleOn(camp, 4, '2026-09-22T09:00:00Z'), latest])

      expect(await camps.lastBattleOf(camp)).toEqual(latest)
    })

    it('reads the last arrival when battles are recorded out of order', async () => {
      const { camps } = await arrange()
      const lastArrival = battleOn(camp, 0, '2026-09-22T11:00:00Z')

      await recordAll(camps, [lastArrival, battleOn(camp, 5, '2026-09-22T10:00:00Z')])

      expect(await camps.lastBattleOf(camp)).toEqual(lastArrival)
    })

    it('reads the latest record when two battles tie', async () => {
      const { camps } = await arrange()
      const latestRecord = battleOn(camp, 2, '2026-09-22T11:00:00Z')

      await recordAll(camps, [battleOn(camp, 5, '2026-09-22T11:00:00Z'), latestRecord])

      expect(await camps.lastBattleOf(camp)).toEqual(latestRecord)
    })

    it('answers one battle per camp of a province', async () => {
      const { camps } = await arrange()
      const lastOnSeven = battleOn(camp, 3, '2026-09-22T10:00:00Z')
      const lastOnTwelve = battleOn({ province: 3, plot: 12 }, 9, '2026-09-22T08:00:00Z')

      await recordAll(camps, [
        lastOnTwelve,
        battleOn(camp, 6, '2026-09-22T09:00:00Z'),
        lastOnSeven,
        battleOn({ province: 4, plot: 7 }, 1, '2026-09-22T12:00:00Z'),
        { ...battleOn(camp, 0, '2026-09-22T12:00:00Z'), kingdom: 2 },
      ])

      expect(await camps.lastBattlesIn(1, 3)).toEqual([lastOnSeven, lastOnTwelve])
    })
  })
}
