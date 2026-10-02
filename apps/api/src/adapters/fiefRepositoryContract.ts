import {
  type AwayMarch,
  type BuildQueue,
  Coordinates,
  type DomainError,
  Fief,
  FiefName,
  type FiefRepository,
  Instant,
  type March,
  type OpenRecruitOrder,
  ok,
  type PlayerId,
  type RecruitOrder,
  type Result,
  type StoredFief,
  type StudySlot,
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

const studiedArts = { smithing: 2, masonry: 1 }

const masonryStudy: StudySlot = {
  kind: 'busy',
  art: 'masonry',
  targetLevel: 2,
  startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:30:00Z')),
  finishesAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T10:15:00Z')),
  cost: { wood: 80, stone: 120, iron: 0, gold: 35, food: 0 },
}

const trainedUnits: StoredFief['units'] = { infantry: 12, cavalry: 6, settler: 1 }

const infantryOrder: OpenRecruitOrder = {
  kind: 'open',
  unit: 'infantry',
  count: 4,
  cost: { wood: 80, stone: 0, iron: 40, gold: 0, food: 120 },
  perUnitSeconds: 300,
  startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:50:00Z')),
}

const tenInfantryForaging: AwayMarch = {
  kind: 'away',
  order: 'forage',
  province: 6,
  plot: 9,
  units: { infantry: 10, cavalry: 0, settler: 0 },
  stayHours: 2,
  departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:40:00Z')),
  oneWaySeconds: 1_020,
  loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
}

const tenInfantryAttacking: AwayMarch = {
  kind: 'away',
  order: 'attack',
  province: 6,
  plot: 9,
  units: { infantry: 10, cavalry: 0, settler: 0 },
  stayHours: 0,
  departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:40:00Z')),
  oneWaySeconds: 1_020,
  loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
  camp: { tier: 1, strength: 6 },
  fought: true,
}

const infantryAndRidersForaging: AwayMarch = {
  ...tenInfantryForaging,
  units: { infantry: 12, cavalry: 6, settler: 0 },
  loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
}

const ridersAttacking: AwayMarch = {
  ...tenInfantryAttacking,
  units: { infantry: 0, cavalry: 10, settler: 0 },
  loot: { wood: 120, stone: 120, iron: 0, gold: 120, food: 0 },
}

const settlerFounding: AwayMarch = {
  kind: 'away',
  order: 'found',
  name: 'Sotoverde del Páramo',
  province: 6,
  plot: 9,
  units: { infantry: 0, cavalry: 0, settler: 1 },
  stayHours: 0,
  departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:40:00Z')),
  oneWaySeconds: 900,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
}

const recalledFounding: AwayMarch = {
  ...settlerFounding,
  recalledAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:50:00Z')),
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'
const unknownFiefId = '00000000-0000-4000-8000-0000000000ff'

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

const developedFiefWith = (
  buildQueue: BuildQueue,
  recruitOrder: RecruitOrder,
  march: March,
  units: StoredFief['units'],
): Fief =>
  accepted(
    Fief.restore({
      id: '00000000-0000-4000-8000-00000000000b',
      playerId: bruno,
      name: 'Robledal',
      address: { kingdom: 1, province: 5, plot: 2 },
      stocks: { wood: 1200, stone: 830, iron: 415, gold: 90, food: 610 },
      storedAt: foundedAt,
      buildingLevels: {
        sawmill: 3,
        quarry: 2,
        ironMine: 1,
        farm: 2,
        warehouse: 1,
        library: 2,
        barracks: 1,
      },
      artLevels: studiedArts,
      units,
      slot: {
        kind: 'busy',
        building: 'ironMine',
        targetLevel: 2,
        startedAt: ironMineStartedAt,
        finishesAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:45:00Z')),
        cost: ironMineCost,
      },
      buildQueue,
      studySlot: masonryStudy,
      recruitOrder,
      march,
    }),
  )

const settlerFiefWith = (id: string, playerId: PlayerId, plot: number, march: March): Fief =>
  accepted(
    Fief.restore({
      id,
      playerId,
      name: 'Valdehierro',
      address: { kingdom: 1, province: 4, plot },
      stocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
      storedAt: foundedAt,
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
      march,
    }),
  )

const anasFounding = settlerFiefWith(anasFief.id, ana, 7, settlerFounding)

const brunosFiefId = '00000000-0000-4000-8000-00000000000c'

const developedFief = developedFiefWith(
  waitingEntries,
  infantryOrder,
  tenInfantryForaging,
  trainedUnits,
)

const upgradedFief = (fief: Fief): Fief =>
  accepted(
    fief.enqueueUpgrade(
      {
        building: 'sawmill',
        targetLevel: 1,
        cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
        durationSeconds: 120,
      },
      { wood: 545, stone: 506, iron: 200, gold: 50, food: 337 },
      upgradedAt,
      4,
    ),
  )

export const fiefRepositoryContract = (
  adapter: string,
  arrange: () => Promise<FiefRepositoryFixture>,
): void => {
  describe(`${adapter} as a FiefRepository`, () => {
    it('answers no fief for an unknown id', async () => {
      const { fiefs } = await arrange()

      expect(await fiefs.fiefOf(unknownFiefId)).toEqual(ok(undefined))
    })

    it('restores a saved fief with every stored value', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      expect(await fiefs.fiefOf(developedFief.id)).toEqual(ok(developedFief))
    })

    it('restores the instant a busy slot started', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.slot).toMatchObject({ startedAt: ironMineStartedAt })
    })

    it('restores the cost a busy slot debited', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.slot).toMatchObject({ cost: ironMineCost })
    })

    it('restores the build queue in order', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.buildQueue).toEqual(waitingEntries)
    })

    it('restores the library level', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.buildingLevels.library).toBe(2)
    })

    it('restores the barracks level', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.buildingLevels.barracks).toBe(1)
    })

    it('restores the art levels', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.artLevels).toEqual(studiedArts)
    })

    it('restores a busy study slot with its cost', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.studySlot).toEqual(masonryStudy)
    })

    it('restores the unit counts', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(
        restored.ok && {
          infantry: restored.value?.units.countOf('infantry'),
          cavalry: restored.value?.units.countOf('cavalry'),
          settler: restored.value?.units.countOf('settler'),
        },
      ).toEqual(trainedUnits)
    })

    it('restores 0 infantry after the count drops to 0', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)

      await fiefs.save(
        developedFiefWith(
          waitingEntries,
          infantryOrder,
          { kind: 'idle' },
          { infantry: 0, cavalry: 6, settler: 0 },
        ),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.units.countOf('infantry')).toBe(0)
    })

    it('restores every unit of a founded fief at zero', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await fiefs.save(anasFief)

      const restored = await fiefs.fiefOf(anasFief.id)
      expect(restored.ok && restored.value?.units.countOf('infantry')).toBe(0)
    })

    it('restores an open recruit order with its cost', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.recruitOrder).toEqual(infantryOrder)
    })

    it('restores an open recruit order of riders', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const riderOrder: OpenRecruitOrder = {
        kind: 'open',
        unit: 'cavalry',
        count: 2,
        cost: { wood: 60, stone: 0, iron: 80, gold: 40, food: 160 },
        perUnitSeconds: 900,
        startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:50:00Z')),
      }

      await fiefs.save(
        developedFiefWith(waitingEntries, riderOrder, { kind: 'idle' }, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.recruitOrder).toEqual(riderOrder)
    })

    it('restores an open recruit order of settlers', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const settlerOrder: OpenRecruitOrder = {
        kind: 'open',
        unit: 'settler',
        count: 1,
        cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
        perUnitSeconds: 1200,
        startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:50:00Z')),
      }

      await fiefs.save(
        developedFiefWith(waitingEntries, settlerOrder, { kind: 'idle' }, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.recruitOrder).toEqual(settlerOrder)
    })

    it('restores an idle recruit slot after the order closes', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)

      await fiefs.save(
        developedFiefWith(waitingEntries, { kind: 'idle' }, tenInfantryForaging, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.recruitOrder).toEqual({ kind: 'idle' })
    })

    it('restores a march away with its loot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(tenInfantryForaging)
    })

    it('restores the loot percents of a forage march', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const springForage: AwayMarch = {
        ...tenInfantryForaging,
        lootPercent: { wood: 105, stone: 95, iron: 110, gold: 120, food: 125 },
      }

      await fiefs.save(developedFiefWith(waitingEntries, infantryOrder, springForage, trainedUnits))

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(springForage)
    })

    it('restores the loot percents of an attack', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const winterAttack: AwayMarch = {
        ...tenInfantryAttacking,
        lootPercent: { wood: 90, stone: 85, iron: 80, gold: 70, food: 75 },
      }

      await fiefs.save(developedFiefWith(waitingEntries, infantryOrder, winterAttack, trainedUnits))

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(winterAttack)
    })

    it('reads back a recalled march with its partial loot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const recalledMarch: AwayMarch = {
        ...tenInfantryForaging,
        recalledAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:27:00Z')),
        loot: { wood: 25, stone: 25, iron: 0, gold: 0, food: 0 },
      }

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, recalledMarch, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(recalledMarch)
    })

    it('restores an attack march with its camp snapshot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, tenInfantryAttacking, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(tenInfantryAttacking)
    })

    it('restores a march of infantry and riders', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, infantryAndRidersForaging, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(infantryAndRidersForaging)
    })

    it('restores an attack of riders alone', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, ridersAttacking, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(ridersAttacking)
    })

    it('restores the settler count of a march', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const settlerAway: AwayMarch = {
        ...tenInfantryForaging,
        units: { infantry: 0, cavalry: 0, settler: 1 },
        loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      }

      await fiefs.save(developedFiefWith(waitingEntries, infantryOrder, settlerAway, trainedUnits))

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(settlerAway)
    })

    it('restores a founding march with its name', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await fiefs.save(anasFounding)

      const restored = await fiefs.fiefOf(anasFief.id)
      expect(restored.ok && restored.value?.march).toEqual(settlerFounding)
    })

    it('refuses a founding to a plot another founding reserves', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFounding)

      const saved = await fiefs.save(settlerFiefWith(brunosFiefId, bruno, 8, settlerFounding))

      expect(saved).toEqual({ ok: false, error: { kind: 'PlotReserved', province: 6, plot: 9 } })
    })

    it('frees the plot of a recalled founding', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(settlerFiefWith(anasFief.id, ana, 7, recalledFounding))

      const saved = await fiefs.save(settlerFiefWith(brunosFiefId, bruno, 8, settlerFounding))

      expect(saved).toEqual(ok(undefined))
    })

    it('counts the foundings a player has on the road', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFounding)
      await fiefs.save(developedFief)

      expect([
        await fiefs.foundingsOnTheRoadOf(ana),
        await fiefs.foundingsOnTheRoadOf(bruno),
      ]).toEqual([1, 0])
    })

    it('counts no recalled founding on the road', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await fiefs.save(settlerFiefWith(anasFief.id, ana, 7, recalledFounding))

      expect(await fiefs.foundingsOnTheRoadOf(ana)).toBe(0)
    })

    it('restores a forage march over an attack stored before it', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, tenInfantryAttacking, trainedUnits),
      )

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(tenInfantryForaging)
    })

    it('restores an idle march slot after the return', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, { kind: 'idle' }, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual({ kind: 'idle' })
    })

    it('restores every art of a founded fief at level zero', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await fiefs.save(anasFief)

      const restored = await fiefs.fiefOf(anasFief.id)
      expect(restored.ok && restored.value?.artLevels).toEqual({ smithing: 0, masonry: 0 })
    })

    it('drops the entries a later save no longer holds', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)
      const shortened = developedFiefWith(
        waitingEntries.slice(0, 1),
        infantryOrder,
        tenInfantryForaging,
        trainedUnits,
      )

      await fiefs.save(shortened)

      expect(await fiefs.fiefOf(developedFief.id)).toEqual(ok(shortened))
    })

    it('stores the amounts with the instant they were materialized at', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await fiefs.save(anasFief)
      const upgraded = upgradedFief(anasFief)

      await fiefs.save(upgraded)

      expect(await fiefs.fiefOf(anasFief.id)).toEqual(ok(upgraded))
    })

    it('tells a player who holds a fief from one who does not', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)

      expect([await fiefs.holdsFief(ana), await fiefs.holdsFief(bruno)]).toEqual([true, false])
    })

    it('lists the fief a player holds and none of another lord', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)
      await fiefs.save(developedFief)

      expect(await fiefs.fiefsOf(bruno)).toEqual([developedFief.id])
    })

    it('lists no fief for a player who holds none', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)

      expect(await fiefs.fiefsOf(bruno)).toEqual([])
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

      expect([saved, await fiefs.fiefOf(anasFief.id)]).toEqual([
        { ok: false, error: { kind: 'PlayerAlreadyHoldsFief', playerId: ana } },
        ok(anasFief),
      ])
    })

    it('keeps the first fief when a rival loses the plot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFief)

      await fiefs.save(newFief('00000000-0000-4000-8000-00000000000c', bruno, 7))

      expect([await fiefs.fiefOf(anasFief.id), await fiefs.holdsFief(bruno)]).toEqual([
        ok(anasFief),
        false,
      ])
    })
  })
}
