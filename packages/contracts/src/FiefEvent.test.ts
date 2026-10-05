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
      units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: false,
    }

    expect(FiefEventSchema.parse(returned)).toEqual(returned)
  })

  it('rejects a march-returned event with no unit', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: false,
    }

    expect(FiefEventSchema.safeParse(returned).success).toBe(false)
  })

  it('accepts a return event with riders', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      units: { infantry: 12, cavalry: 6, archer: 0, settler: 0 },
      loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
      recalled: false,
    }

    expect(FiefEventSchema.parse(returned)).toEqual(returned)
  })

  it('rejects a return event that still counts infantry alone', () => {
    const returned = {
      kind: 'marchReturned',
      province: 2,
      plot: 7,
      infantry: 12,
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
      units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
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
      units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
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
      units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
      loot: { wood: 72, stone: 72, iron: 0, gold: 0, food: 0 },
      occurredAt: '2026-09-22T09:30:00.000Z',
    }

    expect(FiefEventSchema.safeParse(returned).success).toBe(false)
  })
  it('accepts a battle event', () => {
    const battle = {
      kind: 'battleFought',
      province: 2,
      plot: 7,
      tier: 1,
      won: true,
      unitsLost: { infantry: 3, cavalry: 0, archer: 0, settler: 0 },
      campLost: 6,
      occurredAt: '2026-09-22T09:15:00.000Z',
    }

    expect(FiefEventSchema.parse(battle)).toEqual(battle)
  })

  it('accepts a battle that lost riders beside infantry', () => {
    const battle = {
      kind: 'battleFought',
      province: 2,
      plot: 7,
      tier: 1,
      won: true,
      unitsLost: { infantry: 2, cavalry: 2, archer: 0, settler: 0 },
      campLost: 6,
      occurredAt: '2026-09-22T09:15:00.000Z',
    }

    expect(FiefEventSchema.parse(battle)).toEqual(battle)
  })

  it('accepts a battle that lost no one', () => {
    const battle = {
      kind: 'battleFought',
      province: 2,
      plot: 7,
      tier: 1,
      won: true,
      unitsLost: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
      campLost: 0,
      occurredAt: '2026-09-22T09:15:00.000Z',
    }

    expect(FiefEventSchema.parse(battle)).toEqual(battle)
  })

  it('rejects a battle event of tier 4', () => {
    const battle = {
      kind: 'battleFought',
      province: 2,
      plot: 7,
      tier: 4,
      won: true,
      unitsLost: { infantry: 3, cavalry: 0, archer: 0, settler: 0 },
      campLost: 6,
      occurredAt: '2026-09-22T09:15:00.000Z',
    }

    expect(FiefEventSchema.safeParse(battle).success).toBe(false)
  })

  it('rejects a battle event without its outcome', () => {
    const battle = {
      kind: 'battleFought',
      province: 2,
      plot: 7,
      tier: 2,
      unitsLost: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
      campLost: 10,
      occurredAt: '2026-09-22T09:15:00.000Z',
    }

    expect(FiefEventSchema.safeParse(battle).success).toBe(false)
  })
  it('accepts a fief founded event', () => {
    const founded = {
      kind: 'fiefFounded',
      province: 2,
      plot: 7,
      name: 'Sotoverde del Páramo',
      occurredAt: '2026-09-22T18:40:00.000Z',
    }

    expect(FiefEventSchema.parse(founded)).toEqual(founded)
  })

  it('rejects a founding sent without a name', () => {
    const sents = [
      { kind: 'foundingSent', province: 2, plot: 7, occurredAt: '2026-09-22T18:25:00.000Z' },
      {
        kind: 'foundingSent',
        province: 2,
        plot: 7,
        name: '',
        occurredAt: '2026-09-22T18:25:00.000Z',
      },
    ]

    expect(sents.map((sent) => FiefEventSchema.safeParse(sent).success)).toEqual([false, false])
  })

  it('accepts a transport sent event', () => {
    const sent = {
      kind: 'transportSent',
      province: 2,
      plot: 7,
      name: 'Sotoverde del Páramo',
      cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
      occurredAt: '2026-09-22T18:40:00.000Z',
    }

    expect(FiefEventSchema.parse(sent)).toEqual(sent)
  })

  it('rejects a cargo arrived without its cargo', () => {
    const arrivals = [
      {
        kind: 'transportArrived',
        province: 3,
        plot: 12,
        name: 'Sotoverde',
        occurredAt: '2026-09-22T18:47:30.000Z',
      },
      {
        kind: 'transportArrived',
        province: 3,
        plot: 12,
        name: 'Sotoverde',
        loot: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
        occurredAt: '2026-09-22T18:47:30.000Z',
      },
    ]

    expect(arrivals.map((arrival) => FiefEventSchema.safeParse(arrival).success)).toEqual([
      false,
      false,
    ])
  })
})
