import { assert, describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { inMemoryPlacementWords } from '#placement/testing/placementWords'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import type { Instant } from '#time/Instant'
import { inMemoryTownStores } from '#town/testing/inMemoryTownStores'
import { ana, bandOneStart, weeksAfterStart } from '../testing/holdoutFixtures'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import { SkipHoldoutCheck } from './SkipHoldoutCheck'

const skipAt = async (now: Instant) => {
  const bandStarts = inMemoryBandStarts([{ playerId: ana, start: bandOneStart() }])
  const skipped = await new SkipHoldoutCheck({
    unitOfWork: inMemoryUnitOfWork(
      inMemoryTownStores({ bandStarts, accounts: signedUpAccountsOf([ana]) }),
    ),
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]), ...inMemoryPlacementWords([]) },
    clock: { now: () => now },
  }).execute({ playerId: ana, band: 1, week: 24 })
  const stored = await bandStarts.bandStartsOf(ana)
  assert(stored.ok)
  return { skipped, checks: stored.value[0]?.checks }
}

describe('SkipHoldoutCheck', () => {
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
