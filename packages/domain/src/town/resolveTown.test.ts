import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { WaitingWork, WorkSlot } from './BuildingWork'
import type { Job } from './Job'
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

const fieldsJob: Job = {
  kind: 'out',
  site: { region: 1, area: 1, site: 5 },
  team: { worker: 4, truck: 1 },
  hours: 1,
  sentAt: storedAt,
  oneWaySeconds: 1_800,
  pay: { money: 0, food: 30, power: 0, material: 30 },
  payPercent: { money: 100, food: 100, power: 100, material: 100 },
}

const jobTown = (job: Job, workSlot?: WorkSlot): ReturnType<typeof townOf> =>
  townOf({
    stocks: { money: 0, food: 1000, power: 0, material: 0 },
    storedAt,
    hires: { worker: 4, truck: 1 },
    jobSlot: job,
    ...(workSlot === undefined ? {} : { workSlot }),
  })

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

  it('credits the pay at the return even above storage', async () => {
    const { towns } = await resolvedAt(minutesAfterEpoch(240), jobTown(fieldsJob))

    const stored = towns.storedTownOf('player-1')
    assert(stored !== undefined)
    expect([stored.stocks, stored.storedAt, stored.jobSlot, stored.fullSince.food]).toEqual([
      { money: 24, food: 1030, power: 0, material: 30 },
      minutesAfterEpoch(180),
      { kind: 'idle' },
      storedAt,
    ])
  })

  it('writes the job back and called back events', async () => {
    const calledBack = { ...fieldsJob, calledBackAt: minutesAfterEpoch(70) }
    const outcomes = await Promise.all([
      resolvedAt(minutesAfterEpoch(240), jobTown(fieldsJob)),
      resolvedAt(minutesAfterEpoch(240), jobTown(calledBack)),
    ])

    expect(outcomes.map(({ news }) => news.recordedEventsOf('town-1'))).toEqual([
      [
        {
          kind: 'jobBack',
          site: fieldsJob.site,
          pay: fieldsJob.pay,
          occurredAt: minutesAfterEpoch(180),
        },
      ],
      [
        {
          kind: 'jobCalledBack',
          site: fieldsJob.site,
          pay: fieldsJob.pay,
          occurredAt: minutesAfterEpoch(80),
        },
      ],
    ])
  })

  it('applies the building work finished by the return first and the rest after it', async () => {
    const outcomes = await Promise.all([
      resolvedAt(
        minutesAfterEpoch(240),
        jobTown(fieldsJob, busySlot('farm', 1, minutesAfterEpoch(180))),
      ),
      resolvedAt(
        minutesAfterEpoch(240),
        jobTown(fieldsJob, busySlot('farm', 1, minutesAfterEpoch(200))),
      ),
    ])

    expect(
      outcomes.map(({ news }) => news.recordedEventsOf('town-1').map(({ kind }) => kind)),
    ).toEqual([
      ['buildingWorkFinished', 'jobBack'],
      ['jobBack', 'buildingWorkFinished'],
    ])
  })

  it('leaves a job not yet home out and saves nothing', async () => {
    const town = jobTown(fieldsJob)

    const { towns } = await resolvedAt(minutesAfterEpoch(179), town)

    expect(towns.storedTownOf('player-1')).toBe(town)
  })
})
