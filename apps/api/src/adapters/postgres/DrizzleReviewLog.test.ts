import { Instant, type PlayerId, type ReviewLogEntry, type StoredMemoryCard } from '@mygame/domain'
import { asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { reviewLogContract } from '../reviewLogContract'
import { DrizzleReviewLog } from './DrizzleReviewLog'
import { reviewLog } from './schema'
import { cardColumnsOf, storedMemoryCardOf } from './storedMemoryCards'

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
    'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
  )
}

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  for (const playerId of playerIds) {
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-10-06T08:00:00Z', '2026-10-06T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
  }
}

type ColumnValue = readonly [column: string, value: unknown]

const cardColumnValuesOf = (
  side: 'before' | 'after',
  stored: StoredMemoryCard,
): ReadonlyArray<ColumnValue> => {
  const columns = cardColumnsOf(stored)
  return [
    [`${side}_state`, columns.state],
    [`${side}_step`, columns.step],
    [`${side}_stability`, columns.stability],
    [`${side}_difficulty`, columns.difficulty],
    [`${side}_last_review_at`, columns.lastReviewAt],
    [`${side}_last_rating`, columns.lastRating],
    [`${side}_entered_at`, columns.enteredAt],
    [`${side}_retained_at`, columns.retainedAt],
  ]
}

const logBeforeTheShownFrame = async (entry: ReviewLogEntry): Promise<void> => {
  const columnValues: ReadonlyArray<ColumnValue> = [
    ['player_id', entry.playerId],
    ['word_id', entry.wordId],
    ['reviewed_at', new Date(entry.reviewedAt.epochMilliseconds)],
    ['format', entry.format],
    ['answer', entry.answer],
    ['near_miss_answer', entry.nearMissAnswer],
    ['hint_shown', entry.hintShown],
    ['rating', entry.rating],
    ['elapsed_days', entry.elapsedDays],
    ...cardColumnValuesOf('before', entry.before),
    ...cardColumnValuesOf('after', entry.after),
  ]
  const columns = columnValues.map(([column]) => column)
  const placeholders = columnValues.map((_, index) => `$${index + 1}`)
  await pool.query(
    `INSERT INTO review_log (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
    columnValues.map(([, value]) => value),
  )
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
  shownFrame: row.shownFrame,
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
  return {
    reviewLog: new DrizzleReviewLog(drizzle(pool)),
    registerPlayers,
    logBeforeTheShownFrame,
    loggedEntriesOf,
  }
})
