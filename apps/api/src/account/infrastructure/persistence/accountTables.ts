import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const accountTokenKind = pgEnum('account_token_kind', ['reset', 'verify'])

export const scaffold = pgEnum('scaffold', ['es', 'none'])

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    reportReadAt: timestamp('report_read_at', { withTimezone: true }).notNull(),
    reportServedAt: timestamp('report_served_at', { withTimezone: true }),
    scaffold: scaffold('scaffold').notNull(),
    scaffoldVersion: integer('scaffold_version').notNull().default(0),
  },
  (table) => [uniqueIndex('players_email_unique').on(sql`lower(${table.email})`)],
)

export const sessions = pgTable(
  'sessions',
  {
    tokenDigest: text('token_digest').primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [check('sessions_token_digest_hex', sql`${table.tokenDigest} ~ '^[0-9a-f]{64}$'`)],
)

export const accountTokens = pgTable(
  'account_tokens',
  {
    tokenDigest: text('token_digest').primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    kind: accountTokenKind('kind').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [
    check('account_tokens_token_digest_hex', sql`${table.tokenDigest} ~ '^[0-9a-f]{64}$'`),
  ],
)
