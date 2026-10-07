import type { FiefOverview } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { knownFief } from '../auth/stubApiClient.testSupport'
import { liveFiefAt } from './liveFief'
import { repaintDelayMsOf } from './repaintDelayMsOf'

const instantAfterRead = (seconds: number): string =>
  new Date(Date.parse(knownFief.readAt) + seconds * 1000).toISOString()

const repaintDelayAtRead = (overview: FiefOverview): number =>
  repaintDelayMsOf(liveFiefAt(overview, 0))

const slotFinishingIn = (seconds: number): FiefOverview => ({
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: instantAfterRead(-600),
    finishesAt: instantAfterRead(seconds),
  },
})

it('repaints once a minute with nothing finishing within the hour', () => {
  expect(repaintDelayAtRead(knownFief)).toBe(60_000)
})

it('repaints every second in a slot last minute', () => {
  expect(repaintDelayAtRead(slotFinishingIn(42))).toBe(1000)
})

it('repaints when a slot enters its last minute', () => {
  expect(repaintDelayAtRead(slotFinishingIn(90))).toBe(30_000)
})

it('repaints once at the next unit of a levy, not every second', () => {
  const levy: FiefOverview = {
    ...knownFief,
    units: { infantry: 5, cavalry: 0, archer: 0, settler: 0 },
    recruitOrder: {
      unit: 'infantry',
      count: 12,
      delivered: 5,
      perUnitSeconds: 34,
      startedAt: instantAfterRead(-180),
      endsAt: instantAfterRead(228),
    },
  }

  expect(repaintDelayAtRead(levy)).toBe(24_000)
})

it('repaints once at a forage arrival, not every second', () => {
  const forageArriving: FiefOverview = {
    ...knownFief,
    units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
    march: {
      order: 'forage',
      province: 2,
      plot: 7,
      terrain: 'uplands',
      units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
      stayHours: 2,
      departedAt: instantAfterRead(-860),
      oneWaySeconds: 900,
      loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      arrivesAt: instantAfterRead(40),
      leavesAt: instantAfterRead(7240),
      returnsAt: instantAfterRead(8140),
      recalledAt: null,
      camp: null,
      fought: false,
    },
  }

  expect(repaintDelayAtRead(forageArriving)).toBe(40_000)
})
