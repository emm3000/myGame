import { readMigrationFiles } from 'drizzle-orm/migrator'
import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ana } from '../../../account/infrastructure/postgres/migrationPlayers.testSupport'
import {
  applyMigrations,
  checkViolation,
  closeWithoutChanges,
  foreignKeyViolation,
  migratedThroughNext,
  migrationsFolder,
  openEmptyDatabase,
  uniqueViolation,
} from '../../../platform/infrastructure/postgres/migrationDatabase.testSupport'

describe('the band starts migration', () => {
  let client: Client

  const bandStartsMigrationIndex = 34

  beforeEach(async () => {
    client = await openEmptyDatabase()
    const migrations = readMigrationFiles({ migrationsFolder })
    await applyMigrations(client, migrations.slice(0, bandStartsMigrationIndex))
    await client.query(
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z')`,
      [ana.id, ana.email],
    )
    await client.query(
      `INSERT INTO cards (player_id, word_id, state, step, entered_at)
       VALUES ($1, 'lesson-1-1', 'learning', 0, '2026-11-02T09:00:00Z')`,
      [ana.id],
    )
    await client.query(
      `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
       VALUES ($1, 'lesson-1', 'food', 5, '2026-11-23T09:10:00Z')`,
      [ana.id],
    )
    await applyMigrations(client, migrations.slice(bandStartsMigrationIndex))
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const insertBandStart = async (band: number): Promise<void> => {
    await client.query(
      `INSERT INTO band_starts (player_id, band, started_at) VALUES ($1, $2, '2026-11-23T09:10:00Z')`,
      [ana.id, band],
    )
  }

  const insertHeldOutWord = async (band: number, headword: string): Promise<void> => {
    await client.query(
      'INSERT INTO held_out_words (player_id, band, headword) VALUES ($1, $2, $3)',
      [ana.id, band, headword],
    )
  }

  const failureCodeOf = async (work: () => Promise<void>): Promise<unknown> => {
    await client.query('SAVEPOINT band_starts')
    const code = await work().then(
      () => undefined,
      (refused: { readonly code: unknown }) => refused.code,
    )
    await client.query('ROLLBACK TO SAVEPOINT band_starts')
    return code
  }

  it('starts no band for a player stored before the migration', async () => {
    const stored = await client.query('SELECT 1 FROM band_starts')

    expect(stored.rows).toEqual([])
  })

  it('holds no word out for a player stored before the migration', async () => {
    const stored = await client.query('SELECT 1 FROM held_out_words')

    expect(stored.rows).toEqual([])
  })

  it('keeps the cards and the skills stored before the migration', async () => {
    const cardsStored = await client.query('SELECT word_id FROM cards')
    const skillsStored = await client.query('SELECT lesson_id FROM earned_skills')

    expect([cardsStored.rows, skillsStored.rows]).toEqual([
      [{ word_id: 'lesson-1-1' }],
      [{ lesson_id: 'lesson-1' }],
    ])
  })

  it('refuses a band outside the three', async () => {
    expect(await failureCodeOf(() => insertBandStart(4))).toBe(checkViolation)
  })

  it('refuses a second start of one band', async () => {
    await insertBandStart(1)

    expect(await failureCodeOf(() => insertBandStart(1))).toBe(uniqueViolation)
  })

  it('refuses a held-out word of a band the player never started', async () => {
    expect(await failureCodeOf(() => insertHeldOutWord(1, 'say'))).toBe(foreignKeyViolation)
  })

  it('refuses one word held out twice for a player', async () => {
    await insertBandStart(1)
    await insertBandStart(2)
    await insertHeldOutWord(1, 'say')

    expect(await failureCodeOf(() => insertHeldOutWord(2, 'say'))).toBe(uniqueViolation)
  })

  it("drops a deleted player's band starts and held-out words", async () => {
    await insertBandStart(1)
    await insertHeldOutWord(1, 'say')

    await client.query('DELETE FROM players WHERE id = $1', [ana.id])

    const stored = await client.query('SELECT 1 FROM held_out_words')
    expect(stored.rows).toEqual([])
  })
})

const holdoutOwnerId = '00000000-0000-4000-8000-0000000000a8'

const migrationsBeforeTheHoldoutChecks = 42

describe('the holdout checks migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheHoldoutChecks, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'learner@example.com', 'argon2id-hash', '2026-11-12T08:00:00Z', '2026-11-12T08:00:00Z')`,
        [holdoutOwnerId],
      )
      await client.query(
        `INSERT INTO band_starts (player_id, band, started_at) VALUES ($1, 1, '2026-11-12T09:00:00Z')`,
        [holdoutOwnerId],
      )
      await client.query(
        `INSERT INTO held_out_words (player_id, band, headword) VALUES ($1, 1, 'river')`,
        [holdoutOwnerId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a band started before the migration with its held-out words and no check', async () => {
    const words = await client.query('SELECT band, headword FROM held_out_words')
    const checks = await client.query('SELECT 1 FROM holdout_checks')

    expect({ words: words.rows, checks: checks.rowCount }).toEqual({
      words: [{ band: 1, headword: 'river' }],
      checks: 0,
    })
  })

  it('stores a taken check of a started band', async () => {
    await client.query(
      `INSERT INTO holdout_checks (player_id, band, week, kind, begun_at, closed_at, held_out_score, practised_score)
       VALUES ($1, 1, 8, 'taken', '2027-01-07T09:00:00Z', '2027-01-07T09:10:00Z', 3, 5)`,
      [holdoutOwnerId],
    )

    const stored = await client.query(
      'SELECT week, held_out_score, practised_score FROM holdout_checks',
    )

    expect(stored.rows).toEqual([{ week: 8, held_out_score: 3, practised_score: 5 }])
  })

  it('refuses a taken check without its scores', async () => {
    await expect(
      client.query(
        `INSERT INTO holdout_checks (player_id, band, week, kind, begun_at, closed_at)
         VALUES ($1, 1, 8, 'taken', '2027-01-07T09:00:00Z', '2027-01-07T09:10:00Z')`,
        [holdoutOwnerId],
      ),
    ).rejects.toThrow('holdout_checks_kind_terms')
  })

  it('refuses a check of a week ADR 037 does not hold', async () => {
    await expect(
      client.query(
        `INSERT INTO holdout_checks (player_id, band, week, kind, closed_at)
         VALUES ($1, 1, 12, 'skipped', '2027-02-04T09:00:00Z')`,
        [holdoutOwnerId],
      ),
    ).rejects.toThrow('holdout_checks_week_known')
  })

  it('refuses a check of a band the player has not started', async () => {
    await expect(
      client.query(
        `INSERT INTO holdout_checks (player_id, band, week, kind, closed_at)
         VALUES ($1, 2, 8, 'skipped', '2027-02-04T09:00:00Z')`,
        [holdoutOwnerId],
      ),
    ).rejects.toThrow('holdout_checks_band_start_fk')
  })
})
