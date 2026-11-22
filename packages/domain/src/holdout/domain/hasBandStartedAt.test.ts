import { describe, expect, it } from 'vitest'
import { bandOneStart, bandOneStartedAt, weeksAfterStart } from '../testing/holdoutFixtures'
import { dueHoldoutChecksOf } from './dueHoldoutChecksOf'
import { hasBandStartedAt } from './hasBandStartedAt'

describe('hasBandStartedAt', () => {
  it('reads false for a player with no band started', () => {
    expect(hasBandStartedAt([], bandOneStartedAt)).toBe(false)
  })

  it('reads true at the instant the first band starts', () => {
    expect(hasBandStartedAt([bandOneStart()], bandOneStartedAt)).toBe(true)
  })

  it('reads true once the first band has started, before any check is due', () => {
    const starts = [bandOneStart()]
    const beforeFirstCheck = weeksAfterStart(8, -1)

    expect(dueHoldoutChecksOf(starts, beforeFirstCheck)).toEqual([])
    expect(hasBandStartedAt(starts, beforeFirstCheck)).toBe(true)
  })

  it('reads false before the stored start of the band', () => {
    expect(hasBandStartedAt([bandOneStart()], weeksAfterStart(0, -1))).toBe(false)
  })
})
