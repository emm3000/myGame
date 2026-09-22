import { sql } from 'drizzle-orm'
import {
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

export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

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
    slotFinishesAt: timestamp('slot_finishes_at', { withTimezone: true }),
  },
  (table) => [unique('fiefs_coordinates_unique').on(table.kingdom, table.province, table.plot)],
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
