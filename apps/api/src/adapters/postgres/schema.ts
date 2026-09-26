import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  check,
  doublePrecision,
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

export const building = pgEnum('building', ['sawmill', 'quarry', 'iron_mine', 'farm', 'warehouse'])

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
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
