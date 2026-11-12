import {
  Instant,
  type PlayerId,
  Town,
  TownAddress,
  TownName,
  type TownRepository,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'
import type { GuidanceDismissals } from '../town/GuidanceDismissals'

export type GuidanceDismissalsFixture = {
  readonly dismissals: GuidanceDismissals
  readonly towns: TownRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
  readonly dismissedAtOf: (playerId: PlayerId) => Promise<Instant | undefined>
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
  { towns, registerPlayers }: GuidanceDismissalsFixture,
  founded: ReadonlyArray<Town>,
): Promise<void> => {
  await registerPlayers([ana, bruno])
  for (const town of founded) {
    assert((await towns.save(town)).ok)
  }
}

export const guidanceDismissalsContract = (
  adapter: string,
  arrange: () => Promise<GuidanceDismissalsFixture>,
): void => {
  describe(`${adapter} as guidance dismissals`, () => {
    it('reads the guidance of a new town as not dismissed', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])

      expect(await fixture.dismissedAtOf(ana)).toBeUndefined()
    })

    it('stores the dismissal at the instant given', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])

      const dismissal = await fixture.dismissals.dismiss(ana, hoursAfterFounding(2))

      expect([dismissal, await fixture.dismissedAtOf(ana)]).toEqual([
        { ok: true, value: undefined },
        hoursAfterFounding(2),
      ])
    })

    it('keeps the first dismissal', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])
      await fixture.dismissals.dismiss(ana, hoursAfterFounding(2))

      await fixture.dismissals.dismiss(ana, hoursAfterFounding(5))

      expect(await fixture.dismissedAtOf(ana)).toEqual(hoursAfterFounding(2))
    })

    it('keeps the dismissal when the town is saved again', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])
      await fixture.dismissals.dismiss(ana, hoursAfterFounding(2))

      assert((await fixture.towns.save(anasTown)).ok)

      expect(await fixture.dismissedAtOf(ana)).toEqual(hoursAfterFounding(2))
    })

    it('keeps the dismissal of one town from another', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown, brunosTown])

      await fixture.dismissals.dismiss(ana, hoursAfterFounding(2))

      expect(await fixture.dismissedAtOf(bruno)).toBeUndefined()
    })

    it('refuses to dismiss the guidance of a player who holds no town', async () => {
      const fixture = await arrange()
      await foundTowns(fixture, [anasTown])

      const dismissal = await fixture.dismissals.dismiss(bruno, hoursAfterFounding(2))

      expect(dismissal).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: bruno } })
    })
  })
}
