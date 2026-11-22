import { assert, describe, expect, it } from 'vitest'
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
import { ResolveCurrentTown } from './ResolveCurrentTown'

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z'))

const readAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const resolveCurrentTownOver = (stores: TownStores): ResolveCurrentTown =>
  new ResolveCurrentTown({
    unitOfWork: inMemoryUnitOfWork(stores),
    clock: { now: () => readAt },
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
    towns: stores.towns,
    townsWithSchool: stores.townsWithSchool,
    townCatalog: townCatalogOf(),
  })

describe('ResolveCurrentTown', () => {
  it('reads an idle town at the read instant', async () => {
    const town = townOf({ playerId: 'ana', storedAt })
    const stores = inMemoryTownStores({ towns: inMemoryTowns([town], inMemoryEarnedSkills([])) })

    const reading = await resolveCurrentTownOver(stores).execute('ana')

    assert(reading.ok)
    expect([reading.value.town.id, reading.value.at]).toEqual([town.id, readAt])
  })

  it('refuses a player who holds no town with TownNotFound', async () => {
    const reading = await resolveCurrentTownOver(inMemoryTownStores({})).execute('ana')

    expect(reading).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'ana' } })
  })
})
