import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  boolean,
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

export const unit = pgEnum('unit', ['infantry'])

export const marchOrder = pgEnum('march_order', ['forage', 'attack'])

export const fiefEventKind = pgEnum('fief_event_kind', [
  'upgrade_finished',
  'art_learned',
  'upgrade_cancelled',
  'study_cancelled',
  'recruits_delivered',
  'recruits_cancelled',
  'march_returned',
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

export const fiefUnits = pgTable(
  'fief_units',
  {
    fiefId: uuid('fief_id')
      .notNull()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    kind: unit('kind').notNull(),
    count: integer('count').notNull(),
  },
  (table) => [
    primaryKey({ name: 'fief_units_pkey', columns: [table.fiefId, table.kind] }),
    check('fief_units_count_whole', sql`${table.count} >= 0`),
  ],
)

export const fiefRecruitOrders = pgTable(
  'fief_recruit_orders',
  {
    fiefId: uuid('fief_id')
      .primaryKey()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    kind: unit('kind').notNull(),
    count: integer('count').notNull(),
    costWood: doublePrecision('cost_wood').notNull(),
    costStone: doublePrecision('cost_stone').notNull(),
    costIron: doublePrecision('cost_iron').notNull(),
    costGold: doublePrecision('cost_gold').notNull(),
    costFood: doublePrecision('cost_food').notNull(),
    perUnitSeconds: integer('per_unit_seconds').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check('fief_recruit_orders_count_positive', sql`${table.count} >= 1`),
    check('fief_recruit_orders_per_unit_seconds_positive', sql`${table.perUnitSeconds} >= 1`),
  ],
)

export const fiefMarches = pgTable(
  'fief_marches',
  {
    fiefId: uuid('fief_id')
      .primaryKey()
      .references(() => fiefs.id, { onDelete: 'cascade' }),
    province: integer('province').notNull(),
    plot: integer('plot').notNull(),
    infantry: integer('infantry').notNull(),
    stayHours: integer('stay_hours').notNull(),
    oneWaySeconds: integer('one_way_seconds').notNull(),
    departedAt: timestamp('departed_at', { withTimezone: true }).notNull(),
    lootWood: doublePrecision('loot_wood').notNull(),
    lootStone: doublePrecision('loot_stone').notNull(),
    lootIron: doublePrecision('loot_iron').notNull(),
    lootGold: doublePrecision('loot_gold').notNull(),
    lootFood: doublePrecision('loot_food').notNull(),
    recalledAt: timestamp('recalled_at', { withTimezone: true }),
    marchOrder: marchOrder('march_order').notNull().default('forage'),
    campTier: integer('camp_tier'),
    campStrength: integer('camp_strength'),
    fought: boolean('fought').notNull().default(false),
  },
  (table) => [
    check('fief_marches_province_positive', sql`${table.province} >= 1`),
    check('fief_marches_plot_positive', sql`${table.plot} >= 1`),
    check('fief_marches_infantry_positive', sql`${table.infantry} >= 1`),
    check(
      'fief_marches_order_terms',
      sql`(${table.marchOrder}::text = 'forage' AND ${table.stayHours} >= 1 AND ${table.campTier} IS NULL AND ${table.campStrength} IS NULL AND NOT ${table.fought}) OR (${table.marchOrder}::text = 'attack' AND ${table.stayHours} = 0 AND ${table.campTier} IS NOT NULL AND ${table.campTier} BETWEEN 1 AND 3 AND ${table.campStrength} IS NOT NULL AND ${table.campStrength} >= 0)`,
    ),
    check('fief_marches_one_way_seconds_positive', sql`${table.oneWaySeconds} >= 1`),
    wholeAmount('fief_marches_loot_wood_whole', table.lootWood),
    wholeAmount('fief_marches_loot_stone_whole', table.lootStone),
    wholeAmount('fief_marches_loot_iron_whole', table.lootIron),
    wholeAmount('fief_marches_loot_gold_whole', table.lootGold),
    wholeAmount('fief_marches_loot_food_whole', table.lootFood),
    check(
      'fief_marches_recalled_after_departure',
      sql`${table.recalledAt} IS NULL OR ${table.recalledAt} >= ${table.departedAt}`,
    ),
  ],
)

export const campBattles = pgTable(
  'camp_battles',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    kingdom: integer('kingdom').notNull(),
    province: integer('province').notNull(),
    plot: integer('plot').notNull(),
    strength: integer('strength').notNull(),
    foughtAt: timestamp('fought_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check('camp_battles_kingdom_positive', sql`${table.kingdom} >= 1`),
    check('camp_battles_province_positive', sql`${table.province} >= 1`),
    check('camp_battles_plot_positive', sql`${table.plot} >= 1`),
    check('camp_battles_strength_whole', sql`${table.strength} >= 0`),
    index('camp_battles_plot_order').on(
      table.kingdom,
      table.province,
      table.plot,
      table.foughtAt,
      table.id,
    ),
  ],
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
    unit: unit('unit'),
    level: integer('level'),
    count: integer('count'),
    cancelledCount: integer('cancelled_count'),
    province: integer('province'),
    plot: integer('plot'),
    refundWood: doublePrecision('refund_wood').notNull().default(0),
    refundStone: doublePrecision('refund_stone').notNull().default(0),
    refundIron: doublePrecision('refund_iron').notNull().default(0),
    refundGold: doublePrecision('refund_gold').notNull().default(0),
    refundFood: doublePrecision('refund_food').notNull().default(0),
    recalled: boolean('recalled').notNull().default(false),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      'fief_events_one_subject',
      sql`num_nonnulls(${table.building}, ${table.art}, ${table.unit}) = 1 AND (${table.level} IS NULL) = (${table.unit} IS NOT NULL) AND (${table.count} IS NULL) = (${table.unit} IS NULL) AND (${table.cancelledCount} IS NULL OR (${table.unit} IS NOT NULL AND ${table.cancelledCount} >= 1)) AND (${table.province} IS NULL) = (${table.plot} IS NULL) AND (${table.province} IS NULL OR (${table.unit} IS NOT NULL AND ${table.province} >= 1 AND ${table.plot} >= 1))`,
    ),
    check(
      'fief_events_recalled_only_march',
      sql`NOT ${table.recalled} OR ${table.kind}::text = 'march_returned'`,
    ),
    index('fief_events_fief_order').on(table.fiefId, table.occurredAt, table.id),
  ],
)
