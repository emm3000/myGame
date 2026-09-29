import { describe, expect, it } from 'vitest'
import { plainCamps } from '../testing/plainCamps'
import { Instant } from '../time/Instant'
import { campStrengthAt } from './campStrengthAt'

const beatenAt = Instant.fromEpochMilliseconds(86_400_000)

const hoursAfterBeaten = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(beatenAt.epochMilliseconds + hours * 3_600_000)

const beatenToNothing = { strength: 0, foughtAt: beatenAt }

describe('campStrengthAt', () => {
  it('reads a camp never fought at its max', () => {
    expect(campStrengthAt(plainCamps.tiers[2], undefined, beatenAt)).toBe(15)
  })

  it('regrows a beaten camp linearly to its max', () => {
    const tierOne = plainCamps.tiers[1]

    expect(
      [1, 6, 7].map((hours) => campStrengthAt(tierOne, beatenToNothing, hoursAfterBeaten(hours))),
    ).toEqual([1, 6, 6])
    expect(campStrengthAt(plainCamps.tiers[3], beatenToNothing, hoursAfterBeaten(3))).toBe(5)
  })

  it('reads a battle stamped after the instant at its stored strength', () => {
    expect(campStrengthAt(plainCamps.tiers[1], beatenToNothing, hoursAfterBeaten(-1))).toBe(0)
  })
})
