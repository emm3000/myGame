import { describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import { inMemoryEarnedSkills } from '../../testing/inMemoryEarnedSkills'
import { inMemoryTownStores } from '../../testing/inMemoryTownStores'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { townOf } from '../../testing/townFixtures'
import { MemorySeenTips } from '../testing/MemorySeenTips'
import { MarkTipSeen } from './MarkTipSeen'

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z'))

describe('MarkTipSeen', () => {
  it('marks the tip seen', async () => {
    const seenTips = new MemorySeenTips()
    const stores = inMemoryTownStores({
      accounts: signedUpAccountsOf(['ana']),
      towns: inMemoryTowns([townOf({ playerId: 'ana', storedAt })], inMemoryEarnedSkills([])),
      seenTips,
    })
    const markTipSeen = new MarkTipSeen({
      unitOfWork: inMemoryUnitOfWork(stores),
      clock: { now: () => storedAt },
      lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
    })

    const marked = await markTipSeen.execute({ playerId: 'ana', tip: 'people' })

    expect([marked.ok, await seenTips.seenTipsOf('ana')]).toEqual([true, ['people']])
  })
})
