import { assert, describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { TownStores } from '../domain/TownStores'
import { inMemoryEarnedSkills } from '../testing/inMemoryEarnedSkills'
import { inMemoryTownStores } from '../testing/inMemoryTownStores'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { ResolveTownForText } from './ResolveTownForText'

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z'))

const readAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const resolveTownForTextOver = (stores: TownStores): ResolveTownForText =>
  new ResolveTownForText({
    unitOfWork: inMemoryUnitOfWork(stores),
    clock: { now: () => readAt },
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
    towns: stores.towns,
    townsWithSchool: stores.townsWithSchool,
    townCatalog: townCatalogOf(),
  })

const anasStores = (): TownStores =>
  inMemoryTownStores({
    accounts: signedUpAccountsOf(['ana']),
    towns: inMemoryTowns([townOf({ playerId: 'ana', storedAt })], inMemoryEarnedSkills([])),
  })

describe('ResolveTownForText', () => {
  it('reads the town at the read instant', async () => {
    const reading = await resolveTownForTextOver(anasStores()).execute('ana')

    assert(reading.ok)
    expect(reading.value.at).toEqual(readAt)
  })

  it('leaves the town unseen', async () => {
    const stores = anasStores()

    await resolveTownForTextOver(stores).execute('ana')

    const read = await stores.townsWithSchool.townWithSchoolOf('ana')
    assert(read.ok)
    expect(read.value?.seenAt).toBeUndefined()
  })

  it('refuses a player who holds no town with TownNotFound', async () => {
    const reading = await resolveTownForTextOver(inMemoryTownStores({})).execute('ana')

    expect(reading).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'ana' } })
  })
})
