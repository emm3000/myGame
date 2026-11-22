import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { players } from '#account/infrastructure/persistence/accountTables'

export const placementKind = pgEnum('placement_kind', ['taken', 'skipped'])

export const placements = pgTable('placements', {
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  kind: placementKind('kind').notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull(),
})

export const placementWords = pgTable(
  'placement_words',
  {
    playerId: uuid('player_id').notNull(),
    band: integer('band').notNull(),
    position: integer('position').notNull(),
    wordId: text('word_id').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'placement_words_pkey',
      columns: [table.playerId, table.band, table.position],
    }),
    unique('placement_words_word_unique').on(table.playerId, table.band, table.wordId),
    check('placement_words_band_known', sql`${table.band} BETWEEN 1 AND 3`),
    check('placement_words_position_positive', sql`${table.position} >= 1`),
    foreignKey({
      name: 'placement_words_placement_fk',
      columns: [table.playerId],
      foreignColumns: [placements.playerId],
    }).onDelete('cascade'),
  ],
)

export const placementScores = pgTable(
  'placement_scores',
  {
    playerId: uuid('player_id').notNull(),
    band: integer('band').notNull(),
    score: integer('score').notNull(),
    takenAt: timestamp('taken_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ name: 'placement_scores_pkey', columns: [table.playerId, table.band] }),
    check('placement_scores_band_known', sql`${table.band} BETWEEN 1 AND 3`),
    check('placement_scores_score_range', sql`${table.score} BETWEEN 0 AND 30`),
    foreignKey({
      name: 'placement_scores_placement_fk',
      columns: [table.playerId],
      foreignColumns: [placements.playerId],
    }).onDelete('cascade'),
  ],
)
