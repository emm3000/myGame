import type { SeenTowns } from '@mygame/domain'
import {
  Instant,
  type PlayerId,
  Town,
  TownAddress,
  TownName,
  type TownRepository,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

export type SeenTownsFixture = {
  readonly seenTowns: SeenTowns
  readonly towns: TownRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
  readonly seenAtOf: (playerId: PlayerId) => Promise<Instant | undefined>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const hoursAfterFounding = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(Date.parse('2026-11-11T08:00:00Z') + hours * 3_600_000)

const townOf = (id: string, playerId: PlayerId, site: number): Town => {
  const address = TownAddress.create(1, 1, site)
  const name = TownName.create(`Maple ${site}`)
  assert(address.ok && name.ok)
  return Town.found({
    id,
    playerId,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: hoursAfterFounding(0),
  })
}

const anasTown = townOf('00000000-0000-4000-8000-00000000000a', ana, 1)
const brunosTown = townOf('00000000-0000-4000-8000-00000000000b', bruno, 2)

const foundTowns = async (
  { towns, registerPlayers }: SeenTownsFixture,
  founded: ReadonlyArray<Town>,
): Promise<void> => {
  await registerPlayers([ana, bruno])
  for (const town of founded) {
    assert((await towns.save(town)).ok)
  }
}

export const seenTownsContract = (
  adapter: string,
  arrange: () => Promise<SeenTownsFixture>,
): void => {
  describe(`${adapter} as seen towns`, () => {
    it('reads a new town as never seen', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])

      expect(await fixture.seenAtOf(ana)).toBeUndefined()
    })

    it('stores the instant the town was seen at', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])

      const seen = await fixture.seenTowns.markSeen(ana, hoursAfterFounding(2))

      expect([seen, await fixture.seenAtOf(ana)]).toEqual([
        { ok: true, value: undefined },
        hoursAfterFounding(2),
      ])
    })

    it('moves the instant to a later sighting', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])
      await fixture.seenTowns.markSeen(ana, hoursAfterFounding(2))

      await fixture.seenTowns.markSeen(ana, hoursAfterFounding(5))

      expect(await fixture.seenAtOf(ana)).toEqual(hoursAfterFounding(5))
    })

    it('keeps the later instant when an earlier sighting lands after it', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])
      await fixture.seenTowns.markSeen(ana, hoursAfterFounding(5))

      await fixture.seenTowns.markSeen(ana, hoursAfterFounding(2))

      expect(await fixture.seenAtOf(ana)).toEqual(hoursAfterFounding(5))
    })

    it('keeps the instant when the town is saved again', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])
      await fixture.seenTowns.markSeen(ana, hoursAfterFounding(2))

      assert((await fixture.towns.save(anasTown)).ok)

      expect(await fixture.seenAtOf(ana)).toEqual(hoursAfterFounding(2))
    })

    it('keeps the sighting of one town from another', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown, brunosTown])

      await fixture.seenTowns.markSeen(ana, hoursAfterFounding(2))

      expect(await fixture.seenAtOf(bruno)).toBeUndefined()
    })

    it('refuses to mark the town of a player who holds none', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])

      const seen = await fixture.seenTowns.markSeen(bruno, hoursAfterFounding(2))

      expect(seen).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: bruno } })
    })
  })
}
