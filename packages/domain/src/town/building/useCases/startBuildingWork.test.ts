import { assert, describe, expect, it } from 'vitest'
import type { HeldCard } from '#learning/HeldCard'
import { inMemoryCards } from '#learning/testing/inMemoryCards'
import { MemoryCard } from '#memory/MemoryCard'
import type { Clock } from '#ports/Clock'
import { Instant } from '#time/Instant'
import type { TownCatalog } from '../../ports/TownCatalog'
import { inMemoryTownNews } from '../../testing/inMemoryTownNews'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { plainTownLevels, plainTownSettings, townCatalogOf } from '../../testing/townCatalogOf'
import { type TownShape, townOf } from '../../testing/townFixtures'
import type { BuildingKind } from '../BuildingKind'
import type { BuildingLevel } from '../BuildingLevel'
import { startBuildingWork } from './startBuildingWork'

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR,
  )

const storedAt = hoursAfterEpoch(1)

const now = hoursAfterEpoch(2)

const frozenClock: Clock = { now: () => now }

const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

const pricedLevels: ReadonlyArray<BuildingLevel> = plainTownLevels.map((line) => ({
  ...line,
  cost: { money: 50 * line.level, food: 20, power: 0, material: 100 },
}))

const pricedCatalog = townCatalogOf(plainTownSettings, pricedLevels)

const startingStocks = { money: 400, food: 300, power: 200, material: 500 }

const homesUpToSeven: ReadonlyArray<BuildingLevel> = [
  ...pricedLevels,
  ...[3, 4, 5, 6, 7].map(
    (level): BuildingLevel => ({
      building: 'homes',
      level,
      cost: { money: 50, food: 20, power: 0, material: 100 },
      durationSeconds: 60 * level,
      people: 0,
      peopleSupplied: 20 * level,
    }),
  ),
]

const tallHomesCatalog = townCatalogOf(plainTownSettings, homesUpToSeven)

const heldCardOf = (wordId: string, stability: number, retainedAt: Instant | null): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: storedAt,
    lastRating: 'good',
    enteredAt: storedAt,
    retainedAt,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const cardsOf = (
  prefix: string,
  count: number,
  stability: number,
  retainedAt: Instant | null,
): ReadonlyArray<HeldCard> =>
  Array.from({ length: count }, (_, index) =>
    heldCardOf(`${prefix}-${index}`, stability, retainedAt),
  )

const stableCardsOf = (count: number): ReadonlyArray<HeldCard> => cardsOf('stable', count, 12, null)

const retainedCardsOf = (count: number): ReadonlyArray<HeldCard> =>
  cardsOf('retained', count, 12, storedAt)

const learningCardsOf = (count: number): ReadonlyArray<HeldCard> =>
  cardsOf('learning', count, 2.3, null)

const startIn = async (
  shape: Omit<TownShape, 'storedAt'>,
  buildings: ReadonlyArray<BuildingKind>,
  catalog: TownCatalog = pricedCatalog,
  held: ReadonlyArray<HeldCard> = [],
): Promise<ReturnType<typeof startBuildingWork>> => {
  const towns = inMemoryTowns([townOf({ stocks: startingStocks, storedAt, ...shape })])
  const cards = inMemoryCards(held.map((card) => ({ ...card, playerId: 'player-1' })))
  const dependencies = { towns, news: inMemoryTownNews(), cards, catalog, clock: frozenClock }
  const last = buildings.at(-1)
  for (const building of buildings.slice(0, -1)) {
    const started = await startBuildingWork({ playerId: 'player-1', building }, dependencies)
    assert(started.ok)
  }
  assert(last !== undefined)
  return startBuildingWork({ playerId: 'player-1', building: last }, dependencies)
}

