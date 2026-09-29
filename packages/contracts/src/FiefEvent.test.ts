import { describe, expect, it } from 'vitest'
import { FiefEventSchema } from './index'

const refund = { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 }

describe('FiefEventSchema', () => {
  it('parses a cancel with the cost it refunded', () => {
    const cancel = {
      kind: 'upgradeCancelled',
      building: 'ironMine',
      level: 2,
      occurredAt: '2026-09-22T08:01:00.000Z',
      refund,
    }

    expect(FiefEventSchema.parse(cancel)).toEqual(cancel)
  })

  it('rejects a finish event that carries a refund', () => {
    const finishes = [
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 1,
        occurredAt: '2026-09-22T08:02:00.000Z',
        refund,
      },
      {
        kind: 'artLearned',
        art: 'smithing',
        level: 1,
        occurredAt: '2026-09-22T08:30:00.000Z',
        refund,
      },
    ]

    expect(finishes.map((finish) => FiefEventSchema.safeParse(finish).success)).toEqual([
      false,
      false,
    ])
  })

  it('rejects an event that names neither a building nor an art', () => {
    const events = [
      { kind: 'upgradeFinished', level: 1, occurredAt: '2026-09-22T08:02:00.000Z' },
      { kind: 'studyCancelled', level: 1, occurredAt: '2026-09-22T08:02:00.000Z', refund },
    ]

    expect(events.map((event) => FiefEventSchema.safeParse(event).success)).toEqual([false, false])
  })

  it('accepts a recruits-delivered event', () => {
    const delivered = {
      kind: 'recruitsDelivered',
      unit: 'infantry',
      count: 12,
      occurredAt: '2026-09-22T09:30:00.000Z',
    }

    expect(FiefEventSchema.parse(delivered)).toEqual(delivered)
  })

  it('rejects a recruits-delivered event of zero units', () => {
    const delivered = {
      kind: 'recruitsDelivered',
      unit: 'infantry',
      count: 0,
      occurredAt: '2026-09-22T09:30:00.000Z',
    }

    expect(FiefEventSchema.safeParse(delivered).success).toBe(false)
  })

  it('rejects a recruits-delivered event with a level', () => {
    const delivered = {
      kind: 'recruitsDelivered',
      unit: 'infantry',
      count: 12,
      level: 1,
      occurredAt: '2026-09-22T09:30:00.000Z',
    }

    expect(FiefEventSchema.safeParse(delivered).success).toBe(false)
  })

  it('accepts a recruits-cancelled event', () => {
    const cancelled = {
      kind: 'recruitsCancelled',
      unit: 'infantry',
      delivered: 4,
      cancelled: 8,
      occurredAt: '2026-09-22T09:30:00.000Z',
      refund: { wood: 160, stone: 0, iron: 80, gold: 0, food: 240 },
    }

    expect(FiefEventSchema.parse(cancelled)).toEqual(cancelled)
  })

  it('accepts a recruits-cancelled event with no unit delivered', () => {
    const cancelled = {
      kind: 'recruitsCancelled',
      unit: 'infantry',
      delivered: 0,
      cancelled: 12,
      occurredAt: '2026-09-22T09:30:00.000Z',
      refund: { wood: 240, stone: 0, iron: 120, gold: 0, food: 360 },
    }

    expect(FiefEventSchema.parse(cancelled)).toEqual(cancelled)
  })

  it('rejects a recruits-cancelled event that cancelled no unit', () => {
    const cancelled = {
      kind: 'recruitsCancelled',
      unit: 'infantry',
      delivered: 12,
      cancelled: 0,
      occurredAt: '2026-09-22T09:30:00.000Z',
      refund,
    }

    expect(FiefEventSchema.safeParse(cancelled).success).toBe(false)
  })

  it('rejects a recruits-cancelled event without a refund', () => {
    const cancelled = {
      kind: 'recruitsCancelled',
      unit: 'infantry',
      delivered: 4,
      cancelled: 8,
      occurredAt: '2026-09-22T09:30:00.000Z',
    }

    expect(FiefEventSchema.safeParse(cancelled).success).toBe(false)
  })

  it('accepts a march-returned event', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      infantry: 12,
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: false,
    }

    expect(FiefEventSchema.parse(returned)).toEqual(returned)
  })

  it('rejects a march-returned event with no infantry', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      infantry: 0,
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: false,
    }

    expect(FiefEventSchema.safeParse(returned).success).toBe(false)
  })

  it('rejects a march-returned event without its plot', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      infantry: 12,
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: false,
    }

    expect(FiefEventSchema.safeParse(returned).success).toBe(false)
  })
  it('accepts a recalled march-returned event', () => {
    const recalled = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      infantry: 12,
      loot: { wood: 18, stone: 18, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: true,
    }

    expect(FiefEventSchema.parse(recalled)).toEqual(recalled)
  })

  it('rejects a march-returned event without the recalled flag', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      infantry: 12,
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
    }

    expect(FiefEventSchema.safeParse(returned).success).toBe(false)
  })
})
