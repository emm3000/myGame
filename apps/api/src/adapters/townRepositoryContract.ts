import { Instant, type PlayerId } from '@mygame/domain'
import type { TownRepository } from '@mygame/domain/town'
import { foundingLevels, noStoreFull, Town, TownAddress, TownName } from '@mygame/domain/town'
import { assert, describe, expect, it } from 'vitest'

export type TownRepositoryFixture = {
  readonly towns: TownRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T08:00:00Z'))
const grownAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T10:30:00Z'))
const foodFilledAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T09:45:00Z'))

const townOf = (id: string, playerId: PlayerId, area: number, site: number): Town => {
  const address = TownAddress.create(1, area, site)
  const name = TownName.create(`Town ${id.slice(-1)}`)
  assert(address.ok && name.ok)
  return Town.found({
    id,
    playerId,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    at: foundedAt,
  })
}

const anasTown = townOf('00000000-0000-4000-8000-00000000000a', ana, 1, 1)

const grownTown = (): Town => {
  const restored = Town.restore({
    id: anasTown.id,
    playerId: anasTown.playerId,
    name: anasTown.name,
    address: anasTown.address,
    stocks: { money: 912, food: 1000, power: 0, material: 47 },
    storedAt: grownAt,
    fullSince: { ...noStoreFull, food: foodFilledAt },
    buildingLevels: { ...foundingLevels, farm: 3, storage: 1, office: 2 },
  })
  assert(restored.ok)
  return restored.value
}

export const townRepositoryContract = (
  adapterName: string,
  arrange: () => Promise<TownRepositoryFixture>,
): void => {
  describe(`${adapterName} as a TownRepository`, () => {
    it('reads back a founded town', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await towns.save(anasTown)

      expect(await towns.townOf(ana)).toEqual({ ok: true, value: anasTown })
    })

    it('reads back the stocks, the full stores and the levels of a later save', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      await towns.save(grownTown())

      expect(await towns.townOf(ana)).toEqual({ ok: true, value: grownTown() })
    })

    it('answers no town for a player who holds none', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await towns.save(anasTown)

      expect([await towns.townOf(bruno), await towns.holdsTown(bruno)]).toEqual([
        { ok: true, value: undefined },
        false,
      ])
    })

    it('tells a player who holds a town', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      expect(await towns.holdsTown(ana)).toBe(true)
    })

    it('lists the site of every town', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await towns.save(anasTown)
      await towns.save(townOf('00000000-0000-4000-8000-00000000000b', bruno, 2, 7))

      const sites = await towns.occupiedSites()

      expect([...sites].sort((left, right) => left.area - right.area)).toEqual([
        { region: 1, area: 1, site: 1 },
        { region: 1, area: 2, site: 7 },
      ])
    })

    it('refuses a second town on a taken site with SiteTaken', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await towns.save(anasTown)

      const saved = await towns.save(townOf('00000000-0000-4000-8000-00000000000b', bruno, 1, 1))

      expect(saved).toEqual({
        ok: false,
        error: { kind: 'SiteTaken', site: { region: 1, area: 1, site: 1 } },
      })
    })

    it('refuses a second town for one player with PlayerAlreadyHoldsTown', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      const saved = await towns.save(townOf('00000000-0000-4000-8000-00000000000b', ana, 1, 2))

      expect(saved).toEqual({
        ok: false,
        error: { kind: 'PlayerAlreadyHoldsTown', playerId: ana },
      })
    })

    it('keeps one town when two foundings race for one site', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      const brunosTown = townOf('00000000-0000-4000-8000-00000000000b', bruno, 1, 1)

      const saves = await Promise.all([towns.save(anasTown), towns.save(brunosTown)])

      const held = [await towns.holdsTown(ana), await towns.holdsTown(bruno)]
      expect([saves.filter((saved) => saved.ok).length, held.filter(Boolean).length]).toEqual([
        1, 1,
      ])
      expect(saves.find((saved) => !saved.ok)).toEqual({
        ok: false,
        error: { kind: 'SiteTaken', site: { region: 1, area: 1, site: 1 } },
      })
    })
  })
}
