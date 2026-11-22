import { describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { TownEvent } from '../../domain/TownEvent'
import type { TownStores } from '../../domain/TownStores'
import { inMemoryEarnedSkills } from '../../testing/inMemoryEarnedSkills'
import { inMemoryTownStores } from '../../testing/inMemoryTownStores'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { MemoryTownNewsReader } from '../../testing/MemoryTownNewsReader'
import { townCatalogOf } from '../../testing/townCatalogOf'
import { townOf } from '../../testing/townFixtures'
import { ResolveTownNews } from './ResolveTownNews'

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z'))

const readAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const stoppedLesson: TownEvent = {
  kind: 'lessonStopped',
  lessonId: 'lesson-1',
  occurredAt: storedAt,
}

const resolveTownNewsOver = (stores: TownStores): ResolveTownNews =>
  new ResolveTownNews({
    unitOfWork: inMemoryUnitOfWork(stores),
    clock: { now: () => readAt },
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
    towns: stores.towns,
    townsWithSchool: stores.townsWithSchool,
    townCatalog: townCatalogOf(),
    townNews: new MemoryTownNewsReader((townId) => (townId === 'town-1' ? [stoppedLesson] : [])),
  })

describe('ResolveTownNews', () => {
  it('reads the news of the town it resolves', async () => {
    const stores = inMemoryTownStores({
      accounts: signedUpAccountsOf(['ana']),
      towns: inMemoryTowns([townOf({ playerId: 'ana', storedAt })], inMemoryEarnedSkills([])),
    })

    const news = await resolveTownNewsOver(stores).execute('ana')

    expect(news).toEqual({ ok: true, value: [stoppedLesson] })
  })

  it('refuses a player who holds no town with TownNotFound', async () => {
    const news = await resolveTownNewsOver(inMemoryTownStores({})).execute('ana')

    expect(news).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'ana' } })
  })
})
