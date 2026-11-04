import {
  type AwayMarch,
  type BuildQueue,
  Coordinates,
  type DomainError,
  type EarnedSkill,
  Fief,
  FiefName,
  type FiefRepository,
  type IncomingCargo,
  Instant,
  type March,
  noStoreFull,
  type OpenRecruitOrder,
  ok,
  type PlayerId,
  type RecruitOrder,
  type Result,
  type StoredFief,
  type StudySlot,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'
import type { GuidanceDismissals } from '../guidance/GuidanceDismissals'

export type FiefRepositoryFixture = {
  readonly fiefs: FiefRepository
  readonly dismissals: GuidanceDismissals
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
const woodFilledAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T06:12:00Z'))
const goldFilledAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:59:30Z'))
const guidanceDismissedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:30:00Z'))
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

const trainedUnits: StoredFief['units'] = { infantry: 12, cavalry: 6, archer: 3, settler: 1 }

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
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
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
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
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
  units: { infantry: 12, cavalry: 6, archer: 0, settler: 0 },
  loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
}

const ridersAttacking: AwayMarch = {
  ...tenInfantryAttacking,
  units: { infantry: 0, cavalry: 10, archer: 0, settler: 0 },
  loot: { wood: 120, stone: 120, iron: 0, gold: 120, food: 0 },
}

const archersForaging: AwayMarch = {
  ...tenInfantryForaging,
  units: { infantry: 2, cavalry: 2, archer: 3, settler: 0 },
  loot: { wood: 204, stone: 204, iron: 0, gold: 0, food: 0 },
}

const settlerFounding: AwayMarch = {
  kind: 'away',
  order: 'found',
  name: 'Fuentesauce',
  province: 6,
  plot: 9,
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
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

const ridersCarrying: AwayMarch = {
  kind: 'away',
  order: 'transport',
  toFiefId: '00000000-0000-4000-8000-0000000000aa',
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  province: 4,
  plot: 9,
  units: { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
  stayHours: 0,
  departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:40:00Z')),
  oneWaySeconds: 900,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
}

const cargoFromTheOtherFief: IncomingCargo = {
  fromFiefId: '00000000-0000-4000-8000-0000000000aa',
  name: 'Penalta',
  province: 4,
  plot: 9,
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:50:00Z')),
  arrivesAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:05:00Z')),
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'
const unknownFiefId = '00000000-0000-4000-8000-0000000000ff'

const newFiefIn = (id: string, playerId: PlayerId, province: number, plot: number): Fief =>
  Fief.found({
    id,
    playerId,
    name: accepted(FiefName.create('Valdehierro')),
    coordinates: accepted(Coordinates.create(1, province, plot)),
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    at: foundedAt,
    skills: [],
  })

const newFief = (id: string, playerId: PlayerId, plot: number): Fief =>
  newFiefIn(id, playerId, 4, plot)

const anasFief = newFief('00000000-0000-4000-8000-00000000000a', ana, 7)

const foodSkill: EarnedSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z')),
}

const woodSkill: EarnedSkill = {
  lessonId: 'lesson-2',
  resource: 'wood',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-30T09:10:00Z')),
}

const stoneSkill: EarnedSkill = {
  lessonId: 'lesson-3',
  resource: 'stone',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-12-07T09:10:00Z')),
}

const fiefWithSkills = (
  id: string,
  playerId: PlayerId,
  plot: number,
  skills: ReadonlyArray<EarnedSkill>,
): Fief =>
  Fief.found({
    id,
    playerId,
    name: accepted(FiefName.create('Valdehierro')),
    coordinates: accepted(Coordinates.create(1, 4, plot)),
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    at: foundedAt,
    skills,
  })

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
      fullSince: noStoreFull,
      guidanceDismissedAt: null,
      skills: [],
    }),
  )

