import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { townNewsContract } from '../townNewsContract'
import { DrizzleTownNews } from './DrizzleTownNews'

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

const registerTowns = async (townIds: ReadonlyArray<string>): Promise<void> => {
  for (const [index, townId] of townIds.entries()) {
    const playerId = `00000000-0000-4000-8000-00000000000${index + 1}`
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-11-05T08:00:00Z', '2026-11-05T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
    await pool.query(
      `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
       VALUES ($1, $2, 1, 1, $3, 'Maple Falls', 400, 300, 200, 500, '2026-11-05T08:00:00Z')`,
      [townId, playerId, index + 1],
    )
  }
}

const rolledBack = new Error('rolled back on purpose')

townNewsContract('DrizzleTownNews', async () => {
  await pool.query(
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
  )
  const database = drizzle(pool)
  return {
    news: new DrizzleTownNews(database),
    registerTowns,
    recordThenRollBack: async (townId, events) => {
      await database
        .transaction(async (transaction) => {
          await new DrizzleTownNews(transaction).record(townId, events)
          throw rolledBack
        })
        .catch((error: unknown) => {
          if (error !== rolledBack) {
            throw error
          }
        })
    },
  }
})