describe('startBuildingWork', () => {
  it('starts work in the idle slot', async () => {
    const started = await startIn({}, ['farm'])

    assert(started.ok)
    expect(started.value.workSlot).toEqual({
      kind: 'busy',
      building: 'farm',
      level: 1,
      cost: { money: 50, food: 20, power: 0, material: 100 },
      startedAt: now,
      finishesAt: secondsAfter(now, 60),
    })
  })

  it('charges the cost at the enqueue', async () => {
    const started = await startIn({}, ['farm'])

    assert(started.ok)
    expect([started.value.stocks, started.value.storedAt]).toEqual([
      { money: 362, food: 285, power: 200, material: 400 },
      now,
    ])
  })

  it("queues behind a busy slot up to the content's cap", async () => {
    const started = await startIn({}, ['farm', 'farm', 'factory'])

    assert(started.ok)
    expect(started.value.waitingList).toEqual([
      {
        building: 'farm',
        level: 2,
        cost: { money: 100, food: 20, power: 0, material: 100 },
        durationSeconds: 120,
      },
      {
        building: 'factory',
        level: 1,
        cost: { money: 50, food: 20, power: 0, material: 100 },
        durationSeconds: 60,
      },
    ])
  })

  it('refuses work past the cap', async () => {
    const refused = await startIn({}, ['farm', 'farm', 'factory', 'powerStation'])

    expect(refused).toEqual({ ok: false, error: { kind: 'WaitingListFull', cap: 2 } })
  })

  it("fixes the duration with the season's build percent at the enqueue", async () => {
    const quickSpring = townCatalogOf(
      {
        ...plainTownSettings,
        seasons: {
          ...plainTownSettings.seasons,
          durationPercent: {
            ...plainTownSettings.seasons.durationPercent,
            spring: { build: 75, study: 100, hire: 100, road: 100 },
          },
        },
      },
      pricedLevels,
    )

    const started = await startIn({}, ['farm'], quickSpring)

    assert(started.ok && started.value.workSlot.kind === 'busy')
    expect(started.value.workSlot.finishesAt).toEqual(secondsAfter(now, 45))
  })

  it('refuses work whose people would pass the free people', async () => {
    const crowdedFactory = townCatalogOf(
      plainTownSettings,
      pricedLevels.map((line) =>
        line.building === 'factory' && line.level === 1 ? { ...line, people: 40 } : line,
      ),
    )

    const refused = await startIn({}, ['factory'], crowdedFactory)

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeople', requiredPeople: 40, freePeople: 26 },
    })
  })

  it('admits work that leaves exactly zero free people', async () => {
    const fullFactory = townCatalogOf(
      plainTownSettings,
      pricedLevels.map((line) =>
        line.building === 'factory' && line.level === 1 ? { ...line, people: 26 } : line,
      ),
    )

    const started = await startIn({}, ['factory'], fullFactory)

    assert(started.ok)
    expect(started.value.workSlot).toEqual({
      kind: 'busy',
      building: 'factory',
      level: 1,
      cost: { money: 50, food: 20, power: 0, material: 100 },
      startedAt: now,
      finishesAt: secondsAfter(now, 60),
    })
  })

  it('counts the people the hires occupy against new work', async () => {
    const refused = await startIn({ hires: { worker: 26, truck: 0 } }, ['farm'])

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeople', requiredPeople: 2, freePeople: 0 },
    })
  })

  it('refuses work above the top level of the content', async () => {
    const refused = await startIn({ buildingLevels: { homes: 2 } }, ['homes'])

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'TopLevelReached', building: 'homes', level: 2 },
    })
  })

  it('refuses work the stocks cannot pay', async () => {
    const refused = await startIn({ stocks: { money: 0, food: 0, power: 0, material: 0 } }, [
      'farm',
    ])

    expect(refused).toEqual({
      ok: false,
      error: {
        kind: 'NotEnoughResources',
        missing: { money: 38, food: 15, power: 0, material: 100 },
      },
    })
  })

  it('refuses level 3 with 9 stable words', async () => {
    const refused = await startIn({ buildingLevels: { homes: 2 } }, ['homes'], tallHomesCatalog, [
      ...stableCardsOf(9),
      ...learningCardsOf(6),
    ])

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughWords', needed: 10, held: 9, standing: 'stable' },
    })
  })

  it('admits level 3 with 10 stable words', async () => {
    const started = await startIn(
      { buildingLevels: { homes: 2 } },
      ['homes'],
      tallHomesCatalog,
      stableCardsOf(10),
    )

    assert(started.ok && started.value.workSlot.kind === 'busy')
    expect([started.value.workSlot.building, started.value.workSlot.level]).toEqual(['homes', 3])
  })

  it('refuses level 7 with 50 stable words of which 49 are retained', async () => {
    const refused = await startIn({ buildingLevels: { homes: 6 } }, ['homes'], tallHomesCatalog, [
      ...retainedCardsOf(49),
      ...stableCardsOf(1),
    ])

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughWords', needed: 50, held: 49, standing: 'retained' },
    })
  })

  it('admits levels 1 and 2 with no card', async () => {
    const started = await startIn({}, ['farm', 'farm'])

    assert(started.ok && started.value.workSlot.kind === 'busy')
    expect([
      started.value.workSlot.level,
      started.value.waitingList.map(({ building, level }) => [building, level]),
    ]).toEqual([1, [['farm', 2]]])
  })

  it("reads the need of the waiting list's next level", async () => {
    const refused = await startIn({}, ['homes', 'homes'], tallHomesCatalog, stableCardsOf(9))

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughWords', needed: 10, held: 9, standing: 'stable' },
    })
  })

  it('refuses too few people before too few words', async () => {
    const crowdedHomes = townCatalogOf(
      plainTownSettings,
      homesUpToSeven.map((line) =>
        line.building === 'homes' && line.level === 3 ? { ...line, people: 100 } : line,
      ),
    )

    const refused = await startIn({ buildingLevels: { homes: 2 } }, ['homes'], crowdedHomes)

    expect(refused).toMatchObject({ ok: false, error: { kind: 'NotEnoughPeople' } })
  })

  it('refuses too few words before too few resources', async () => {
    const refused = await startIn(
      { buildingLevels: { homes: 2 }, stocks: { money: 0, food: 0, power: 0, material: 0 } },
      ['homes'],
      tallHomesCatalog,
    )

    expect(refused).toEqual({
      ok: false,
      error: { kind: 'NotEnoughWords', needed: 10, held: 0, standing: 'stable' },
    })
  })

  it('charges and stores nothing when refused', async () => {
    const seeded = townOf({ stocks: startingStocks, storedAt, buildingLevels: { homes: 2 } })
    const towns = inMemoryTowns([seeded])
    const news = inMemoryTownNews()

    const refused = await startBuildingWork(
      { playerId: 'player-1', building: 'homes' },
      {
        towns,
        news,
        cards: inMemoryCards([]),
        catalog: tallHomesCatalog,
        clock: frozenClock,
      },
    )

    expect([refused, towns.storedTownOf('player-1'), news.recordedEventsOf(seeded.id)]).toEqual([
      { ok: false, error: { kind: 'NotEnoughWords', needed: 10, held: 0, standing: 'stable' } },
      seeded,
      [],
    ])
  })

  it('refuses a player who holds no town', async () => {
    const refused = await startBuildingWork(
      { playerId: 'stranger', building: 'farm' },
      {
        towns: inMemoryTowns([]),
        news: inMemoryTownNews(),
        cards: inMemoryCards([]),
        catalog: pricedCatalog,
        clock: frozenClock,
      },
    )

    expect(refused).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'stranger' } })
  })
})
