import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { materializeResources } from './materializeResources'
import { Resource, type Resources } from './Resources'

const storedAt = Instant.fromEpochMilliseconds(0)
const oneHourLater = Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + 3_600_000)

const buildResource = (amount: number, ratePerHour: number, capacityUnits: number): Resource => {
  const result = Resource.create(amount, ratePerHour, capacityUnits)
  assert(result.ok)
  return result.value
}

const uniformResources = (resource: Resource): Resources => ({
  wood: resource,
  stone: resource,
  iron: resource,
  gold: resource,
  food: resource,
})

describe('materializeResources', () => {
  it('returns the stored amount when no time has passed', () => {
    const resources = uniformResources(buildResource(100, 10, 900))

    const result = materializeResources(resources, storedAt, storedAt)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(100)
    expect(result.value.at).toBe(storedAt)
  })

  it('caps the accrued amount at the capacity', () => {
    const resources = uniformResources(buildResource(890, 100, 900))

    const result = materializeResources(resources, storedAt, oneHourLater)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(900)
  })

  it('accrues each resource at its own rate', () => {
    const resources: Resources = {
      wood: buildResource(0, 10, 900),
      stone: buildResource(0, 20, 900),
      iron: buildResource(0, 5, 900),
      gold: buildResource(0, 1, 900),
      food: buildResource(0, 30, 900),
    }

    const result = materializeResources(resources, storedAt, oneHourLater)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(10)
    expect(result.value.resources.stone.amount).toBe(20)
    expect(result.value.resources.iron.amount).toBe(5)
    expect(result.value.resources.gold.amount).toBe(1)
    expect(result.value.resources.food.amount).toBe(30)
  })

  it('accrues nothing for a resource whose rate is zero', () => {
    const resources = uniformResources(buildResource(50, 0, 900))

    const result = materializeResources(resources, storedAt, oneHourLater)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(50)
  })

  it('accrues a partial hour without losing a unit', () => {
    const resources = uniformResources(buildResource(0, 15, 10_000))
    const eightHoursTwelveMinutesLater = Instant.fromEpochMilliseconds(
      storedAt.epochMilliseconds + (8 * 3600 + 12 * 60) * 1_000,
    )

    const result = materializeResources(resources, storedAt, eightHoursTwelveMinutesLater)

    assert(result.ok)
    expect(result.value.resources.wood.amount).toBe(123)
  })

  it('refuses an instant before the stored instant', () => {
    const resources = uniformResources(buildResource(50, 10, 900))
    const before = Instant.fromEpochMilliseconds(storedAt.epochMilliseconds - 1_000)

    const result = materializeResources(resources, storedAt, before)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'InstantBeforeStored', storedAt, now: before },
    })
  })
})
