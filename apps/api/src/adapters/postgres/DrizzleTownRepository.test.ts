import {
  Instant,
  type LessonSlot,
  MemoryCard,
  type PlayerId,
  Town,
  TownAddress,
  TownName,
} from '@mygame/domain'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { players } from '../../account/infrastructure/postgres/accountTables'
import { DrizzleAccounts } from '../../account/infrastructure/postgres/DrizzleAccounts'
import { DrizzleBandStarts } from '../../holdout/infrastructure/postgres/DrizzleBandStarts'
import { DrizzleCardRepository } from '../../learning/infrastructure/postgres/DrizzleCardRepository'
import { truncatePlayerTables } from '../../truncatePlayerTables.testSupport'
import { townRepositoryContract } from '../townRepositoryContract'
import { DrizzleEarnedSkills } from './DrizzleEarnedSkills'
import { DrizzleLessonSlots } from './DrizzleLessonSlots'
import { DrizzleTownRepository } from './DrizzleTownRepository'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

let pool: Pool

beforeAll(() => {
  pool = new Pool({ connectionString: databaseUrl() })
})

afterAll(async () => {
  await pool.end()
})

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  if (playerIds.length === 0) {
    return
  }
  await drizzle(pool)
    .insert(players)
    .values(
      playerIds.map((id) => ({
        id,
        email: `${id}@example.com`,
        passwordHash: 'argon2id-hash',
        createdAt: new Date('2026-11-04T08:00:00Z'),
        digestAcknowledgedAt: new Date('2026-11-04T08:00:00Z'),
        reportReadAt: new Date('2026-11-04T08:00:00Z'),
        scaffold: 'es' as const,
      })),
    )
}

const truncateAll = async (): Promise<void> => {
  await pool.query(truncatePlayerTables)
}

townRepositoryContract('DrizzleTownRepository', async () => {
  await truncateAll()
  return {
    towns: new DrizzleTownRepository(drizzle(pool), 'lockFree'),
    skills: new DrizzleEarnedSkills(drizzle(pool)),
    registerPlayers,
  }
})

const ana = '00000000-0000-4000-8000-000000000001'
const otherPlayer = '00000000-0000-4000-8000-000000000002'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const anasTown = (playerId: PlayerId): Town => {
  const address = TownAddress.create(1, 1, 1)
  const name = TownName.create('Maple Falls')
  assert(address.ok && name.ok)
  return Town.found({
    id: '00000000-0000-4000-8000-00000000000a',
    playerId,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: instantAt('2026-11-10T08:00:00Z'),
  })
}

const lessonOneUnderStudy: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: instantAt('2026-11-10T08:55:00Z'),
  finishesAt: instantAt('2026-11-10T09:00:00Z'),
}

describe('DrizzleTownRepository as a TownReader', () => {
  it("reads the town with its school's lesson slot and the player's cards", async () => {
    await truncateAll()
    await registerPlayers([ana])
    const town = anasTown(ana)
    const session = drizzle(pool)
    const reader = new DrizzleTownRepository(session, 'lockFree')
    const enteredCard = MemoryCard.entered(instantAt('2026-11-10T09:00:00Z'))
    assert((await reader.save(town)).ok)
    await new DrizzleLessonSlots(session).save(town.id, lessonOneUnderStudy)
    await new DrizzleCardRepository(session).save(ana, { wordId: 'lesson-1-1', card: enteredCard })

    const read = await reader.townWithSchoolOf(ana)

    assert(read.ok && read.value !== undefined)
    expect([read.value.town.id, read.value.lessonSlot, read.value.cards]).toEqual([
      town.id,
      lessonOneUnderStudy,
      [{ wordId: 'lesson-1-1', card: enteredCard }],
    ])
  })

  it("reads the player's scaffold language with the town", async () => {
    await truncateAll()
    await registerPlayers([ana])
    const session = drizzle(pool)
    const reader = new DrizzleTownRepository(session, 'lockFree')
    assert((await reader.save(anasTown(ana))).ok)
    await new DrizzleAccounts(session).storeScaffold(ana, 'none')

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.scaffold).toBe('none')
  })

  it("reads with the town the scaffold version the player's account reads", async () => {
    await truncateAll()
    await registerPlayers([ana])
    const session = drizzle(pool)
    const reader = new DrizzleTownRepository(session, 'lockFree')
    assert((await reader.save(anasTown(ana))).ok)
    const stored = await new DrizzleAccounts(session).storeScaffold(ana, 'none')

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.scaffoldVersion).toBe(stored.scaffoldVersion)
  })

  it("reads the player's band starts with their held-out words and checks with the town", async () => {
    await truncateAll()
    await registerPlayers([ana, otherPlayer])
    const session = drizzle(pool)
    const reader = new DrizzleTownRepository(session, 'lockFree')
    const startedAt = instantAt('2026-11-10T08:55:00Z')
    const closedAt = instantAt('2027-04-27T09:00:00Z')
    const bandStarts = new DrizzleBandStarts(session)
    assert((await reader.save(anasTown(ana))).ok)
    assert(
      (await bandStarts.save(ana, { band: 2, startedAt, heldOutWords: ['say'], checks: [] })).ok,
    )
    assert(
      (await bandStarts.save(ana, { band: 1, startedAt, heldOutWords: ['know', 'go'], checks: [] }))
        .ok,
    )
    assert(
      (await bandStarts.save(otherPlayer, { band: 1, startedAt, heldOutWords: ['go'], checks: [] }))
        .ok,
    )
    const sample = { wordIds: ['word-say', 'word-time'], heldOutWordIds: ['word-say'] }
    assert(
      (await bandStarts.saveCheck(ana, 1, { kind: 'skipped', week: 24, skippedAt: closedAt })).ok,
    )
    assert(
      (
        await bandStarts.saveCheck(ana, 2, {
          kind: 'taken',
          week: 8,
          begunAt: startedAt,
          sample,
          heldOutScore: 1,
          practisedScore: 2,
          takenAt: closedAt,
        })
      ).ok,
    )
    assert(
      (await bandStarts.saveCheck(ana, 2, { kind: 'begun', week: 24, begunAt: closedAt, sample }))
        .ok,
    )
    const stored = await bandStarts.bandStartsOf(ana)
    assert(stored.ok)

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.bandStarts).toEqual(stored.value)
    expect(stored.value.map(({ band, heldOutWords }) => ({ band, heldOutWords }))).toEqual([
      { band: 1, heldOutWords: ['go', 'know'] },
      { band: 2, heldOutWords: ['say'] },
    ])
  })

  it('reads no band start before a band starts', async () => {
    await truncateAll()
    await registerPlayers([ana])
    const reader = new DrizzleTownRepository(drizzle(pool), 'lockFree')
    assert((await reader.save(anasTown(ana))).ok)

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.bandStarts).toEqual([])
  })

  it('reads an idle school for a town with no lesson slot row', async () => {
    await truncateAll()
    await registerPlayers([ana])
    const reader = new DrizzleTownRepository(drizzle(pool), 'lockFree')
    assert((await reader.save(anasTown(ana))).ok)

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.lessonSlot).toEqual({ kind: 'idle' })
  })
})
