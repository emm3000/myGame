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
})
