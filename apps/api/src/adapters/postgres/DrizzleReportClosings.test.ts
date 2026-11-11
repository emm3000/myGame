import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { reportClosingsContract } from '../reportClosingsContract'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleReportClosings } from './DrizzleReportClosings'

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
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, earned_skills, band_starts, held_out_words, cards, pending_reviews, review_log, sessions, account_tokens',
  )
}

reportClosingsContract('DrizzleReportClosings', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  const accounts = new DrizzleAccounts(database)
  return {
    closings: new DrizzleReportClosings(database),
    signUp: async (playerId, at) => {
      await accounts.addPlayer({
        id: playerId,
        email: `${playerId}@example.com`,
        passwordHash: 'argon2id-hash',
        createdAt: at,
      })
    },
  }
})
