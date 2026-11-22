import { describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { TownStores } from '../../domain/TownStores'
import { inMemoryEarnedSkills } from '../../testing/inMemoryEarnedSkills'
import { inMemoryTownStores } from '../../testing/inMemoryTownStores'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { townOf } from '../../testing/townFixtures'
import { MemoryGuidanceDismissals } from '../testing/MemoryGuidanceDismissals'
import { DismissGuidance } from './DismissGuidance'

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z'))

const dismissedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const dismissGuidanceOver = (stores: TownStores): DismissGuidance =>
  new DismissGuidance({
    unitOfWork: inMemoryUnitOfWork(stores),
    clock: { now: () => dismissedAt },
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
  })

describe('DismissGuidance', () => {
  it('dismisses the guidance at the instant of the dismissal', async () => {
    const towns = inMemoryTowns([townOf({ playerId: 'ana', storedAt })], inMemoryEarnedSkills([]))
    const guidanceDismissals = new MemoryGuidanceDismissals(towns)
    const stores = inMemoryTownStores({
      accounts: signedUpAccountsOf(['ana']),
      towns,
      guidanceDismissals,
    })

    const dismissed = await dismissGuidanceOver(stores).execute('ana')

    expect([dismissed.ok, await guidanceDismissals.dismissedAt('ana')]).toEqual([true, dismissedAt])
  })

  it('refuses a player who holds no town with TownNotFound', async () => {
    const stores = inMemoryTownStores({ accounts: signedUpAccountsOf(['ana']) })

    const dismissed = await dismissGuidanceOver(stores).execute('ana')

    expect(dismissed).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'ana' } })
  })
})
