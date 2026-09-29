import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const wholeAmount = (name: string, amount: AnyPgColumn) =>
  check(name, sql`${amount} >= 0 AND ${amount} = trunc(${amount})`)

export const terrain = pgEnum('terrain', ['lowlands', 'uplands', 'ridges'])

export const building = pgEnum('building', [
  'sawmill',
  'quarry',
  'iron_mine',
  'farm',
  'warehouse',
  'library',
  'barracks',
])

export const art = pgEnum('art', ['smithing', 'masonry'])

export const fiefEventKind = pgEnum('fief_event_kind', [
  'upgrade_finished',
  'art_learned',
  'upgrade_cancelled',
  'study_cancelled',
])

export const accountTokenKind = pgEnum('account_token_kind', ['reset', 'verify'])

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
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

export const fiefs = pgTable(
  'fiefs',
  {
    id: uuid('id').primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    kingdom: integer('kingdom').notNull(),
    province: integer('province').notNull(),
    plot: integer('plot').notNull(),
    terrain: terrain('terrain').notNull(),
    name: text('name').notNull(),
    wood: doublePrecision('wood').notNull(),
    stone: doublePrecision('stone').notNull(),
    iron: doublePrecision('iron').notNull(),
    gold: doublePrecision('gold').notNull(),
    food: doublePrecision('food').notNull(),
    storedAt: timestamp('stored_at', { withTimezone: true }).notNull(),
    slotBuilding: building('slot_building'),
    slotLevel: integer('slot_level'),
    slotStartedAt: timestamp('slot_started_at', { withTimezone: true }),
    slotFinishesAt: timestamp('slot_finishes_at', { withTimezone: true }),
    slotCostWood: doublePrecision('slot_cost_wood').notNull().default(0),
    slotCostStone: doublePrecision('slot_cost_stone').notNull().default(0),
    slotCostIron: doublePrecision('slot_cost_iron').notNull().default(0),
    slotCostGold: doublePrecision('slot_cost_gold').notNull().default(0),
    slotCostFood: doublePrecision('slot_cost_food').notNull().default(0),
    studyArt: art('study_art'),
    studyLevel: integer('study_level'),
    studyStartedAt: timestamp('study_started_at', { withTimezone: true }),
    studyFinishesAt: timestamp('study_finishes_at', { withTimezone: true }),
    studyCostWood: doublePrecision('study_cost_wood').notNull().default(0),
    studyCostStone: doublePrecision('study_cost_stone').notNull().default(0),
    studyCostIron: doublePrecision('study_cost_iron').notNull().default(0),
    studyCostGold: doublePrecision('study_cost_gold').notNull().default(0),
    studyCostFood: doublePrecision('study_cost_food').notNull().default(0),
  },
  (table) => [
    unique('fiefs_coordinates_unique').on(table.kingdom, table.province, table.plot),
    uniqueIndex('fiefs_player_unique').on(table.playerId),
    wholeAmount('fiefs_wood_whole', table.wood),
    wholeAmount('fiefs_stone_whole', table.stone),
    wholeAmount('fiefs_iron_whole', table.iron),
    wholeAmount('fiefs_gold_whole', table.gold),
    wholeAmount('fiefs_food_whole', table.food),
  ],
)

export const fiefBuildings = pgTable(
  'fief_buildings',
  {
    fiefId: uuid('fief_id')
      .notNull()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    building: building('building').notNull(),
    level: integer('level').notNull(),
  },
  (table) => [primaryKey({ name: 'fief_buildings_pkey', columns: [table.fiefId, table.building] })],
)

export const fiefQueueEntries = pgTable(
  'fief_queue_entries',
  {
    fiefId: uuid('fief_id')
      .notNull()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    building: building('building').notNull(),
    targetLevel: integer('target_level').notNull(),
    costWood: doublePrecision('cost_wood').notNull(),
    costStone: doublePrecision('cost_stone').notNull(),
    costIron: doublePrecision('cost_iron').notNull(),
    costGold: doublePrecision('cost_gold').notNull(),
    costFood: doublePrecision('cost_food').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
  },
  (table) => [
    primaryKey({ name: 'fief_queue_entries_pkey', columns: [table.fiefId, table.position] }),
  ],
)

export const fiefArts = pgTable(
  'fief_arts',
  {
    fiefId: uuid('fief_id')
      .notNull()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    art: art('art').notNull(),
    level: integer('level').notNull(),
  },
  (table) => [primaryKey({ name: 'fief_arts_pkey', columns: [table.fiefId, table.art] })],
)

export const fiefEvents = pgTable(
  'fief_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    fiefId: uuid('fief_id')
      .notNull()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    kind: fiefEventKind('kind').notNull(),
    building: building('building'),
    art: art('art'),
    level: integer('level').notNull(),
    refundWood: doublePrecision('refund_wood').notNull().default(0),
    refundStone: doublePrecision('refund_stone').notNull().default(0),
    refundIron: doublePrecision('refund_iron').notNull().default(0),
    refundGold: doublePrecision('refund_gold').notNull().default(0),
    refundFood: doublePrecision('refund_food').notNull().default(0),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      'fief_events_building_or_art',
      sql`(${table.building} IS NULL) <> (${table.art} IS NULL)`,
    ),
    index('fief_events_fief_order').on(table.fiefId, table.occurredAt, table.id),
  ],
)
