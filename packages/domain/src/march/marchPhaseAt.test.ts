import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { AwayMarch } from './March'
import { marchInstantsOf } from './marchInstantsOf'
import { marchPhaseAt } from './marchPhaseAt'

const departedAt = Instant.fromEpochMilliseconds(86_400_000)

const secondsAfterDeparture = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(departedAt.epochMilliseconds + seconds * 1_000)

const tenInfantryForTwoHours: AwayMarch = {
  kind: 'away',
  order: 'forage',
  province: 2,
  plot: 5,
  units: { infantry: 10, cavalry: 0, settler: 0 },
  stayHours: 2,
  departedAt,
  oneWaySeconds: 840,
  loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
}

const tenInfantryAttacking: AwayMarch = {
  kind: 'away',
  order: 'attack',
  province: 2,
  plot: 7,
  units: { infantry: 10, cavalry: 0, settler: 0 },
  stayHours: 0,
  departedAt,
  oneWaySeconds: 900,
  loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
  camp: { tier: 1, strength: 6 },
  fought: false,
}

describe('marchInstantsOf', () => {
  it('reads the arrival after the road, the leave after the stay and the return after the road back', () => {
    expect(marchInstantsOf(tenInfantryForTwoHours)).toEqual({
      arrivesAt: secondsAfterDeparture(840),
      leavesAt: secondsAfterDeparture(8_040),
      returnsAt: secondsAfterDeparture(8_880),
    })
  })
})

describe('marchPhaseAt', () => {
  it('reads the march outbound before it arrives', () => {
    expect(marchPhaseAt(tenInfantryForTwoHours, departedAt)).toBe('outbound')
    expect(marchPhaseAt(tenInfantryForTwoHours, secondsAfterDeparture(839))).toBe('outbound')
  })

  it('reads the march foraging from its arrival', () => {
    expect(marchPhaseAt(tenInfantryForTwoHours, secondsAfterDeparture(840))).toBe('foraging')
    expect(marchPhaseAt(tenInfantryForTwoHours, secondsAfterDeparture(8_039))).toBe('foraging')
  })

  it('reads the march returning once the stay ends', () => {
    expect(marchPhaseAt(tenInfantryForTwoHours, secondsAfterDeparture(8_040))).toBe('returning')
    expect(marchPhaseAt(tenInfantryForTwoHours, secondsAfterDeparture(8_879))).toBe('returning')
  })

  it('reads an attack returning from its arrival', () => {
    expect(marchPhaseAt(tenInfantryAttacking, secondsAfterDeparture(899))).toBe('outbound')
    expect(marchPhaseAt(tenInfantryAttacking, secondsAfterDeparture(900))).toBe('returning')
    expect(marchInstantsOf(tenInfantryAttacking).returnsAt).toEqual(secondsAfterDeparture(1_800))
  })
})
