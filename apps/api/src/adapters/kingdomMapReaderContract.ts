import {
  Coordinates,
  type DomainError,
  Fief,
  FiefName,
  type FiefRepository,
  Instant,
  type KingdomMapReader,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type KingdomMapReaderFixture = {
  readonly map: KingdomMapReader
  readonly fiefs: FiefRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const accepted = <T>(result: Result<T, DomainError>): T => {
  if (!result.ok) {
    throw new Error(`Fixture refused: ${result.error.kind}`)
  }
  return result.value
}

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z'))

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'
const carla = '00000000-0000-4000-8000-000000000003'

type Founding = {
  readonly id: string
  readonly playerId: PlayerId
  readonly name: string
  readonly kingdom: number
  readonly province: number
  readonly plot: number
}

const fiefFounded = ({ id, playerId, name, kingdom, province, plot }: Founding): Fief =>
  Fief.found({
    id,
    playerId,
    name: accepted(FiefName.create(name)),
    coordinates: accepted(Coordinates.create(kingdom, province, plot)),
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    at: foundedAt,
  })

const seed = async (
  { fiefs, registerPlayers }: KingdomMapReaderFixture,
  foundings: ReadonlyArray<Founding>,
): Promise<void> => {
  await registerPlayers(foundings.map((founding) => founding.playerId))
  for (const founding of foundings) {
    accepted(await fiefs.save(fiefFounded(founding)))
  }
}

export const kingdomMapReaderContract = (
  adapter: string,
  arrange: () => Promise<KingdomMapReaderFixture>,
): void => {
  describe(`${adapter} as a kingdom map reader`, () => {
    it('answers the address of the fief a player holds', async () => {
      const fixture = await arrange()
      await seed(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 7,
        },
      ])

      expect(await fixture.map.addressOf(ana)).toEqual({ kingdom: 1, province: 3, plot: 7 })
    })

    it('answers no address for a player without a fief', async () => {
      const fixture = await arrange()
      await seed(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 7,
        },
      ])

      expect(await fixture.map.addressOf(bruno)).toBeUndefined()
    })

    it('answers the highest province holding a fief in the kingdom', async () => {
      const fixture = await arrange()
      await seed(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 5,
          plot: 1,
        },
        {
          id: '00000000-0000-4000-8000-00000000000b',
          playerId: bruno,
          name: 'Robledal',
          kingdom: 1,
          province: 2,
          plot: 4,
        },
        {
          id: '00000000-0000-4000-8000-00000000000c',
          playerId: carla,
          name: 'Pedregal',
          kingdom: 2,
          province: 9,
          plot: 1,
        },
      ])

      expect(await fixture.map.lastOccupiedProvince(1)).toBe(5)
    })

    it('answers zero for a kingdom without a fief', async () => {
      const fixture = await arrange()
      await seed(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 7,
        },
      ])

      expect(await fixture.map.lastOccupiedProvince(2)).toBe(0)
    })

    it('lists the fiefs of one province in plot order', async () => {
      const fixture = await arrange()
      await seed(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 9,
        },
        {
          id: '00000000-0000-4000-8000-00000000000b',
          playerId: bruno,
          name: 'Robledal',
          kingdom: 1,
          province: 3,
          plot: 2,
        },
        {
          id: '00000000-0000-4000-8000-00000000000c',
          playerId: carla,
          name: 'Pedregal',
          kingdom: 1,
          province: 3,
          plot: 5,
        },
      ])

      expect(await fixture.map.holdersIn(1, 3)).toEqual([
        { plot: 2, name: 'Robledal', playerId: bruno },
        { plot: 5, name: 'Pedregal', playerId: carla },
        { plot: 9, name: 'Valdehierro', playerId: ana },
      ])
    })

    it('lists no fief of another province or kingdom', async () => {
      const fixture = await arrange()
      await seed(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 4,
        },
        {
          id: '00000000-0000-4000-8000-00000000000b',
          playerId: bruno,
          name: 'Robledal',
          kingdom: 1,
          province: 4,
          plot: 4,
        },
        {
          id: '00000000-0000-4000-8000-00000000000c',
          playerId: carla,
          name: 'Pedregal',
          kingdom: 2,
          province: 3,
          plot: 4,
        },
      ])

      expect(await fixture.map.holdersIn(1, 3)).toEqual([
        { plot: 4, name: 'Valdehierro', playerId: ana },
      ])
    })
  })
}
