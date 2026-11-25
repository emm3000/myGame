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
import { ResolveCurrentTown } from './ResolveCurrentTown'

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:00:00Z'))

const readAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const minutesBefore = (minutes: number, instant: Instant): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds - minutes * 60_000)

const resolveCurrentTownOver = (stores: TownStores, at: Instant = readAt): ResolveCurrentTown =>
  new ResolveCurrentTown({
    unitOfWork: inMemoryUnitOfWork(stores),
    clock: { now: () => at },
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
    towns: stores.towns,
    townsWithSchool: stores.townsWithSchool,
    seenTowns: stores.seenTowns,
    townCatalog: townCatalogOf(),
  })

const farmingStoresOf = (townStoredAt: Instant): TownStores =>
  inMemoryTownStores({
    accounts: signedUpAccountsOf(['ana']),
    towns: inMemoryTowns(
      [townOf({ playerId: 'ana', storedAt: townStoredAt, buildingLevels: { farm: 1 } })],
      inMemoryEarnedSkills([]),
    ),
  })

describe('ResolveCurrentTown', () => {
  it('reads an idle town at the read instant', async () => {
    const town = townOf({ playerId: 'ana', storedAt })
    const stores = inMemoryTownStores({
      accounts: signedUpAccountsOf(['ana']),
      towns: inMemoryTowns([town], inMemoryEarnedSkills([])),
    })

    const reading = await resolveCurrentTownOver(stores).execute('ana')

    assert(reading.ok)
    expect([reading.value.town.id, reading.value.at]).toEqual([town.id, readAt])
  })

  it('writes the read instant as seen_at and advances no stock', async () => {
    const town = townOf({ playerId: 'ana', storedAt, buildingLevels: { farm: 1 } })
    const towns = inMemoryTowns([town], inMemoryEarnedSkills([]))
    const stores = inMemoryTownStores({ accounts: signedUpAccountsOf(['ana']), towns })

    await resolveCurrentTownOver(stores).execute('ana')

    const seen = await stores.townsWithSchool.townWithSchoolOf('ana')
    assert(seen.ok)
    expect([seen.value?.seenAt, towns.storedTownOf('ana')]).toEqual([readAt, town])
  })

  it('answers no away under the hour after the later of seen_at and stored_at', async () => {
    const stores = farmingStoresOf(minutesBefore(180, readAt))
    await resolveCurrentTownOver(stores, minutesBefore(59, readAt)).execute('ana')

    const reading = await resolveCurrentTownOver(stores).execute('ana')

    assert(reading.ok)
    expect(reading.value.away).toBeUndefined()
  })

  it('answers the rise of each stock from seen_at to the read', async () => {
    const stores = farmingStoresOf(minutesBefore(180, readAt))
    await resolveCurrentTownOver(stores, minutesBefore(120, readAt)).execute('ana')

    const reading = await resolveCurrentTownOver(stores).execute('ana')

    assert(reading.ok)
    expect(reading.value.away).toEqual({ money: 24, food: 70, power: 0, material: 0 })
  })

  it('answers the rise from stored_at on a read the hour after it', async () => {
    const stores = farmingStoresOf(minutesBefore(60, readAt))

    const reading = await resolveCurrentTownOver(stores).execute('ana')

    assert(reading.ok)
    expect(reading.value.away).toEqual({ money: 12, food: 35, power: 0, material: 0 })
  })

  it('refuses a player who holds no town with TownNotFound', async () => {
    const reading = await resolveCurrentTownOver(inMemoryTownStores({})).execute('ana')

    expect(reading).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'ana' } })
  })
})
