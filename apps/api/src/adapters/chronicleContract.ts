import {
  type ChronicleWriter,
  type FiefEvent,
  type FiefId,
  Instant,
  ok,
  type Stocks,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { type ChronicleReader, keptEventsPerFief } from '../fief/ChronicleReader'

export type ChronicleFixture = {
  readonly chronicle: ChronicleWriter & ChronicleReader
  readonly registerFiefs: (fiefIds: ReadonlyArray<FiefId>) => Promise<void>
}

const valdehierro = '00000000-0000-4000-8000-00000000000a'
const robledal = '00000000-0000-4000-8000-00000000000b'

const minutesAfterDawn = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z') + minutes * 60_000)

const woodOnly = (wood: number): Stocks => ({ wood, stone: 0, iron: 0, gold: 0, food: 0 })

const sawmillFinishedAt = (minutes: number): FiefEvent => ({
  kind: 'upgradeFinished',
  building: 'sawmill',
  level: 1,
  occurredAt: minutesAfterDawn(minutes),
})

const sawmillLevelsFinishedOver = (count: number): ReadonlyArray<FiefEvent> =>
  Array.from({ length: count }, (_, minute) => ({
    kind: 'upgradeFinished',
    building: 'sawmill',
    level: minute + 1,
    occurredAt: minutesAfterDawn(minute),
  }))

export const chronicleContract = (
  adapter: string,
  arrange: () => Promise<ChronicleFixture>,
): void => {
  describe(`${adapter} as a chronicle`, () => {
    it('reads an empty chronicle for a fief without events', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([])
    })

    it('restores every kind of event with its payload', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const everyKind: ReadonlyArray<FiefEvent> = [
        {
          kind: 'studyCancelled',
          art: 'masonry',
          level: 2,
          occurredAt: minutesAfterDawn(40),
          refund: { wood: 80, stone: 120, iron: 0, gold: 35, food: 0 },
        },
        {
          kind: 'upgradeCancelled',
          building: 'ironMine',
          level: 3,
          occurredAt: minutesAfterDawn(30),
          refund: { wood: 360, stone: 270, iron: 90, gold: 20, food: 45 },
        },
        { kind: 'artLearned', art: 'smithing', level: 1, occurredAt: minutesAfterDawn(20) },
        {
          kind: 'upgradeFinished',
          building: 'library',
          level: 2,
          occurredAt: minutesAfterDawn(10),
        },
      ]

      await chronicle.record(valdehierro, [...everyKind].reverse())

      expect(await chronicle.eventsOf(valdehierro)).toEqual(everyKind)
    })

    it('reads back a recruits-delivered event', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const delivered: FiefEvent = {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 12,
        occurredAt: minutesAfterDawn(18),
      }

      await chronicle.record(valdehierro, [delivered])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([delivered])
    })

    it('reads back the riders a levy delivered and cancelled', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const delivered: FiefEvent = {
        kind: 'recruitsDelivered',
        unit: 'cavalry',
        count: 6,
        occurredAt: minutesAfterDawn(30),
      }
      const cancelled: FiefEvent = {
        kind: 'recruitsCancelled',
        unit: 'cavalry',
        delivered: 1,
        cancelled: 2,
        occurredAt: minutesAfterDawn(20),
        refund: { wood: 60, stone: 0, iron: 80, gold: 40, food: 160 },
      }

      await chronicle.record(valdehierro, [cancelled, delivered])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([delivered, cancelled])
    })

    it('reads back a recruits-cancelled event', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const cancelled: FiefEvent = {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 2,
        cancelled: 3,
        occurredAt: minutesAfterDawn(25),
        refund: { wood: 60, stone: 0, iron: 30, gold: 0, food: 90 },
      }

      await chronicle.record(valdehierro, [cancelled])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([cancelled])
    })

    it('reads back a march-returned event', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const returned: FiefEvent = {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 10, cavalry: 0 },
        loot: { wood: 240, stone: 240, iron: 0, gold: 0, food: 0 },
        recalled: false,
        occurredAt: minutesAfterDawn(40),
      }

      await chronicle.record(valdehierro, [returned])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([returned])
    })

    it('reads back a recalled march-returned event', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const recalled: FiefEvent = {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 12, cavalry: 0 },
        loot: { wood: 11, stone: 11, iron: 0, gold: 0, food: 0 },
        recalled: true,
        occurredAt: minutesAfterDawn(55),
      }

      await chronicle.record(valdehierro, [recalled])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([recalled])
    })

    it('reads back a battle event', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const fought: FiefEvent = {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 2,
        won: true,
        unitsLost: { infantry: 4, cavalry: 0 },
        campLost: 15,
        occurredAt: minutesAfterDawn(20),
      }

      await chronicle.record(valdehierro, [fought])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([fought])
    })

    it('reads back a return with riders', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const returned: FiefEvent = {
        kind: 'marchReturned',
        province: 2,
        plot: 7,
        units: { infantry: 12, cavalry: 6 },
        loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
        recalled: false,
        occurredAt: minutesAfterDawn(40),
      }

      await chronicle.record(valdehierro, [returned])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([returned])
    })

    it('reads back a battle that lost riders', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const fought: FiefEvent = {
        kind: 'battleFought',
        province: 2,
        plot: 7,
        tier: 1,
        won: true,
        unitsLost: { infantry: 2, cavalry: 2 },
        campLost: 6,
        occurredAt: minutesAfterDawn(20),
      }

      await chronicle.record(valdehierro, [fought])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([fought])
    })

    it('reads back a recruits-cancelled event with no unit delivered', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const cancelled: FiefEvent = {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 0,
        cancelled: 12,
        occurredAt: minutesAfterDawn(3),
        refund: { wood: 240, stone: 0, iron: 120, gold: 0, food: 360 },
      }

      await chronicle.record(valdehierro, [cancelled])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([cancelled])
    })

    it('answers the events newest first', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const cancelledFirst: FiefEvent = {
        kind: 'upgradeCancelled',
        building: 'sawmill',
        level: 2,
        occurredAt: minutesAfterDawn(30),
        refund: woodOnly(20),
      }
      const cancelledInCascade: FiefEvent = { ...cancelledFirst, level: 3, refund: woodOnly(300) }

      await chronicle.record(valdehierro, [sawmillFinishedAt(20)])
      await chronicle.record(valdehierro, [cancelledFirst, cancelledInCascade])
      await chronicle.record(valdehierro, [sawmillFinishedAt(10)])

      expect(await chronicle.eventsOf(valdehierro)).toEqual([
        cancelledInCascade,
        cancelledFirst,
        sawmillFinishedAt(20),
        sawmillFinishedAt(10),
      ])
    })

    it('keeps only the latest hundred events of a fief', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])
      const events = sawmillLevelsFinishedOver(keptEventsPerFief + 1)

      await chronicle.record(valdehierro, events.slice(0, keptEventsPerFief))
      await chronicle.record(valdehierro, events.slice(keptEventsPerFief))

      expect(await chronicle.eventsOf(valdehierro)).toEqual([...events.slice(1)].reverse())
    })

    it('keeps the events of another fief when it prunes', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro, robledal])
      await chronicle.record(robledal, [sawmillFinishedAt(-10)])

      await chronicle.record(valdehierro, sawmillLevelsFinishedOver(keptEventsPerFief + 1))

      expect(await chronicle.eventsOf(robledal)).toEqual([sawmillFinishedAt(-10)])
    })

    it('records nothing when handed no events', async () => {
      const { chronicle, registerFiefs } = await arrange()
      await registerFiefs([valdehierro])

      const recorded = await chronicle.record(valdehierro, [])

      expect([recorded, await chronicle.eventsOf(valdehierro)]).toEqual([ok(undefined), []])
    })
  })
}
