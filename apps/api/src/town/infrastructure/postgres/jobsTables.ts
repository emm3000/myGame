import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { towns, wholeAmount } from './townTables'

export const townJobs = pgTable(
  'town_jobs',
  {
    townId: uuid('town_id')
      .primaryKey()
      .references(() => towns.id, { onDelete: 'cascade' }),
    region: integer('region').notNull(),
    area: integer('area').notNull(),
    site: integer('site').notNull(),
    workerCount: integer('worker_count').notNull(),
    truckCount: integer('truck_count').notNull(),
    hours: integer('hours').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    oneWaySeconds: integer('one_way_seconds').notNull(),
    payMoney: doublePrecision('pay_money').notNull(),
    payFood: doublePrecision('pay_food').notNull(),
    payPower: doublePrecision('pay_power').notNull(),
    payMaterial: doublePrecision('pay_material').notNull(),
    payPercentMoney: integer('pay_percent_money').notNull(),
    payPercentFood: integer('pay_percent_food').notNull(),
    payPercentPower: integer('pay_percent_power').notNull(),
    payPercentMaterial: integer('pay_percent_material').notNull(),
    calledBackAt: timestamp('called_back_at', { withTimezone: true }),
    wasteSize: integer('waste_size'),
    waste: integer('waste'),
    strength: integer('strength'),
    hasArrived: boolean('has_arrived').notNull().default(false),
  },
  (table) => [
    check(
      'town_jobs_site_positive',
      sql`${table.region} >= 1 AND ${table.area} >= 1 AND ${table.site} >= 1`,
    ),
    check(
      'town_jobs_team_not_empty',
      sql`${table.workerCount} >= 0 AND ${table.truckCount} >= 0 AND ${table.workerCount} + ${table.truckCount} >= 1`,
    ),
    check(
      'town_jobs_clean_up_terms',
      sql`(${table.wasteSize} IS NULL AND ${table.waste} IS NULL AND ${table.strength} IS NULL AND NOT ${table.hasArrived} AND ${table.hours} >= 1) OR (${table.wasteSize} IS NOT NULL AND ${table.waste} IS NOT NULL AND ${table.strength} IS NOT NULL AND ${table.wasteSize} BETWEEN 1 AND 3 AND ${table.waste} >= 0 AND ${table.strength} >= 1 AND ${table.hours} = 0 AND NOT (${table.hasArrived} AND ${table.calledBackAt} IS NOT NULL))`,
    ),
    check('town_jobs_one_way_seconds_whole', sql`${table.oneWaySeconds} >= 0`),
    wholeAmount('town_jobs_pay_money_whole', table.payMoney),
    wholeAmount('town_jobs_pay_food_whole', table.payFood),
    wholeAmount('town_jobs_pay_power_whole', table.payPower),
    wholeAmount('town_jobs_pay_material_whole', table.payMaterial),
    check(
      'town_jobs_pay_percents_positive',
      sql`${table.payPercentMoney} >= 1 AND ${table.payPercentFood} >= 1 AND ${table.payPercentPower} >= 1 AND ${table.payPercentMaterial} >= 1`,
    ),
    check(
      'town_jobs_called_back_after_sent',
      sql`${table.calledBackAt} IS NULL OR ${table.calledBackAt} >= ${table.sentAt}`,
    ),
  ],
)

export const siteCleanUps = pgTable(
  'site_clean_ups',
  {
    townId: uuid('town_id')
      .notNull()
      .references(() => towns.id, { onDelete: 'cascade' }),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    region: integer('region').notNull(),
    area: integer('area').notNull(),
    site: integer('site').notNull(),
    cleanedAt: timestamp('cleaned_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ name: 'site_clean_ups_pkey', columns: [table.townId, table.sentAt] }),
    index('site_clean_ups_site_order').on(table.region, table.area, table.site, table.cleanedAt),
    check(
      'site_clean_ups_site_positive',
      sql`${table.region} >= 1 AND ${table.area} >= 1 AND ${table.site} >= 1`,
    ),
    check('site_clean_ups_cleaned_after_sent', sql`${table.cleanedAt} >= ${table.sentAt}`),
  ],
)
