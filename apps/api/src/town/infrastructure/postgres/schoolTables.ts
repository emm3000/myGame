import { sql } from 'drizzle-orm'
import { check, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { players } from '#account/infrastructure/postgres/accountTables'
import { townResource, towns } from './townTables'

export const earnedSkills = pgTable(
  'earned_skills',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    resource: townResource('resource').notNull(),
    ratePercent: integer('rate_percent').notNull(),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ name: 'earned_skills_pkey', columns: [table.playerId, table.lessonId] }),
    check('earned_skills_rate_percent_positive', sql`${table.ratePercent} >= 1`),
  ],
)

export const townLessonSlots = pgTable(
  'town_lesson_slots',
  {
    townId: uuid('town_id')
      .primaryKey()
      .references(() => towns.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishesAt: timestamp('finishes_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      'town_lesson_slots_started_before_finish',
      sql`${table.startedAt} <= ${table.finishesAt}`,
    ),
  ],
)
