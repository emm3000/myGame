import { drizzle } from 'drizzle-orm/node-postgres'
import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ana,
  insertPlayersBeforeTheReport,
} from '#account/infrastructure/postgres/migrationPlayers.testSupport'
import {
  closeWithoutChanges,
  migratedFrom,
  migratedThroughNext,
  openEmptyDatabase,
} from '#platform/infrastructure/postgres/migrationDatabase.testSupport'
import { DrizzleCardRepository } from './DrizzleCardRepository'

describe('the learning memory migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('holds no card for a player stored before the migration', async () => {
    await migratedFrom(client, 30, async () => {
      await insertPlayersBeforeTheReport(client)
    })

    expect(await new DrizzleCardRepository(drizzle(client)).cardsOf(ana.id)).toEqual({
      ok: true,
      value: [],
    })
  })
})

const shownFrameOwnerId = '00000000-0000-4000-8000-0000000000a7'

const migrationsBeforeTheShownFrame = 41

describe('the shown frame migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheShownFrame, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'learner@example.com', 'argon2id-hash', '2026-11-12T08:00:00Z', '2026-11-12T08:00:00Z')`,
        [shownFrameOwnerId],
      )
      await client.query(
        `INSERT INTO cards (player_id, word_id, state, step, entered_at)
         VALUES ($1, 'lesson-1-1', 'learning', 0, '2026-11-12T09:00:00Z')`,
        [shownFrameOwnerId],
      )
      await client.query(
        `INSERT INTO pending_reviews (player_id, word_id, hint_shown) VALUES ($1, 'lesson-1-1', true)`,
        [shownFrameOwnerId],
      )
      await client.query(
        `INSERT INTO review_log (player_id, word_id, reviewed_at, format, answer, hint_shown, rating,
           before_state, before_step, before_entered_at,
           after_state, after_step, after_stability, after_difficulty, after_last_review_at, after_last_rating, after_entered_at)
         VALUES ($1, 'lesson-1-1', '2026-11-12T09:00:00Z', 'recognition', 'abc12345', false, 'good',
           'learning', 0, '2026-11-12T09:00:00Z',
           'learning', 1, 2.3, 2.1, '2026-11-12T09:00:00Z', 'good', '2026-11-12T09:00:00Z')`,
        [shownFrameOwnerId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a review logged before the migration with no frame', async () => {
    const logged = await client.query('SELECT word_id, shown_frame FROM review_log')

    expect(logged.rows).toEqual([{ word_id: 'lesson-1-1', shown_frame: null }])
  })

  it('keeps a pending review stored before the migration with no frame', async () => {
    const pending = await client.query('SELECT word_id, shown_frame FROM pending_reviews')

    expect(pending.rows).toEqual([{ word_id: 'lesson-1-1', shown_frame: null }])
  })
})
