import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { deliveredUnitsOf } from './deliveredUnitsOf'
import levyDelivery from './levy-delivery-cases.json'
import type { OpenRecruitOrder } from './RecruitOrder'

const orderOf = (levyCase: (typeof levyDelivery.cases)[number]): OpenRecruitOrder => ({
  kind: 'open',
  unit: 'infantry',
  count: levyCase.count,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  perUnitSeconds: levyCase.perUnitSeconds,
  startedAt: Instant.fromEpochMilliseconds(levyCase.startedAtEpochMilliseconds),
})

describe('the shared levy delivery cases', () => {
  it('delivers the units of every shared levy delivery case', () => {
    expect(levyDelivery.cases.length).toBeGreaterThan(0)

    for (const levyCase of levyDelivery.cases) {
      const delivered = deliveredUnitsOf(
        orderOf(levyCase),
        Instant.fromEpochMilliseconds(levyCase.atEpochMilliseconds),
      )

      expect(delivered, levyCase.name).toBe(levyCase.expectedDelivered)
    }
  })
})
