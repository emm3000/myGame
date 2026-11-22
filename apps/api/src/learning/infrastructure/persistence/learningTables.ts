import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { players } from '#account/infrastructure/persistence/accountTables'

export const memoryState = pgEnum('memory_state', ['learning', 'review', 'relearning'])

export const memoryRating = pgEnum('memory_rating', ['again', 'hard', 'good', 'easy'])

export const reviewFormat = pgEnum('review_format', ['recognition', 'recall'])

export const cards = pgTable(
  'cards',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    wordId: text('word_id').notNull(),
    state: memoryState('state').notNull(),
    step: integer('step'),
    stability: doublePrecision('stability'),
    difficulty: doublePrecision('difficulty'),
    lastReviewAt: timestamp('last_review_at', { withTimezone: true }),
    lastRating: memoryRating('last_rating'),
    enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
    retainedAt: timestamp('retained_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ name: 'cards_pkey', columns: [table.playerId, table.wordId] }),
    check(
      'cards_step_terms',
      sql`(${table.step} IS NULL) = (${table.state}::text = 'review') AND (${table.step} IS NULL OR ${table.step} >= 0)`,
    ),
    check(
      'cards_review_terms',
      sql`num_nulls(${table.stability}, ${table.difficulty}, ${table.lastReviewAt}, ${table.lastRating}) IN (0, 4) AND (${table.lastReviewAt} IS NOT NULL OR ${table.state}::text = 'learning')`,
    ),
    check(
      'cards_memory_bounds',
      sql`(${table.stability} IS NULL OR ${table.stability} > 0) AND (${table.difficulty} IS NULL OR ${table.difficulty} BETWEEN 1 AND 10)`,
    ),
    check(
      'cards_retained_at_last_review',
      sql`${table.retainedAt} IS NULL OR ${table.retainedAt} = ${table.lastReviewAt}`,
    ),
  ],
)

export const pendingReviews = pgTable(
  'pending_reviews',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    wordId: text('word_id').notNull(),
    hintShown: boolean('hint_shown').notNull(),
    nearMissAnswer: text('near_miss_answer'),
    shownFrame: text('shown_frame'),
  },
  (table) => [
    primaryKey({ name: 'pending_reviews_pkey', columns: [table.playerId, table.wordId] }),
    foreignKey({
      name: 'pending_reviews_card_fk',
      columns: [table.playerId, table.wordId],
      foreignColumns: [cards.playerId, cards.wordId],
    }).onDelete('cascade'),
  ],
)

export const reviewLog = pgTable(
  'review_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    wordId: text('word_id').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull(),
    format: reviewFormat('format').notNull(),
    answer: text('answer').notNull(),
    nearMissAnswer: text('near_miss_answer'),
    hintShown: boolean('hint_shown').notNull(),
    rating: memoryRating('rating').notNull(),
    elapsedDays: integer('elapsed_days'),
    shownFrame: text('shown_frame'),
    beforeState: memoryState('before_state').notNull(),
    beforeStep: integer('before_step'),
    beforeStability: doublePrecision('before_stability'),
    beforeDifficulty: doublePrecision('before_difficulty'),
    beforeLastReviewAt: timestamp('before_last_review_at', { withTimezone: true }),
    beforeLastRating: memoryRating('before_last_rating'),
    beforeEnteredAt: timestamp('before_entered_at', { withTimezone: true }).notNull(),
    beforeRetainedAt: timestamp('before_retained_at', { withTimezone: true }),
    afterState: memoryState('after_state').notNull(),
    afterStep: integer('after_step'),
    afterStability: doublePrecision('after_stability').notNull(),
    afterDifficulty: doublePrecision('after_difficulty').notNull(),
    afterLastReviewAt: timestamp('after_last_review_at', { withTimezone: true }).notNull(),
    afterLastRating: memoryRating('after_last_rating').notNull(),
    afterEnteredAt: timestamp('after_entered_at', { withTimezone: true }).notNull(),
    afterRetainedAt: timestamp('after_retained_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'review_log_elapsed_days_terms',
      sql`(${table.elapsedDays} IS NULL) = (${table.beforeLastReviewAt} IS NULL) AND (${table.elapsedDays} IS NULL OR ${table.elapsedDays} >= 0)`,
    ),
    index('review_log_player_order').on(table.playerId, table.reviewedAt, table.id),
  ],
)
