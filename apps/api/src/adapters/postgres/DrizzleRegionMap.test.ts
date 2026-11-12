import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, assert, beforeAll } from 'vitest'
import { regionMapContract } from '../regionMapContract'
import { DrizzleRegionMap } from './DrizzleRegionMap'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import { players } from './schema'

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
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, cards, pending_reviews, review_log, sessions, account_tokens',
  )
}

regionMapContract('DrizzleRegionMap', async (heldTowns) => {
  await emptyDatabase()
  const database = drizzle(pool)
  const townRepository = new DrizzleTownRepository(database, 'lockFree')
  for (const town of heldTowns) {
    await database.insert(players).values({
      id: town.playerId,
      email: `${town.playerId}@example.com`,
      passwordHash: 'argon2id-hash',
      createdAt: new Date('2026-11-10T08:00:00Z'),
      reportReadAt: new Date('2026-11-10T08:00:00Z'),
    })
    assert((await townRepository.save(town)).ok)
  }
  return new DrizzleRegionMap(database)
})
