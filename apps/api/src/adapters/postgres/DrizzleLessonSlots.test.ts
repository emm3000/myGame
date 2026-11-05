import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { lessonSlotRepositoryContract } from '../lessonSlotRepositoryContract'
import { DrizzleLessonSlots } from './DrizzleLessonSlots'

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
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-11-05T08:00:00Z', '2026-11-05T08:00:00Z', '2026-11-05T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
    await pool.query(
      `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
       VALUES ($1, $2, 1, 1, $3, 'Maple Falls', 400, 300, 200, 500, '2026-11-05T08:00:00Z')`,
      [townId, playerId, index + 1],
    )
  }
}

lessonSlotRepositoryContract('DrizzleLessonSlots', async () => {
  await pool.query(
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, player_seen_hints, player_skills, earned_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
  )
  return { lessonSlots: new DrizzleLessonSlots(drizzle(pool)), registerTowns }
})
