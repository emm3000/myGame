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
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { DrizzleAccounts } from '#account/infrastructure/postgres/DrizzleAccounts'
import { DrizzleLessonSlots } from './DrizzleLessonSlotRepository'
import { DrizzleTownReader } from './DrizzleTownReader'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import { townTestDatabase } from './townTestDatabase.testSupport'

const { open, close, pool, registerPlayers, truncateAll } = townTestDatabase()

beforeAll(open)

afterAll(close)

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

describe('DrizzleTownReader', () => {
  it("reads the town with its school's lesson slot and the player's cards", async () => {
    await truncateAll()
    await registerPlayers([ana])
    const town = anasTown(ana)
    const session = drizzle(pool())
    const towns = new DrizzleTownRepository(session, 'lockFree')
    const reader = new DrizzleTownReader(session)
    const enteredCard = MemoryCard.entered(instantAt('2026-11-10T09:00:00Z'))
    assert((await towns.save(town)).ok)
    await new DrizzleLessonSlots(session).save(town.id, lessonOneUnderStudy)
    await pool().query(
      `INSERT INTO cards (player_id, word_id, state, step, entered_at) VALUES ('${ana}', 'lesson-1-1', 'learning', 0, '2026-11-10T09:00:00Z')`,
    )

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
    const session = drizzle(pool())
    const towns = new DrizzleTownRepository(session, 'lockFree')
    const reader = new DrizzleTownReader(session)
    assert((await towns.save(anasTown(ana))).ok)
    await new DrizzleAccounts(session).storeScaffold(ana, 'none')

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.scaffold).toBe('none')
  })

  it("reads with the town the scaffold version the player's account reads", async () => {
    await truncateAll()
    await registerPlayers([ana])
    const session = drizzle(pool())
    const towns = new DrizzleTownRepository(session, 'lockFree')
    const reader = new DrizzleTownReader(session)
    assert((await towns.save(anasTown(ana))).ok)
    const stored = await new DrizzleAccounts(session).storeScaffold(ana, 'none')

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.scaffoldVersion).toBe(stored.scaffoldVersion)
  })

  it("reads the player's band starts with their held-out words and checks with the town", async () => {
    await truncateAll()
    await registerPlayers([ana, otherPlayer])
    const session = drizzle(pool())
    const towns = new DrizzleTownRepository(session, 'lockFree')
    const reader = new DrizzleTownReader(session)
    const startedAt = instantAt('2026-11-10T08:55:00Z')
    const closedAt = instantAt('2027-04-27T09:00:00Z')
    assert((await towns.save(anasTown(ana))).ok)
    await pool().query(`
      INSERT INTO band_starts (player_id, band, started_at) VALUES
        ('${ana}', 2, '2026-11-10T08:55:00Z'),
        ('${ana}', 1, '2026-11-10T08:55:00Z'),
        ('${otherPlayer}', 1, '2026-11-10T08:55:00Z');
      INSERT INTO held_out_words (player_id, band, headword) VALUES
        ('${ana}', 2, 'say'), ('${ana}', 1, 'know'), ('${ana}', 1, 'go'), ('${otherPlayer}', 1, 'go');
      INSERT INTO holdout_checks (player_id, band, week, kind, begun_at, closed_at, held_out_score, practised_score) VALUES
        ('${ana}', 1, 24, 'skipped', NULL, '2027-04-27T09:00:00Z', NULL, NULL),
        ('${ana}', 2, 8, 'taken', '2026-11-10T08:55:00Z', '2027-04-27T09:00:00Z', 1, 2),
        ('${ana}', 2, 24, 'begun', '2027-04-27T09:00:00Z', NULL, NULL, NULL);
      INSERT INTO holdout_check_words (player_id, band, week, position, word_id, is_held_out) VALUES
        ('${ana}', 2, 8, 1, 'word-say', true), ('${ana}', 2, 8, 2, 'word-time', false),
        ('${ana}', 2, 24, 1, 'word-say', true), ('${ana}', 2, 24, 2, 'word-time', false)
    `)
    const sample = { wordIds: ['word-say', 'word-time'], heldOutWordIds: ['word-say'] }

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.bandStarts).toEqual([
      {
        band: 1,
        startedAt,
        heldOutWords: ['go', 'know'],
        checks: [{ kind: 'skipped', week: 24, skippedAt: closedAt }],
      },
      {
        band: 2,
        startedAt,
        heldOutWords: ['say'],
        checks: [
          {
            kind: 'taken',
            week: 8,
            begunAt: startedAt,
            sample,
            heldOutScore: 1,
            practisedScore: 2,
            takenAt: closedAt,
          },
          { kind: 'begun', week: 24, begunAt: closedAt, sample },
        ],
      },
    ])
  })

  it('reads no band start before a band starts', async () => {
    await truncateAll()
    await registerPlayers([ana])
    const towns = new DrizzleTownRepository(drizzle(pool()), 'lockFree')
    const reader = new DrizzleTownReader(drizzle(pool()))
    assert((await towns.save(anasTown(ana))).ok)

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.bandStarts).toEqual([])
  })

  it('reads an idle school for a town with no lesson slot row', async () => {
    await truncateAll()
    await registerPlayers([ana])
    const towns = new DrizzleTownRepository(drizzle(pool()), 'lockFree')
    const reader = new DrizzleTownReader(drizzle(pool()))
    assert((await towns.save(anasTown(ana))).ok)

    const read = await reader.townWithSchoolOf(ana)

    expect(read.ok && read.value?.lessonSlot).toEqual({ kind: 'idle' })
  })
})
