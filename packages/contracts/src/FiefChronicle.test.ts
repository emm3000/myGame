import { describe, expect, it } from 'vitest'
import { FiefChronicleSchema } from './index'

const finishAt = (minute: number) => ({
  kind: 'upgradeFinished',
  building: 'sawmill',
  level: 1,
  occurredAt: `2026-09-22T08:${String(minute % 60).padStart(2, '0')}:00.000Z`,
})

describe('FiefChronicleSchema', () => {
  it('parses a chronicle of a hundred events', () => {
    const events = Array.from({ length: 100 }, (_, minute) => finishAt(minute))

    expect(FiefChronicleSchema.safeParse({ events }).success).toBe(true)
  })

  it('rejects a chronicle longer than a hundred events', () => {
    const events = Array.from({ length: 101 }, (_, minute) => finishAt(minute))

    expect(FiefChronicleSchema.safeParse({ events }).success).toBe(false)
  })
})
