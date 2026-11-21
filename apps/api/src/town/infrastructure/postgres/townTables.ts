import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  type CheckBuilder,
  check,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { players } from '../../../account/infrastructure/postgres/accountTables'

export const wholeAmount = (name: string, amount: AnyPgColumn): CheckBuilder =>
  check(name, sql`${amount} >= 0 AND ${amount} = trunc(${amount})`)

export const townBuilding = pgEnum('town_building', [
  'homes',
  'farm',
  'factory',
  'power_station',
  'storage',
  'school',
  'office',
])

export const townResource = pgEnum('town_resource', ['money', 'food', 'power', 'material'])

export const towns = pgTable(
  'towns',
  {
    id: uuid('id').primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    region: integer('region').notNull(),
    area: integer('area').notNull(),
    site: integer('site').notNull(),
    name: text('name').notNull(),
    money: doublePrecision('money').notNull(),
    food: doublePrecision('food').notNull(),
    power: doublePrecision('power').notNull(),
    material: doublePrecision('material').notNull(),
    storedAt: timestamp('stored_at', { withTimezone: true }).notNull(),
    fullSinceMoney: timestamp('full_since_money', { withTimezone: true }),
    fullSinceFood: timestamp('full_since_food', { withTimezone: true }),
    fullSincePower: timestamp('full_since_power', { withTimezone: true }),
    fullSinceMaterial: timestamp('full_since_material', { withTimezone: true }),
    workBuilding: townBuilding('work_building'),
    workLevel: integer('work_level'),
    workStartedAt: timestamp('work_started_at', { withTimezone: true }),
    workFinishesAt: timestamp('work_finishes_at', { withTimezone: true }),
    workCostMoney: doublePrecision('work_cost_money'),
    workCostFood: doublePrecision('work_cost_food'),
    workCostPower: doublePrecision('work_cost_power'),
    workCostMaterial: doublePrecision('work_cost_material'),
    guidanceDismissedAt: timestamp('guidance_dismissed_at', { withTimezone: true }),
  },
  (table) => [
    unique('towns_player_unique').on(table.playerId),
    check(
      'towns_work_slot_terms',
      sql`num_nonnulls(${table.workBuilding}, ${table.workLevel}, ${table.workStartedAt}, ${table.workFinishesAt}, ${table.workCostMoney}, ${table.workCostFood}, ${table.workCostPower}, ${table.workCostMaterial}) = 0 OR (num_nonnulls(${table.workBuilding}, ${table.workLevel}, ${table.workStartedAt}, ${table.workFinishesAt}, ${table.workCostMoney}, ${table.workCostFood}, ${table.workCostPower}, ${table.workCostMaterial}) = 8 AND ${table.workLevel} >= 1 AND ${table.workStartedAt} <= ${table.workFinishesAt} AND ${table.workCostMoney} >= 0 AND ${table.workCostMoney} = trunc(${table.workCostMoney}) AND ${table.workCostFood} >= 0 AND ${table.workCostFood} = trunc(${table.workCostFood}) AND ${table.workCostPower} >= 0 AND ${table.workCostPower} = trunc(${table.workCostPower}) AND ${table.workCostMaterial} >= 0 AND ${table.workCostMaterial} = trunc(${table.workCostMaterial}))`,
    ),
    unique('towns_site_unique').on(table.region, table.area, table.site),
    check(
      'towns_address_positive',
      sql`${table.region} >= 1 AND ${table.area} >= 1 AND ${table.site} >= 1`,
    ),
    wholeAmount('towns_money_whole', table.money),
    wholeAmount('towns_food_whole', table.food),
    wholeAmount('towns_power_whole', table.power),
    wholeAmount('towns_material_whole', table.material),
  ],
)

export const townBuildings = pgTable(
  'town_buildings',
  {
    townId: uuid('town_id')
      .notNull()
      .references(() => towns.id, { onDelete: 'cascade' }),
    building: townBuilding('building').notNull(),
    level: integer('level').notNull(),
  },
  (table) => [
    primaryKey({ name: 'town_buildings_pkey', columns: [table.townId, table.building] }),
    check('town_buildings_level_whole', sql`${table.level} >= 0`),
  ],
)

export const townWaitingWork = pgTable(
  'town_waiting_work',
  {
    townId: uuid('town_id')
      .notNull()
      .references(() => towns.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    building: townBuilding('building').notNull(),
    level: integer('level').notNull(),
    costMoney: doublePrecision('cost_money').notNull(),
    costFood: doublePrecision('cost_food').notNull(),
    costPower: doublePrecision('cost_power').notNull(),
    costMaterial: doublePrecision('cost_material').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
  },
  (table) => [
    primaryKey({ name: 'town_waiting_work_pkey', columns: [table.townId, table.position] }),
    check('town_waiting_work_position_whole', sql`${table.position} >= 0`),
    check('town_waiting_work_level_positive', sql`${table.level} >= 1`),
    check('town_waiting_work_duration_whole', sql`${table.durationSeconds} >= 0`),
    wholeAmount('town_waiting_work_cost_money_whole', table.costMoney),
    wholeAmount('town_waiting_work_cost_food_whole', table.costFood),
    wholeAmount('town_waiting_work_cost_power_whole', table.costPower),
    wholeAmount('town_waiting_work_cost_material_whole', table.costMaterial),
  ],
)

export type TownRow = typeof towns.$inferSelect
