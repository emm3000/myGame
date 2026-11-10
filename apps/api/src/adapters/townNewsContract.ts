import { Instant, type TownEvent, type TownId, type TownNews } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { TownNewsReader } from '../town/TownNewsReader'

type TownNewsStore = TownNews & TownNewsReader

export type TownNewsFixture = {
  readonly news: TownNewsStore
  readonly registerTowns: (townIds: ReadonlyArray<TownId>) => Promise<void>
  readonly recordThenRollBack: (townId: TownId, events: ReadonlyArray<TownEvent>) => Promise<void>
}

const maple = '00000000-0000-4000-8000-00000000000a'
const birch = '00000000-0000-4000-8000-00000000000b'

const at = (time: string): Instant =>
  Instant.fromEpochMilliseconds(Date.parse(`2026-11-05T${time}Z`))

const finishedHomes = (time: string): TownEvent => ({
  kind: 'buildingWorkFinished',
  building: 'homes',
  level: 2,
  occurredAt: at(time),
})

const finishedHomesAtMinute = (minute: number): TownEvent => ({
  kind: 'buildingWorkFinished',
  building: 'homes',
  level: 2,
  occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-05T00:00:00Z') + minute * 60_000),
})

const everyKind: ReadonlyArray<TownEvent> = [
  { kind: 'buildingWorkFinished', building: 'powerStation', level: 3, occurredAt: at('08:00:00') },
  {
    kind: 'buildingWorkStopped',
    building: 'factory',
    level: 2,
    refund: { money: 60, food: 0, power: 15, material: 120 },
    occurredAt: at('08:01:00'),
  },
  { kind: 'lessonStudied', lessonId: 'lesson-1', occurredAt: at('08:02:00') },
  { kind: 'lessonStopped', lessonId: 'lesson-2', occurredAt: at('08:03:00') },
  {
    kind: 'skillEarned',
    lessonId: 'lesson-1',
    resource: 'food',
    ratePercent: 5,
    occurredAt: at('08:04:00'),
  },
  { kind: 'hiringDelivered', hire: 'worker', count: 4, occurredAt: at('08:05:00') },
  {
    kind: 'hiringStopped',
    hire: 'truck',
    delivered: 1,
    stopped: 2,
    refund: { money: 200, food: 0, power: 0, material: 80 },
    occurredAt: at('08:06:00'),
  },
  {
    kind: 'jobBack',
    site: { region: 1, area: 2, site: 3 },
    pay: { money: 90, food: 10, power: 0, material: 0 },
    occurredAt: at('08:07:00'),
  },
  {
    kind: 'jobCalledBack',
    site: { region: 1, area: 2, site: 4 },
    pay: { money: 30, food: 0, power: 0, material: 0 },
    occurredAt: at('08:08:00'),
  },
  {
    kind: 'cleanUpDone',
    site: { region: 1, area: 3, site: 1 },
    reward: { money: 0, food: 0, power: 40, material: 70 },
    occurredAt: at('08:09:00'),
  },
  { kind: 'cleanUpFailed', site: { region: 1, area: 3, site: 2 }, occurredAt: at('08:10:00') },
  { kind: 'becameCity', occurredAt: at('08:11:00') },
]

export const townNewsContract = (
  adapterName: string,
  arrange: () => Promise<TownNewsFixture>,
): void => {
  describe(`${adapterName} as Town News`, () => {
    it('reads back every kind of town event', async () => {
      const { news, registerTowns } = await arrange()
      await registerTowns([maple])

      await news.record(maple, everyKind)

      expect(await news.newsOf(maple)).toEqual([...everyKind].reverse())
    })

    it("reads a town's events newest first", async () => {
      const { news, registerTowns } = await arrange()
      await registerTowns([maple])
      await news.record(maple, [
        finishedHomes('09:00:00'),
        { kind: 'becameCity', occurredAt: at('09:00:00') },
      ])
      await news.record(maple, [finishedHomes('07:00:00')])

      expect(await news.newsOf(maple)).toEqual([
        { kind: 'becameCity', occurredAt: at('09:00:00') },
        finishedHomes('09:00:00'),
        finishedHomes('07:00:00'),
      ])
    })

    it('reads the events after an instant', async () => {
      const { news, registerTowns } = await arrange()
      await registerTowns([maple])
      await news.record(maple, [
        finishedHomes('07:00:00'),
        finishedHomes('08:00:00'),
        finishedHomes('09:00:00'),
      ])

      expect(await news.newsAfter(maple, at('08:00:00'))).toEqual([finishedHomes('09:00:00')])
    })

    it('reads only the events of the town asked', async () => {
      const { news, registerTowns } = await arrange()
      await registerTowns([maple, birch])
      await news.record(birch, [finishedHomes('07:00:00')])

      expect(await news.newsOf(maple)).toEqual([])
    })

    it('keeps the latest 100 events of a town', async () => {
      const { news, registerTowns } = await arrange()
      await registerTowns([maple])
      const events = Array.from({ length: 101 }, (_, minute) => finishedHomesAtMinute(minute))

      await news.record(maple, events)

      expect(await news.newsOf(maple)).toEqual(events.slice(1).reverse())
    })

    it('keeps the latest 100 events across records', async () => {
      const { news, registerTowns } = await arrange()
      await registerTowns([maple])
      const events = Array.from({ length: 101 }, (_, minute) => finishedHomesAtMinute(minute))

      for (const event of events) {
        await news.record(maple, [event])
      }

      expect(await news.newsOf(maple)).toEqual(events.slice(1).reverse())
    })

    it('rolls an event back with the transaction that wrote it', async () => {
      const { news, registerTowns, recordThenRollBack } = await arrange()
      await registerTowns([maple])
      await news.record(maple, [finishedHomes('07:00:00')])

      await recordThenRollBack(maple, [finishedHomes('08:00:00')])

      expect(await news.newsOf(maple)).toEqual([finishedHomes('07:00:00')])
    })
  })
}
