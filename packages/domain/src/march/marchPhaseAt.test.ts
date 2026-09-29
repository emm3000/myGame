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
  province: 2,
  plot: 5,
  infantry: 10,
  stayHours: 2,
  departedAt,
  oneWaySeconds: 840,
  loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
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
})