const lessonStudyingFief = accepted(
  Fief.restore({
    id: '00000000-0000-4000-8000-00000000000d',
    playerId: bruno,
    name: 'Robledal',
    address: { kingdom: 1, province: 5, plot: 3 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: foundedAt,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 1,
      barracks: 0,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: {
      kind: 'lesson',
      lessonId: 'lesson-1',
      startedAt: foundedAt,
      finishesAt: Instant.fromEpochMilliseconds(foundedAt.epochMilliseconds + 150_000),
    },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
    skills: [],
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
      units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
      slot: { kind: 'idle' },
      buildQueue: [],
      studySlot: { kind: 'idle' },
      recruitOrder: { kind: 'idle' },
      march,
      fullSince: noStoreFull,
      guidanceDismissedAt: null,
      skills: [],
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

const withIncomingCargo = (fief: Fief, incomingCargo: IncomingCargo): Fief =>
  accepted(
    Fief.restore({
      id: fief.id,
      playerId: fief.playerId,
      name: fief.name.value,
      address: {
        kingdom: fief.coordinates.kingdom,
        province: fief.coordinates.province,
        plot: fief.coordinates.plot,
      },
      stocks: fief.stocks,
      storedAt: fief.storedAt,
      buildingLevels: fief.buildingLevels,
      artLevels: fief.artLevels,
      units: {
        infantry: fief.units.countOf('infantry'),
        cavalry: fief.units.countOf('cavalry'),
        archer: fief.units.countOf('archer'),
        settler: fief.units.countOf('settler'),
      },
      slot: fief.slot,
      buildQueue: fief.buildQueue,
      studySlot: fief.studySlot,
      recruitOrder: fief.recruitOrder,
      march: fief.march,
      incomingCargo,
      fullSince: fief.fullSince,
      guidanceDismissedAt: null,
      skills: [],
    }),
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

    it('restores a lesson in the study slot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(lessonStudyingFief)

      expect(await fiefs.fiefOf(lessonStudyingFief.id)).toEqual(ok(lessonStudyingFief))
    })

    it('restores an idle study slot after a lesson leaves it', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(lessonStudyingFief)

      const cancelled = accepted(lessonStudyingFief.cancelLesson('lesson-1', foundedAt))
      await fiefs.save(cancelled.fief)

      const restored = await fiefs.fiefOf(lessonStudyingFief.id)
      expect(restored.ok && restored.value?.studySlot).toEqual({ kind: 'idle' })
    })

    it('restores the skills its player earned, in the order they were earned', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      const skilledFief = fiefWithSkills(anasFief.id, ana, 7, [woodSkill, foodSkill])

      await fiefs.save(skilledFief)

      const restored = await fiefs.fiefOf(anasFief.id)
      expect(restored.ok && restored.value?.skills).toEqual([foodSkill, woodSkill])
    })

    it('reads a skill saved with one fief on every fief of its player', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      const secondFiefId = '00000000-0000-4000-8000-00000000000e'
      await fiefs.save(fiefWithSkills(secondFiefId, ana, 8, []))

      await fiefs.save(fiefWithSkills(anasFief.id, ana, 7, [foodSkill]))

      const restored = await fiefs.fiefOf(secondFiefId)
      expect(restored.ok && restored.value?.skills).toEqual([foodSkill])
    })

    it('never takes back a skill that a later save of the player omits', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await fiefs.save(fiefWithSkills(anasFief.id, ana, 7, [foodSkill]))

      await fiefs.save(fiefWithSkills(anasFief.id, ana, 7, []))

      const restored = await fiefs.fiefOf(anasFief.id)
      expect(restored.ok && restored.value?.skills).toEqual([foodSkill])
    })

    it('keeps the instant a skill was first earned when a later save repeats it', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await fiefs.save(fiefWithSkills(anasFief.id, ana, 7, [foodSkill]))

      await fiefs.save(
        fiefWithSkills(anasFief.id, ana, 7, [{ ...foodSkill, earnedAt: woodSkill.earnedAt }]),
      )

      const restored = await fiefs.fiefOf(anasFief.id)
      expect(restored.ok && restored.value?.skills).toEqual([foodSkill])
    })

    it('reads three skills on a developed fief of its player and leaves the rest of it whole', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)

      await fiefs.save(
        fiefWithSkills('00000000-0000-4000-8000-00000000000e', bruno, 8, [
          stoneSkill,
          foodSkill,
          woodSkill,
        ]),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      assert(restored.ok && restored.value !== undefined)
      expect(restored.value.skills).toEqual([foodSkill, woodSkill, stoneSkill])
      expect([
        restored.value.buildingLevels,
        restored.value.buildQueue,
        restored.value.units,
        restored.value.march,
      ]).toEqual([
        developedFief.buildingLevels,
        developedFief.buildQueue,
        developedFief.units,
        developedFief.march,
      ])
    })

    it('keeps the skills of one player from another', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(fiefWithSkills(anasFief.id, ana, 7, [foodSkill]))

      await fiefs.save(fiefWithSkills('00000000-0000-4000-8000-00000000000e', bruno, 8, []))

      const restored = await fiefs.fiefOf('00000000-0000-4000-8000-00000000000e')
      expect(restored.ok && restored.value?.skills).toEqual([])
    })

    it('restores the full-since a save stored', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const fullSince = {
        wood: woodFilledAt,
        stone: null,
        iron: null,
        gold: goldFilledAt,
        food: null,
      }

      await fiefs.save(developedFief.withFullSince(fullSince))

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.fullSince).toEqual(fullSince)
    })

    it('restores no guidance dismissal on a fief never dismissed', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)

      expect(restored.ok && restored.value?.guidanceDismissedAt).toBeNull()
    })

    it('restores the instant the guidance of a fief was dismissed', async () => {
      const { fiefs, dismissals, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)
      await dismissals.dismiss(
        { playerId: developedFief.playerId, fiefId: developedFief.id },
        guidanceDismissedAt,
      )

      const restored = await fiefs.fiefOf(developedFief.id)

      expect(restored.ok && restored.value?.guidanceDismissedAt).toEqual(guidanceDismissedAt)
    })

    it('keeps the guidance dismissal when the fief is saved again', async () => {
      const { fiefs, dismissals, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(developedFief)
      await dismissals.dismiss(
        { playerId: developedFief.playerId, fiefId: developedFief.id },
        guidanceDismissedAt,
      )

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.guidanceDismissedAt).toEqual(guidanceDismissedAt)
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
          archer: restored.value?.units.countOf('archer'),
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
          { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
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

    it('restores an open recruit order of archers', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const archerOrder: OpenRecruitOrder = {
        kind: 'open',
        unit: 'archer',
        count: 4,
        cost: { wood: 160, stone: 0, iron: 40, gold: 20, food: 160 },
        perUnitSeconds: 50,
        startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:59:00Z')),
      }

      await fiefs.save(
        developedFiefWith(waitingEntries, archerOrder, { kind: 'idle' }, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.recruitOrder).toEqual(archerOrder)
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

    it('restores a march with archers', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, archersForaging, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(archersForaging)
    })

    it('restores the settler count of a march', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      const settlerAway: AwayMarch = {
        ...tenInfantryForaging,
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
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

    it('restores a transport march with its destination and its cargo', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, ridersCarrying, trainedUnits),
      )

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(ridersCarrying)
    })

    it('restores a forage march over a transport stored before it', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(
        developedFiefWith(waitingEntries, infantryOrder, ridersCarrying, trainedUnits),
      )

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.march).toEqual(tenInfantryForaging)
    })

    it('restores the cargo on its way to a fief', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(withIncomingCargo(developedFief, cargoFromTheOtherFief))

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.incomingCargo).toEqual(cargoFromTheOtherFief)
    })

    it('restores the departure of an incoming cargo', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])

      await fiefs.save(withIncomingCargo(developedFief, cargoFromTheOtherFief))

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value?.incomingCargo?.departedAt).toEqual(
        Instant.fromEpochMilliseconds(Date.parse('2026-09-22T07:50:00Z')),
      )
    })

    it('restores no cargo on its way once a later save drops it', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([bruno])
      await fiefs.save(withIncomingCargo(developedFief, cargoFromTheOtherFief))

      await fiefs.save(developedFief)

      const restored = await fiefs.fiefOf(developedFief.id)
      expect(restored.ok && restored.value).toMatchObject({ incomingCargo: undefined })
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

    it('counts a reserved plot as occupied', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await fiefs.save(anasFounding)
      await fiefs.save(settlerFiefWith(brunosFiefId, bruno, 8, recalledFounding))

      const occupied = await fiefs.occupiedPlots()

      expect(
        [...occupied].sort(
          (left, right) => left.province - right.province || left.plot - right.plot,
        ),
      ).toEqual([
        { kingdom: 1, province: 4, plot: 7 },
        { kingdom: 1, province: 4, plot: 8 },
        { kingdom: 1, province: 6, plot: 9 },
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

    it('lists the fiefs of a player by province then plot', async () => {
      const { fiefs, registerPlayers } = await arrange()
      await registerPlayers([ana])
      const furthest = newFiefIn('00000000-0000-4000-8000-00000000000d', ana, 5, 2)
      const higherPlot = newFiefIn('00000000-0000-4000-8000-00000000000e', ana, 4, 9)
      const nearest = newFiefIn('00000000-0000-4000-8000-00000000000f', ana, 4, 3)
      await fiefs.save(furthest)
      await fiefs.save(higherPlot)
      await fiefs.save(nearest)

      expect(await fiefs.fiefsOf(ana)).toEqual([nearest.id, higherPlot.id, furthest.id])
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
