import {
  Coordinates,
  type DomainError,
  Fief,
  FiefName,
  type FiefRepository,
  Instant,
  type KingdomMapReader,
  type PlayerId,
  type PlotAddress,
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

type FoundingOnTheRoad = Founding & {
  readonly target: { readonly province: number; readonly plot: number }
  readonly recalledAt?: Instant
}

const departedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:10:00Z'))

const fiefSendingSettler = ({
  id,
  playerId,
  name,
  kingdom,
  province,
  plot,
  target,
  recalledAt,
}: FoundingOnTheRoad): Fief => {
  const address: PlotAddress = { kingdom, province, plot }
  return accepted(
    Fief.restore({
      id,
      playerId,
      name,
      address,
      stocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
      storedAt: departedAt,
      buildingLevels: {
        sawmill: 0,
        quarry: 0,
        ironMine: 0,
        farm: 0,
        warehouse: 0,
        library: 0,
        barracks: 5,
      },
      artLevels: { smithing: 0, masonry: 0 },
      units: { infantry: 0, cavalry: 0, settler: 1 },
      slot: { kind: 'idle' },
      buildQueue: [],
      studySlot: { kind: 'idle' },
      recruitOrder: { kind: 'idle' },
      march: {
        kind: 'away',
        order: 'found',
        name: 'Fuentesauce',
        province: target.province,
        plot: target.plot,
        units: { infantry: 0, cavalry: 0, settler: 1 },
        stayHours: 0,
        departedAt,
        oneWaySeconds: 900,
        loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
        lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
        ...(recalledAt === undefined ? {} : { recalledAt }),
      },
    }),
  )
}

const seedFoundings = async (
  { fiefs, registerPlayers }: KingdomMapReaderFixture,
  foundings: ReadonlyArray<FoundingOnTheRoad>,
): Promise<void> => {
  await registerPlayers(foundings.map((founding) => founding.playerId))
  for (const founding of foundings) {
    accepted(await fiefs.save(fiefSendingSettler(founding)))
  }
}

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
    it('answers the address of a fief by its id', async () => {
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

      expect(await fixture.map.addressOf('00000000-0000-4000-8000-00000000000a')).toEqual({
        address: { kingdom: 1, province: 3, plot: 7 },
        playerId: ana,
      })
    })

    it('answers no address for an unknown fief', async () => {
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

      expect(await fixture.map.addressOf('00000000-0000-4000-8000-0000000000ff')).toBeUndefined()
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

    it('lists the founding marches in flight of a province', async () => {
      const fixture = await arrange()
      await seedFoundings(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 7,
          target: { province: 4, plot: 5 },
        },
        {
          id: '00000000-0000-4000-8000-00000000000b',
          playerId: bruno,
          name: 'Robledal',
          kingdom: 1,
          province: 3,
          plot: 9,
          target: { province: 4, plot: 2 },
        },
        {
          id: '00000000-0000-4000-8000-00000000000c',
          playerId: carla,
          name: 'Pedregal',
          kingdom: 2,
          province: 3,
          plot: 1,
          target: { province: 4, plot: 8 },
        },
      ])

      expect(await fixture.map.reservationsIn(1, 4)).toEqual([
        { plot: 2, playerId: bruno },
        { plot: 5, playerId: ana },
      ])
    })

    it('leaves out a recalled founding', async () => {
      const fixture = await arrange()
      await seedFoundings(fixture, [
        {
          id: '00000000-0000-4000-8000-00000000000a',
          playerId: ana,
          name: 'Valdehierro',
          kingdom: 1,
          province: 3,
          plot: 7,
          target: { province: 4, plot: 2 },
          recalledAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:15:00Z')),
        },
        {
          id: '00000000-0000-4000-8000-00000000000b',
          playerId: bruno,
          name: 'Robledal',
          kingdom: 1,
          province: 3,
          plot: 9,
          target: { province: 4, plot: 5 },
        },
      ])

      expect(await fixture.map.reservationsIn(1, 4)).toEqual([{ plot: 5, playerId: bruno }])
    })
  })
}
