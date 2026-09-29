import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { deliveredUnitsOf } from './deliveredUnitsOf'
import type { OpenRecruitOrder } from './RecruitOrder'

const orderedAt = Instant.fromEpochMilliseconds(86_400_000)

const secondsAfterOrder = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(orderedAt.epochMilliseconds + seconds * 1_000)

const fiveInfantryAtSixtySeconds: OpenRecruitOrder = {
  kind: 'open',
  unit: 'infantry',
  count: 5,
  cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
  perUnitSeconds: 60,
  startedAt: orderedAt,
}

describe('deliveredUnitsOf', () => {
  it('delivers no unit before the first period ends', () => {
    expect(deliveredUnitsOf(fiveInfantryAtSixtySeconds, secondsAfterOrder(59))).toBe(0)
  })

  it('delivers no unit before the order starts', () => {
    expect(deliveredUnitsOf(fiveInfantryAtSixtySeconds, secondsAfterOrder(-120))).toBe(0)
  })

  it('delivers one unit per period elapsed', () => {
    expect(deliveredUnitsOf(fiveInfantryAtSixtySeconds, secondsAfterOrder(150))).toBe(2)
  })

  it('never delivers more than the units ordered', () => {
    expect(deliveredUnitsOf(fiveInfantryAtSixtySeconds, secondsAfterOrder(900))).toBe(5)
  })
})
