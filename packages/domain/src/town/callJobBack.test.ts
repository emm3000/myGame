import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { callJobBack } from './callJobBack'
import type { Job, JobSlot } from './Job'
import { jobInstantsOf } from './jobInstantsOf'
import type { Town } from './Town'

const MILLISECONDS_PER_SECOND = 1_000

const MILLISECONDS_PER_DAY = 86_400_000

const sentAt = Instant.fromEpochMilliseconds(
  plainTownSettings.seasons.epoch.epochMilliseconds + 2 * MILLISECONDS_PER_DAY,
)

const secondsAfterSent = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(sentAt.epochMilliseconds + seconds * MILLISECONDS_PER_SECOND)

const stocks = { money: 100, food: 100, power: 100, material: 100 }

const fieldsJob: Job = {
  kind: 'out',
  site: { region: 1, area: 1, site: 5 },
  team: { worker: 4, truck: 1 },
  hours: 2,
  sentAt,
  oneWaySeconds: 600,
  pay: { money: 0, food: 30, power: 0, material: 30 },
  payPercent: { money: 100, food: 100, power: 100, material: 100 },
}

const townWith = (jobSlot: JobSlot): Town =>
  townOf({ stocks, storedAt: sentAt, hires: { worker: 6, truck: 2 }, jobSlot })

const callBack = async (
  town: Town,
  at: Instant,
  named: Instant = sentAt,
): Promise<{
  readonly called: Awaited<ReturnType<typeof callJobBack>>
  readonly towns: ReturnType<typeof inMemoryTowns>
  readonly news: ReturnType<typeof inMemoryTownNews>
}> => {
  const frozenClock: Clock = { now: () => at }
  const towns = inMemoryTowns([town])
  const news = inMemoryTownNews()
  const called = await callJobBack(
    { playerId: 'player-1', sentAt: named },
    { towns, news, catalog: townCatalogOf(), clock: frozenClock },
  )
  return { called, towns, news }
}

const outcomeOf = ({ called }: Awaited<ReturnType<typeof callBack>>): unknown =>
  called.ok ? 'called back' : called.error

describe('callJobBack', () => {
  it('calls a job back with the partial pay of ADR 019', async () => {
    const calledBackAt = secondsAfterSent(600 + 1_800)

    const { towns } = await callBack(townWith(fieldsJob), calledBackAt)

    const stored = towns.storedTownOf('player-1')
    assert(stored !== undefined && stored.jobSlot.kind === 'out')
    expect([stored.jobSlot, jobInstantsOf(stored.jobSlot)]).toEqual([
      { ...fieldsJob, calledBackAt, pay: { money: 0, food: 7, power: 0, material: 7 } },
      {
        arrivesAt: secondsAfterSent(600),
        leavesAt: calledBackAt,
        returnsAt: secondsAfterSent(600 + 1_800 + 600),
      },
    ])
  })

  it('pays nothing for a job called back on its way out and returns it as far as it went', async () => {
    const calledBackAt = secondsAfterSent(300)

    const { called } = await callBack(townWith(fieldsJob), calledBackAt)

    assert(called.ok && called.value.jobSlot.kind === 'out')
    expect([called.value.jobSlot.pay, jobInstantsOf(called.value.jobSlot).returnsAt]).toEqual([
      { money: 0, food: 0, power: 0, material: 0 },
      secondsAfterSent(600),
    ])
  })

  it("keeps the dispatch's pay percent whatever the season at the call back", async () => {
    const halfFood = {
      ...fieldsJob,
      payPercent: { money: 100, food: 50, power: 100, material: 100 },
    }

    const { called } = await callBack(townWith(halfFood), secondsAfterSent(600 + 1_800))

    assert(called.ok && called.value.jobSlot.kind === 'out')
    expect(called.value.jobSlot.pay).toEqual({ money: 0, food: 3, power: 0, material: 7 })
  })

  it('moves no stock and writes no event at the call back', async () => {
    const { towns, news } = await callBack(townWith(fieldsJob), secondsAfterSent(600 + 1_800))

    const stored = towns.storedTownOf('player-1')
    assert(stored !== undefined)
    expect([stored.stocks, stored.storedAt, news.recordedEventsOf('town-1')]).toEqual([
      stocks,
      sentAt,
      [],
    ])
  })

  it('refuses a job sent at another instant or no job at all', async () => {
    const outcomes = await Promise.all([
      callBack(townWith(fieldsJob), secondsAfterSent(60), secondsAfterSent(1)),
      callBack(townWith({ kind: 'idle' }), secondsAfterSent(60)),
    ])

    expect(outcomes.map(outcomeOf)).toEqual([
      { kind: 'JobNotFound', sentAt: secondsAfterSent(1) },
      { kind: 'JobNotFound', sentAt },
    ])
  })

  it('refuses a job already on its way home', async () => {
    const calledBack = { ...fieldsJob, calledBackAt: secondsAfterSent(60) }
    const outcomes = await Promise.all([
      callBack(townWith(fieldsJob), secondsAfterSent(600 + 7_200)),
      callBack(townWith(calledBack), secondsAfterSent(90)),
    ])

    expect(outcomes.map(outcomeOf)).toEqual([
      { kind: 'JobAlreadyReturning' },
      { kind: 'JobAlreadyReturning' },
    ])
  })

  it('refuses a job the read finds back home', async () => {
    const outcome = await callBack(townWith(fieldsJob), secondsAfterSent(600 + 7_200 + 600))

    expect(outcomeOf(outcome)).toEqual({ kind: 'JobNotFound', sentAt })
  })

  it('writes nothing when it refuses', async () => {
    const town = townWith(fieldsJob)

    const { towns } = await callBack(town, secondsAfterSent(600 + 7_200))

    expect(towns.storedTownOf('player-1')).toBe(town)
  })
})
