import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { WaitingWork, WorkSlot } from './BuildingWork'
import { resolveTown } from './resolveTown'

const MILLISECONDS_PER_MINUTE = 60_000

const minutesAfterEpoch = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE,
  )

const storedAt = minutesAfterEpoch(60)

const noCost = { money: 0, food: 0, power: 0, material: 0 }

const busySlot = (building: 'farm' | 'homes', level: number, finishesAt: Instant): WorkSlot => ({
  kind: 'busy',
  building,
  level,
  cost: noCost,
  startedAt: storedAt,
  finishesAt,
})

const waitingFactory: WaitingWork = {
  building: 'factory',
  level: 1,
  cost: noCost,
  durationSeconds: 600,
}

const resolvedAt = async (
  now: Instant,
  town: ReturnType<typeof townOf>,
): Promise<{
  readonly resolved: Awaited<ReturnType<typeof resolveTown>>
  readonly towns: ReturnType<typeof inMemoryTowns>
  readonly news: ReturnType<typeof inMemoryTownNews>
}> => {
  const frozenClock: Clock = { now: () => now }
  const towns = inMemoryTowns([town])
  const news = inMemoryTownNews()
  const resolved = await resolveTown('player-1', {
    towns,
    news,
    catalog: townCatalogOf(),
    clock: frozenClock,
  })
  return { resolved, towns, news }
}

describe('resolveTown', () => {
  it('applies a finished level on the next read and re-bases the stocks', async () => {
    const finishedAt = minutesAfterEpoch(90)
    const farmingTown = townOf({
      stocks: { money: 400, food: 300, power: 200, material: 500 },
      storedAt,
      workSlot: busySlot('farm', 1, finishedAt),
    })

    const { towns } = await resolvedAt(minutesAfterEpoch(150), farmingTown)

    const stored = towns.storedTownOf('player-1')
    assert(stored !== undefined)
    expect([stored.buildingLevels.farm, stored.workSlot, stored.stocks, stored.storedAt]).toEqual([
      1,
      { kind: 'idle' },
      { money: 406, food: 302, power: 200, material: 500 },
      finishedAt,
    ])
  })

  it('starts the next waiting work at the finish of the one before', async () => {
    const finishedAt = minutesAfterEpoch(90)
    const farmingTown = townOf({
      storedAt,
      workSlot: busySlot('farm', 1, finishedAt),
      waitingList: [waitingFactory],
    })

    const { resolved } = await resolvedAt(minutesAfterEpoch(95), farmingTown)

    assert(resolved.ok)
    expect([resolved.value.town.workSlot, resolved.value.town.waitingList]).toEqual([
      {
        kind: 'busy',
        building: 'factory',
        level: 1,
        cost: noCost,
        startedAt: finishedAt,
        finishesAt: minutesAfterEpoch(100),
      },
      [],
    ])
  })

  it('writes the city event when a finished level makes the town a city', async () => {
    const finishedAt = minutesAfterEpoch(90)
    const growingTown = townOf({ storedAt, workSlot: busySlot('homes', 2, finishedAt) })

    const { news } = await resolvedAt(minutesAfterEpoch(95), growingTown)

    expect(news.recordedEventsOf('town-1')).toEqual([
      { kind: 'buildingWorkFinished', building: 'homes', level: 2, occurredAt: finishedAt },
      { kind: 'becameCity', occurredAt: finishedAt },
    ])
  })

  it('saves nothing while the work is still underway', async () => {
    const busyTown = townOf({ storedAt, workSlot: busySlot('farm', 1, minutesAfterEpoch(90)) })

    const { resolved, news } = await resolvedAt(minutesAfterEpoch(80), busyTown)

    assert(resolved.ok)
    expect([resolved.value.events, news.recordedEventsOf('town-1')]).toEqual([[], []])
  })
})
