import { Instant, type PlayerId, type ReviewLogEntry } from '@mygame/domain'
import { asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { reviewLogContract } from '../reviewLogContract'
import { DrizzleReviewLog } from './DrizzleReviewLog'
import { reviewLog } from './schema'
import { storedMemoryCardOf } from './storedMemoryCards'

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
    'TRUNCATE players, towns, town_buildings, player_seen_hints, player_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
  )
}

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  for (const playerId of playerIds) {
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-10-06T08:00:00Z', '2026-10-06T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
  }
}

type LoggedRow = typeof reviewLog.$inferSelect

const loggedEntryOf = (row: LoggedRow): ReviewLogEntry => ({
  playerId: row.playerId,
  wordId: row.wordId,
  reviewedAt: Instant.fromEpochMilliseconds(row.reviewedAt.getTime()),
  format: row.format,
  answer: row.answer,
  nearMissAnswer: row.nearMissAnswer,
  hintShown: row.hintShown,
  rating: row.rating,
  elapsedDays: row.elapsedDays,
  before: storedMemoryCardOf(
    {
      state: row.beforeState,
      step: row.beforeStep,
      stability: row.beforeStability,
      difficulty: row.beforeDifficulty,
      lastReviewAt: row.beforeLastReviewAt,
      lastRating: row.beforeLastRating,
      enteredAt: row.beforeEnteredAt,
      retainedAt: row.beforeRetainedAt,
    },
    `Review log row ${row.id}`,
  ),
  after: storedMemoryCardOf(
    {
      state: row.afterState,
      step: row.afterStep,
      stability: row.afterStability,
      difficulty: row.afterDifficulty,
      lastReviewAt: row.afterLastReviewAt,
      lastRating: row.afterLastRating,
      enteredAt: row.afterEnteredAt,
      retainedAt: row.afterRetainedAt,
    },
    `Review log row ${row.id}`,
  ),
})

const loggedEntriesOf = async (playerId: PlayerId): Promise<ReadonlyArray<ReviewLogEntry>> => {
  const rows = await drizzle(pool)
    .select()
    .from(reviewLog)
    .where(eq(reviewLog.playerId, playerId))
    .orderBy(asc(reviewLog.id))
  return rows.map(loggedEntryOf)
}

reviewLogContract('DrizzleReviewLog', async () => {
  await emptyDatabase()
  return { reviewLog: new DrizzleReviewLog(drizzle(pool)), registerPlayers, loggedEntriesOf }
})
