import { assert, describe, expect, it } from 'vitest'
import { ana, bandOneStart, weeksAfterStart } from '../testing/holdoutFixtures'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import type { Instant } from '../time/Instant'
import { skipHoldoutCheck } from './skipHoldoutCheck'

const skipAt = async (now: Instant) => {
  const bandStarts = inMemoryBandStarts([{ playerId: ana, start: bandOneStart() }])
  const skipped = await skipHoldoutCheck(
    { playerId: ana, band: 1, week: 24 },
    { bandStarts, clock: { now: () => now } },
  )
  const stored = await bandStarts.bandStartsOf(ana)
  assert(stored.ok)
  return { skipped, checks: stored.value[0]?.checks }
}

describe('skipHoldoutCheck', () => {
  it('stores a due check as skipped at the instant it is skipped', async () => {
    const skippedAt = weeksAfterStart(25)
    const { checks } = await skipAt(skippedAt)
    expect(checks).toEqual([{ kind: 'skipped', week: 24, skippedAt }])
  })

  it('refuses to skip a check not due yet', async () => {
    const { skipped, checks } = await skipAt(weeksAfterStart(24, -1))
    expect(skipped).toEqual({ ok: false, error: { kind: 'HoldoutCheckNotDue', band: 1, week: 24 } })
    expect(checks).toEqual([])
  })
})
