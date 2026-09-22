import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { materializeResources } from './materializeResources'
import type { Resources } from './Resources'

const storedAt = Instant.fromEpochMilliseconds(0)
const oneHourLater = Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + 3_600_000)

const oneResource = (stock: {
  amount: number
  ratePerHour: number
  capacityUnits: number
}): Resources => ({
  wood: stock,
  stone: stock,
  iron: stock,
  gold: stock,
  food: stock,
})

describe('materializeResources', () => {
  it('returns the stored amount when no time has passed', () => {
    const resources = oneResource({ amount: 100, ratePerHour: 10, capacityUnits: 1000 })

    const result = materializeResources(resources, storedAt, storedAt)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(100)
    expect(result.value.at).toBe(storedAt)
  })

  it('caps the accrued amount at the capacity', () => {
    const resources = oneResource({ amount: 990, ratePerHour: 100, capacityUnits: 1000 })
    const now = oneHourLater

    const result = materializeResources(resources, storedAt, now)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(1000)
  })

  it('accrues each resource at its own rate', () => {
    const resources: Resources = {
      wood: { amount: 0, ratePerHour: 10, capacityUnits: 1000 },
      stone: { amount: 0, ratePerHour: 20, capacityUnits: 1000 },
      iron: { amount: 0, ratePerHour: 5, capacityUnits: 1000 },
      gold: { amount: 0, ratePerHour: 1, capacityUnits: 1000 },
      food: { amount: 0, ratePerHour: 30, capacityUnits: 1000 },
    }
    const now = oneHourLater

    const result = materializeResources(resources, storedAt, now)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(10)
    expect(result.value.resources.stone.amount).toBe(20)
    expect(result.value.resources.iron.amount).toBe(5)
    expect(result.value.resources.gold.amount).toBe(1)
    expect(result.value.resources.food.amount).toBe(30)
  })

  it('accrues nothing for a resource whose rate is zero', () => {
    const resources = oneResource({ amount: 50, ratePerHour: 0, capacityUnits: 1000 })
    const now = oneHourLater

    const result = materializeResources(resources, storedAt, now)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(50)
  })

  it('refuses an instant before the stored instant', () => {
    const resources = oneResource({ amount: 50, ratePerHour: 10, capacityUnits: 1000 })
    const before = Instant.fromEpochMilliseconds(storedAt.epochMilliseconds - 1000)

    const result = materializeResources(resources, storedAt, before)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'InstantBeforeStored', storedAt, now: before },
    })
  })
})
