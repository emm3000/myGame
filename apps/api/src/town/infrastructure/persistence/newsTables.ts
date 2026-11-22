import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { townHire } from './hiringTables'
import { townBuilding, townResource, towns, wholeAmount } from './townTables'

export const townEventKind = pgEnum('town_event_kind', [
  'building_work_finished',
  'building_work_stopped',
  'lesson_studied',
  'lesson_stopped',
  'skill_earned',
  'hiring_delivered',
  'hiring_stopped',
  'job_back',
  'job_called_back',
  'clean_up_done',
  'clean_up_failed',
  'became_city',
])

export const townEvents = pgTable(
  'town_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    townId: uuid('town_id')
      .notNull()
      .references(() => towns.id, { onDelete: 'cascade' }),
    kind: townEventKind('kind').notNull(),
    building: townBuilding('building'),
    level: integer('level'),
    lessonId: text('lesson_id'),
    resource: townResource('resource'),
    ratePercent: integer('rate_percent'),
    hire: townHire('hire'),
    count: integer('count'),
    stoppedCount: integer('stopped_count'),
    region: integer('region'),
    area: integer('area'),
    site: integer('site'),
    amountMoney: doublePrecision('amount_money').notNull().default(0),
    amountFood: doublePrecision('amount_food').notNull().default(0),
    amountPower: doublePrecision('amount_power').notNull().default(0),
    amountMaterial: doublePrecision('amount_material').notNull().default(0),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('town_events_town_order').on(table.townId, table.occurredAt, table.id),
    check(
      'town_events_building_terms',
      sql`CASE WHEN ${table.kind}::text IN ('building_work_finished', 'building_work_stopped') THEN ${table.building} IS NOT NULL AND ${table.level} IS NOT NULL AND ${table.level} >= 1 ELSE ${table.building} IS NULL AND ${table.level} IS NULL END`,
    ),
    check(
      'town_events_site_terms',
      sql`num_nonnulls(${table.region}, ${table.area}, ${table.site}) = 0 OR (num_nonnulls(${table.region}, ${table.area}, ${table.site}) = 3 AND ${table.region} >= 1 AND ${table.area} >= 1 AND ${table.site} >= 1)`,
    ),
    wholeAmount('town_events_amount_money_whole', table.amountMoney),
    wholeAmount('town_events_amount_food_whole', table.amountFood),
    wholeAmount('town_events_amount_power_whole', table.amountPower),
    wholeAmount('town_events_amount_material_whole', table.amountMaterial),
  ],
)
