import {
  type BuildQueue,
  Coordinates,
  type DomainError,
  Fief,
  FiefName,
  type FiefRepository,
  Instant,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type FiefRepositoryFixture = {
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
const upgradedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:30:00Z'))
const ironMineStartedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:45:00Z'))
const ironMineCost = { wood: 240, stone: 180, iron: 60, gold: 15, food: 30 }

const waitingEntries: BuildQueue = [
  {
    building: 'warehouse',
    targetLevel: 2,
    cost: { wood: 300, stone: 250, iron: 40, gold: 0, food: 0 },
    durationSeconds: 1800,
  },
  {
    building: 'ironMine',
    targetLevel: 3,
    cost: { wood: 360, stone: 270, iron: 90, gold: 20, food: 45 },
    durationSeconds: 2700,
  },
  {
    building: 'farm',
    targetLevel: 3,
    cost: { wood: 150, stone: 90, iron: 0, gold: 0, food: 30 },
    durationSeconds: 900,
  },
]

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'
const stranger = '00000000-0000-4000-8000-0000000000ff'

const newFief = (id: string, playerId: PlayerId, plot: number): Fief =>
  Fief.found({
    id,
    playerId,
    name: accepted(FiefName.create('Valdehierro')),
    coordinates: accepted(Coordinates.create(1, 4, plot)),
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    at: foundedAt,
  })

const anasFief = newFief('00000000-0000-4000-8000-00000000000a', ana, 7)

const developedFiefWaiting = (buildQueue: BuildQueue): Fief =>
  accepted(
    Fief.restore({
      id: '00000000-0000-4000-8000-00000000000b',
      playerId: bruno,
      name: 'Robledal',
      address: { kingdom: 1, province: 5, plot: 2 },
      stocks: { wood: 1200, stone: 830, iron: 415, gold: 90, food: 610 },
      storedAt: foundedAt,
      buildingLevels: { sawmill: 3, quarry: 2, ironMine: 1, farm: 2, warehouse: 1 },
      slot: {
        kind: 'busy',
        building: 'ironMine',
        targetLevel: 2,
        startedAt: ironMineStartedAt,
        finishesAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:45:00Z')),
        cost: ironMineCost,
      },
      buildQueue,
    }),
  )

const developedFief = developedFiefWaiting(waitingEntries)

const upgradedFief = (fief: Fief): Fief =>
  accepted(
    fief.startUpgrade(
      {
        building: 'sawmill',
        targetLevel: 1,
        cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
        finishesAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:32:00Z')),
      },
      { wood: 545, stone: 506, iron: 200, gold: 50, food: 337 },
      upgradedAt,
    ),
  )

export const fiefRepositoryContract = (
  adapter: string,
  arrange: () => Promise<FiefRepositoryFixture>,
): void => {
  describe(`${adapter} as a FiefRepository`, () => {
    it('reports an unknown fief instead of throwing', async () => {
      const { fiefs } = await arrange()

      expect(await fiefs.fiefOf(stranger)).toEqual(ok(undefined))
    })

    it('restores a saved fief with every stored value', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      expect(await fiefs.fiefOf(bruno)).toEqual(ok(developedFief))
    })

    it('restores the instant a busy slot started', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(bruno)
      expect(restored.ok && restored.value?.slot).toMatchObject({ startedAt: ironMineStartedAt })
    })

    it('restores the cost a busy slot debited', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(bruno)
      expect(restored.ok && restored.value?.slot).toMatchObject({ cost: ironMineCost })
    })

    it('restores the build queue in order', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(bruno)
      expect(restored.ok && restored.value?.buildQueue).toEqual(waitingEntries)
    })

    it('drops the entries a later save no longer holds', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)
      const shortened = developedFiefWaiting(waitingEntries.slice(0, 1))

      await fiefs.save(shortened)

      expect(await fiefs.fiefOf(bruno)).toEqual(ok(shortened))
    })

    it('stores the amounts with the instant they were materialized at', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await fiefs.save(anasFief)
      const upgraded = upgradedFief(anasFief)

      await fiefs.save(upgraded)

      expect(await fiefs.fiefOf(ana)).toEqual(ok(upgraded))
    })

    it('tells a player who holds a fief from one who does not', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)

      expect([await fiefs.holdsFief(ana), await fiefs.holdsFief(bruno)]).toEqual([true, false])
    })

    it('lists the plot of every saved fief as occupied', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)
      await fiefs.save(developedFief)

      const occupied = await fiefs.occupiedPlots()

      expect([...occupied].sort((left, right) => left.province - right.province)).toEqual([
        { kingdom: 1, province: 4, plot: 7 },
        { kingdom: 1, province: 5, plot: 2 },
      ])
    })

    it('refuses a second fief on a taken plot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)
      const rival = newFief('00000000-0000-4000-8000-00000000000c', bruno, 7)

      const saved = await fiefs.save(rival)

      expect(saved).toEqual({
        ok: false,
        error: { kind: 'CoordinatesTaken', coordinates: rival.coordinates },
      })
    })

    it('refuses a second fief for a player who holds one', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await fiefs.save(anasFief)

      const saved = await fiefs.save(newFief('00000000-0000-4000-8000-00000000000c', ana, 8))

      expect([saved, await fiefs.fiefOf(ana)]).toEqual([
        { ok: false, error: { kind: 'PlayerAlreadyHoldsFief', playerId: ana } },
        ok(anasFief),
      ])
    })

    it('keeps the first fief when a rival loses the plot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)

      await fiefs.save(newFief('00000000-0000-4000-8000-00000000000c', bruno, 7))

      expect([await fiefs.fiefOf(ana), await fiefs.holdsFief(bruno)]).toEqual([ok(anasFief), false])
    })
  })
}
