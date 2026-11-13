import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, assert, beforeAll } from 'vitest'
import { guidanceDismissalsContract } from '../guidanceDismissalsContract'
import { DrizzleGuidanceDismissals } from './DrizzleGuidanceDismissals'
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

const emptyDatabase = async (): Promise<void> => {
  await pool.query(
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
  )
}

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  for (const playerId of playerIds) {
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at, report_read_at, scaffold)
       VALUES ($1, $2, 'argon2id-hash', '2026-11-11T08:00:00Z', '2026-11-11T08:00:00Z', 'es')`,
      [playerId, `${playerId}@example.com`],
    )
  }
}

guidanceDismissalsContract('DrizzleGuidanceDismissals', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  const towns = new DrizzleTownRepository(database, 'lockFree')
  return {
    dismissals: new DrizzleGuidanceDismissals(database),
    towns,
    registerPlayers,
    dismissedAtOf: async (playerId) => {
      const read = await towns.townWithSchoolOf(playerId)
      assert(read.ok)
      return read.value?.guidanceDismissedAt
    },
  }
})
