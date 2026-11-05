import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { pendingReviewRepositoryContract } from '../pendingReviewRepositoryContract'
import { DrizzlePendingReviewRepository } from './DrizzlePendingReviewRepository'

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

const emptyDatabase = async (): Promise<void> => {
  await pool.query(
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, player_seen_hints, player_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
  )
}

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  for (const playerId of playerIds) {
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-10-06T08:00:00Z', '2026-10-06T08:00:00Z', '2026-10-06T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
  }
}

const registerCards = async (playerId: string, wordIds: ReadonlyArray<string>): Promise<void> => {
  for (const wordId of wordIds) {
    await pool.query(
      `INSERT INTO cards (player_id, word_id, state, step, entered_at)
       VALUES ($1, $2, 'learning', 0, '2026-11-10T09:00:00Z')`,
      [playerId, wordId],
    )
  }
}

pendingReviewRepositoryContract('DrizzlePendingReviewRepository', async () => {
  await emptyDatabase()
  return {
    pendingReviews: new DrizzlePendingReviewRepository(drizzle(pool)),
    registerPlayers,
    registerCards,
  }
})
