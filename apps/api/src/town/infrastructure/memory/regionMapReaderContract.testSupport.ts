import {
  Instant,
  type PlayerId,
  type RegionMapReader,
  Town,
  TownAddress,
  TownName,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'
const carla = '00000000-0000-4000-8000-000000000003'
const dario = '00000000-0000-4000-8000-000000000004'

const townAt = (
  id: string,
  playerId: PlayerId,
  name: string,
  [region, area, site]: readonly [number, number, number],
): Town => {
  const address = TownAddress.create(region, area, site)
  const townName = TownName.create(name)
  assert(address.ok && townName.ok)
  return Town.found({
    id,
    playerId,
    name: townName.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z')),
  })
}

const mapleFalls = townAt('00000000-0000-4000-8000-00000000000a', ana, 'Maple Falls', [1, 2, 9])
const cedarBend = townAt('00000000-0000-4000-8000-00000000000b', bruno, 'Cedar Bend', [1, 2, 3])
const pineHollow = townAt('00000000-0000-4000-8000-00000000000c', carla, 'Pine Hollow', [1, 5, 1])
const oakRidge = townAt('00000000-0000-4000-8000-00000000000d', dario, 'Oak Ridge', [2, 8, 4])

const regionTowns = [mapleFalls, cedarBend, pineHollow, oakRidge]

export const regionMapContract = (
  adapterName: string,
  arrange: (heldTowns: ReadonlyArray<Town>) => Promise<RegionMapReader>,
): void => {
  describe(`${adapterName} as a RegionMapReader`, () => {
    it("answers the site of a player's town", async () => {
      const map = await arrange(regionTowns)

      expect(await map.addressOf(ana)).toEqual({ region: 1, area: 2, site: 9 })
    })

    it('answers no site for a player who holds no town', async () => {
      const map = await arrange([cedarBend])

      expect(await map.addressOf(ana)).toBeUndefined()
    })

    it('answers the highest area of the region that holds a town', async () => {
      const map = await arrange(regionTowns)

      expect(await map.lastAreaHoldingTown(1)).toBe(5)
    })

    it('answers area 0 for a region that holds no town', async () => {
      const map = await arrange(regionTowns)

      expect(await map.lastAreaHoldingTown(3)).toBe(0)
    })

    it('lists the towns of one area of the region by site, with name and player', async () => {
      const map = await arrange(regionTowns)

      expect(await map.townsIn(1, 2)).toEqual([
        { site: 3, name: 'Cedar Bend', playerId: bruno },
        { site: 9, name: 'Maple Falls', playerId: ana },
      ])
    })

    it('lists no town for an area of another region', async () => {
      const map = await arrange(regionTowns)

      expect(await map.townsIn(2, 2)).toEqual([])
    })
  })
}
