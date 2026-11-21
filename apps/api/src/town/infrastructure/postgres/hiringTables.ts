import { sql } from 'drizzle-orm'
import {
  check,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { towns, wholeAmount } from './townTables'

export const townHire = pgEnum('town_hire', ['worker', 'truck'])

export const townHires = pgTable(
  'town_hires',
  {
    townId: uuid('town_id')
      .notNull()
      .references(() => towns.id, { onDelete: 'cascade' }),
    hire: townHire('hire').notNull(),
    count: integer('count').notNull(),
  },
  (table) => [
    primaryKey({ name: 'town_hires_pkey', columns: [table.townId, table.hire] }),
    check('town_hires_count_whole', sql`${table.count} >= 0`),
  ],
)

export const townHiringOrders = pgTable(
  'town_hiring_orders',
  {
    townId: uuid('town_id')
      .primaryKey()
      .references(() => towns.id, { onDelete: 'cascade' }),
    hire: townHire('hire').notNull(),
    count: integer('count').notNull(),
    costMoney: doublePrecision('cost_money').notNull(),
    costFood: doublePrecision('cost_food').notNull(),
    costPower: doublePrecision('cost_power').notNull(),
    costMaterial: doublePrecision('cost_material').notNull(),
    secondsPerHire: integer('seconds_per_hire').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check('town_hiring_orders_count_positive', sql`${table.count} >= 1`),
    check('town_hiring_orders_seconds_per_hire_positive', sql`${table.secondsPerHire} >= 1`),
    wholeAmount('town_hiring_orders_cost_money_whole', table.costMoney),
    wholeAmount('town_hiring_orders_cost_food_whole', table.costFood),
    wholeAmount('town_hiring_orders_cost_power_whole', table.costPower),
    wholeAmount('town_hiring_orders_cost_material_whole', table.costMaterial),
  ],
)
