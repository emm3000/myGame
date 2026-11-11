import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { Job } from './Job'
import { jobPhaseAt } from './jobPhaseAt'

const sentAt = Instant.fromEpochMilliseconds(1_791_244_800_000)

const secondsAfterSent = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(sentAt.epochMilliseconds + seconds * 1_000)

const oneHourJob: Job = {
  kind: 'out',
  site: { region: 1, area: 2, site: 3 },
  team: { worker: 1, truck: 0 },
  hours: 1,
  sentAt,
  oneWaySeconds: 600,
  pay: { money: 0, food: 0, power: 3, material: 3 },
  payPercent: { money: 100, food: 100, power: 100, material: 100 },
}

describe('jobPhaseAt', () => {
  it('reads the later phase at each boundary', () => {
    const phases = [0, 599, 600, 4_199, 4_200, 4_800].map((seconds) =>
      jobPhaseAt(oneHourJob, secondsAfterSent(seconds)),
    )

    expect(phases).toEqual(['outbound', 'outbound', 'working', 'working', 'returning', 'returning'])
  })

  it('turns a called-back job around at the call back', () => {
    const calledBack = { ...oneHourJob, calledBackAt: secondsAfterSent(900) }

    expect([899, 900].map((seconds) => jobPhaseAt(calledBack, secondsAfterSent(seconds)))).toEqual([
      'working',
      'returning',
    ])
  })
})
