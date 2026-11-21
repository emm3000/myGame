import { sql } from 'drizzle-orm'
import {
  boolean,
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
import { players } from '#account/infrastructure/postgres/accountTables'

export const bandStarts = pgTable(
  'band_starts',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    band: integer('band').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ name: 'band_starts_pkey', columns: [table.playerId, table.band] }),
    check('band_starts_band_known', sql`${table.band} BETWEEN 1 AND 3`),
  ],
)

export const heldOutWords = pgTable(
  'held_out_words',
  {
    playerId: uuid('player_id').notNull(),
    band: integer('band').notNull(),
    headword: text('headword').notNull(),
  },
  (table) => [
    primaryKey({ name: 'held_out_words_pkey', columns: [table.playerId, table.headword] }),
    foreignKey({
      name: 'held_out_words_band_start_fk',
      columns: [table.playerId, table.band],
      foreignColumns: [bandStarts.playerId, bandStarts.band],
    }).onDelete('cascade'),
  ],
)

export const holdoutCheckKind = pgEnum('holdout_check_kind', ['begun', 'taken', 'skipped'])

export const holdoutChecks = pgTable(
  'holdout_checks',
  {
    playerId: uuid('player_id').notNull(),
    band: integer('band').notNull(),
    week: integer('week').notNull(),
    kind: holdoutCheckKind('kind').notNull(),
    begunAt: timestamp('begun_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    heldOutScore: integer('held_out_score'),
    practisedScore: integer('practised_score'),
  },
  (table) => [
    primaryKey({
      name: 'holdout_checks_pkey',
      columns: [table.playerId, table.band, table.week],
    }),
    check('holdout_checks_week_known', sql`${table.week} IN (8, 24)`),
    check(
      'holdout_checks_kind_terms',
      sql`(${table.kind} = 'begun' AND ${table.begunAt} IS NOT NULL AND ${table.closedAt} IS NULL AND ${table.heldOutScore} IS NULL AND ${table.practisedScore} IS NULL) OR (${table.kind} = 'taken' AND ${table.begunAt} IS NOT NULL AND ${table.closedAt} IS NOT NULL AND ${table.heldOutScore} IS NOT NULL AND ${table.practisedScore} IS NOT NULL AND ${table.heldOutScore} >= 0 AND ${table.practisedScore} >= 0 AND ${table.begunAt} <= ${table.closedAt}) OR (${table.kind} = 'skipped' AND ${table.begunAt} IS NULL AND ${table.closedAt} IS NOT NULL AND ${table.heldOutScore} IS NULL AND ${table.practisedScore} IS NULL)`,
    ),
    foreignKey({
      name: 'holdout_checks_band_start_fk',
      columns: [table.playerId, table.band],
      foreignColumns: [bandStarts.playerId, bandStarts.band],
    }).onDelete('cascade'),
  ],
)

export const holdoutCheckWords = pgTable(
  'holdout_check_words',
  {
    playerId: uuid('player_id').notNull(),
    band: integer('band').notNull(),
    week: integer('week').notNull(),
    position: integer('position').notNull(),
    wordId: text('word_id').notNull(),
    isHeldOut: boolean('is_held_out').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'holdout_check_words_pkey',
      columns: [table.playerId, table.band, table.week, table.position],
    }),
    unique('holdout_check_words_word_unique').on(
      table.playerId,
      table.band,
      table.week,
      table.wordId,
    ),
    check('holdout_check_words_position_positive', sql`${table.position} >= 1`),
    foreignKey({
      name: 'holdout_check_words_check_fk',
      columns: [table.playerId, table.band, table.week],
      foreignColumns: [holdoutChecks.playerId, holdoutChecks.band, holdoutChecks.week],
    }).onDelete('cascade'),
  ],
)
