import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { SeasonedSettings } from './SeasonedSettings'
import { seasonAt } from './seasonAt'

const MILLISECONDS_PER_DAY = 86_400_000

const epoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const weeklySettings: SeasonedSettings = {
  seasons: { epoch, daysPerSeason: 7 },
}

describe('seasonAt', () => {
  it('starts spring of year 1 at the epoch', () => {
    expect(seasonAt(epoch, weeklySettings)).toEqual({
      kind: 'spring',
      year: 1,
      endsAt: daysAfterEpoch(7),
    })
  })

  it('turns to summer seven days after the epoch', () => {
    expect(seasonAt(daysAfterEpoch(7.5), weeklySettings)).toEqual({
      kind: 'summer',
      year: 1,
      endsAt: daysAfterEpoch(14),
    })
  })

  it('starts year 2 in spring 28 days after the epoch', () => {
    expect(seasonAt(daysAfterEpoch(28), weeklySettings)).toEqual({
      kind: 'spring',
      year: 2,
      endsAt: daysAfterEpoch(35),
    })
  })

  it('turns summer into fall at the season boundary', () => {
    const lastInstantOfSummer = Instant.fromEpochMilliseconds(
      daysAfterEpoch(14).epochMilliseconds - 1,
    )

    expect(seasonAt(lastInstantOfSummer, weeklySettings)?.kind).toBe('summer')
    expect(seasonAt(daysAfterEpoch(14), weeklySettings)).toEqual({
      kind: 'fall',
      year: 1,
      endsAt: daysAfterEpoch(21),
    })
    expect(
      [0, 7, 14, 21].map((days) => seasonAt(daysAfterEpoch(days), weeklySettings)?.kind),
    ).toEqual(['spring', 'summer', 'fall', 'winter'])
  })

  it('answers no season before the epoch', () => {
    expect(seasonAt(daysAfterEpoch(-0.001), weeklySettings)).toBeUndefined()
  })

  it('ends a season at the instant the next begins', () => {
    const lastInstantOfFall = Instant.fromEpochMilliseconds(
      daysAfterEpoch(21).epochMilliseconds - 1,
    )

    expect(seasonAt(lastInstantOfFall, weeklySettings)?.kind).toBe('fall')
    expect(seasonAt(daysAfterEpoch(21), weeklySettings)).toEqual({
      kind: 'winter',
      year: 1,
      endsAt: daysAfterEpoch(28),
    })
  })
})
