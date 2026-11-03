import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { AwayMarch } from './March'
import marchPhase from './march-phase-cases.json'
import { marchInstantsOf } from './marchInstantsOf'
import { type MarchPhase, marchPhaseAt } from './marchPhaseAt'

type MarchPhaseCase = (typeof marchPhase.cases)[number]

const marchOf = (phaseCase: MarchPhaseCase): AwayMarch => ({
  kind: 'away',
  order: 'forage',
  province: 2,
  plot: 5,
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
  stayHours: phaseCase.stayHours,
  departedAt: Instant.fromEpochMilliseconds(phaseCase.departedAtEpochMilliseconds),
  oneWaySeconds: phaseCase.oneWaySeconds,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
})

const atOf = (phaseCase: MarchPhaseCase): Instant =>
  Instant.fromEpochMilliseconds(phaseCase.atEpochMilliseconds)

describe('the shared march phase cases', () => {
  it('holds at least one shared march phase case', () => {
    expect(marchPhase.cases.length).toBeGreaterThan(0)
  })

  it('places the arrival and the leaving of every case where marchInstantsOf does', () => {
    for (const phaseCase of marchPhase.cases) {
      const { arrivesAt, leavesAt } = marchInstantsOf(marchOf(phaseCase))

      expect([arrivesAt.epochMilliseconds, leavesAt.epochMilliseconds], phaseCase.name).toEqual([
        phaseCase.arrivesAtEpochMilliseconds,
        phaseCase.leavesAtEpochMilliseconds,
      ])
    }
  })

  it('reads the phase of every case', () => {
    for (const phaseCase of marchPhase.cases) {
      expect(marchPhaseAt(marchOf(phaseCase), atOf(phaseCase)), phaseCase.name).toBe(
        phaseCase.expectedPhase,
      )
    }
  })

  it('counts down to the instant that ends the phase of every case', () => {
    for (const phaseCase of marchPhase.cases) {
      const march = marchOf(phaseCase)
      const at = atOf(phaseCase)
      const { arrivesAt, leavesAt } = marchInstantsOf(march)
      const phaseEndsAt: Record<MarchPhase, Instant | null> = {
        outbound: arrivesAt,
        foraging: leavesAt,
        returning: null,
      }
      const endsAt = phaseEndsAt[marchPhaseAt(march, at)]
      const untilNextTurn = endsAt === null ? null : endsAt.epochMilliseconds - at.epochMilliseconds

      expect(untilNextTurn, phaseCase.name).toBe(phaseCase.expectedNextTurnInMilliseconds)
    }
  })
})
