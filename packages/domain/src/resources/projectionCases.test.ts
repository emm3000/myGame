import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { materializeResources } from './materializeResources'
import projection from './projection-cases.json'
import { Resource, type Resources } from './Resources'

const buildResource = (amount: number, ratePerHour: number, capacityUnits: number): Resource => {
  const result = Resource.create(amount, ratePerHour, capacityUnits)
  assert(result.ok)
  return result.value
}

describe('the shared projection cases', () => {
  it('meets every shared projection case', () => {
    expect(projection.cases.length).toBeGreaterThan(0)

    for (const projectionCase of projection.cases) {
      const resource = buildResource(
        projectionCase.storedAmount,
        projectionCase.ratePerHour,
        projectionCase.capacity,
      )
      const resources: Resources = {
        wood: resource,
        stone: resource,
        iron: resource,
        gold: resource,
        food: resource,
      }

      const result = materializeResources(
        resources,
        Instant.fromEpochMilliseconds(projectionCase.readAtEpochMilliseconds),
        Instant.fromEpochMilliseconds(projectionCase.nowEpochMilliseconds),
      )

      assert(result.ok, projectionCase.name)
      expect(result.value.resources.wood.amount, projectionCase.name).toBe(
        projectionCase.expectedAmount,
      )
    }
  })
})
