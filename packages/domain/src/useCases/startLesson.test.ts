import { assert, describe, expect, it } from 'vitest'
import { Fief, type StoredFief } from '../fief/Fief'
import { noStoreFull } from '../fief/FullSince'
import type { StudySlot } from '../fief/StudySlot'
import { MemoryCard } from '../memory/MemoryCard'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { lessonOne } from '../testing/lessonOne'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { startLesson } from './startLesson'

const storedInstant = Instant.fromEpochMilliseconds(1_794_301_050_000)

const startInstant = Instant.fromEpochMilliseconds(1_794_301_050_000 + 60_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const learner = 'player-learner'

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  goals: [],
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const fiefOf = (overrides: Partial<StoredFief>): Fief => {
  const stored: StoredFief = {
    id: 'fief-1',
    playerId: learner,
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: storedInstant,
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
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
    skills: [],
    ...overrides,
  }
  const restored = Fief.restore(stored)
  assert(restored.ok)
  return restored.value
}

const lessonUnderStudy: StudySlot = {
  kind: 'lesson',
  lessonId: lessonOne.id,
  startedAt: storedInstant,
  finishesAt: Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + 150_000),
}

const arrange = (fiefs: ReadonlyArray<Fief>, owned: ReadonlyArray<OwnedCard>) => {
  const repository = inMemoryFiefRepository(fiefs)
  const dependencies = {
    fiefs: repository,
    cards: inMemoryCards(owned),
    lessons: inMemoryLessons([lessonOne], []),
    clock: frozenClock(startInstant),
  }
  return { repository, dependencies }
}

const command = { playerId: learner, fiefId: 'fief-1', lessonId: lessonOne.id }

describe('startLesson', () => {
  it('takes the study slot for 150 s at library level 1 and a study percent of 100', async () => {
    const { repository, dependencies } = arrange([fiefOf({})], [])

    const started = await startLesson(command, { ...dependencies, catalog })

    assert(started.ok)
    const expected: StudySlot = {
      kind: 'lesson',
      lessonId: lessonOne.id,
      startedAt: startInstant,
      finishesAt: Instant.fromEpochMilliseconds(startInstant.epochMilliseconds + 150_000),
    }
    expect(started.value.studySlot).toEqual(expected)
    expect(repository.storedFiefOf('fief-1')?.studySlot).toEqual(expected)
  })

  it('costs nothing', async () => {
    const fief = fiefOf({})
    const { dependencies } = arrange([fief], [])

    const started = await startLesson(command, { ...dependencies, catalog })

    assert(started.ok)
    expect(started.value.stocks).toEqual(fief.stocks)
  })

  it('refuses a lesson the content does not hold', async () => {
    const { dependencies } = arrange([fiefOf({})], [])

    const started = await startLesson(
      { ...command, lessonId: 'lesson-9' },
      { ...dependencies, catalog },
    )

    expect(started).toEqual({ ok: false, error: { kind: 'LessonNotFound', lessonId: 'lesson-9' } })
  })

  it('refuses a fief of another player', async () => {
    const { dependencies } = arrange([fiefOf({ playerId: 'player-other' })], [])

    const started = await startLesson(command, { ...dependencies, catalog })

    expect(started).toEqual({ ok: false, error: { kind: 'FiefNotFound', fiefId: 'fief-1' } })
  })

  it('refuses a lesson whose cards the player holds', async () => {
    const owned: OwnedCard = {
      playerId: learner,
      wordId: 'school',
      card: MemoryCard.entered(storedInstant),
    }
    const { dependencies } = arrange([fiefOf({})], [owned])

    const started = await startLesson(command, { ...dependencies, catalog })

    expect(started).toEqual({
      ok: false,
      error: { kind: 'LessonAlreadyStudied', lessonId: lessonOne.id },
    })
  })

  it('refuses a lesson another fief of the player is studying', async () => {
    const otherFief = fiefOf({
      id: 'fief-2',
      address: { kingdom: 1, province: 3, plot: 2 },
      studySlot: lessonUnderStudy,
    })
    const { repository, dependencies } = arrange([fiefOf({}), otherFief], [])

    const started = await startLesson(command, { ...dependencies, catalog })

    expect(started).toEqual({
      ok: false,
      error: { kind: 'LessonUnderStudy', lessonId: lessonOne.id },
    })
    expect(repository.storedFiefOf('fief-1')?.studySlot).toEqual({ kind: 'idle' })
  })

  it('refuses a busy study slot', async () => {
    const { dependencies } = arrange(
      [
        fiefOf({
          studySlot: {
            kind: 'busy',
            art: 'smithing',
            targetLevel: 1,
            startedAt: storedInstant,
            finishesAt: Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + 600_000),
            cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
          },
        }),
      ],
      [],
    )

    const started = await startLesson(command, { ...dependencies, catalog })

    expect(started).toEqual({ ok: false, error: { kind: 'StudySlotBusy' } })
  })

  it('refuses a fief with no library', async () => {
    const { dependencies } = arrange(
      [
        fiefOf({
          buildingLevels: {
            sawmill: 0,
            quarry: 0,
            ironMine: 0,
            farm: 0,
            warehouse: 0,
            library: 0,
            barracks: 0,
          },
        }),
      ],
      [],
    )

    const started = await startLesson(command, { ...dependencies, catalog })

    expect(started).toEqual({
      ok: false,
      error: { kind: 'LessonLibraryTooLow', requiredLibraryLevel: 1, libraryLevel: 0 },
    })
  })
})
