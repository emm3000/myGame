import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { chromeProgressContract } from '../chromeProgressContract'
import { DrizzleChromeProgress } from './DrizzleChromeProgress'

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

const startedAt = '2026-11-12T08:55:00Z'

chromeProgressContract('DrizzleChromeProgress', async () => {
  await pool.query(
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
  )
  let sites = 0
  return {
    progress: new DrizzleChromeProgress(drizzle(pool)),
    signUp: async (playerId) => {
      await pool.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at, scaffold)
         VALUES ($1, $2, 'argon2id-hash', '2026-11-05T08:00:00Z', '2026-11-05T08:00:00Z', 'es')`,
        [playerId, `${playerId}@example.com`],
      )
    },
    holdCard: async (playerId, wordId) => {
      await pool.query(
        `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
         VALUES ($1, $2, 'learning', 0, NULL, NULL, NULL, NULL, '2026-11-10T08:00:00Z')`,
        [playerId, wordId],
      )
    },
    earnSkill: async (playerId, lessonId) => {
      await pool.query(
        `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
         VALUES ($1, $2, 'food', 5, '2026-11-11T08:00:00Z')`,
        [playerId, lessonId],
      )
    },
    foundTown: async (playerId) => {
      sites += 1
      await pool.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES (gen_random_uuid(), $1, 1, 1, $2, 'Maple Falls', 400, 300, 200, 500, '2026-11-05T08:00:00Z')`,
        [playerId, sites],
      )
    },
    runLesson: async (playerId, lessonId, finishesAt) => {
      await pool.query(
        `INSERT INTO town_lesson_slots (town_id, lesson_id, started_at, finishes_at)
         SELECT id, $2, $3, $4 FROM towns WHERE player_id = $1`,
        [playerId, lessonId, startedAt, new Date(finishesAt.epochMilliseconds).toISOString()],
      )
    },
  }
})
