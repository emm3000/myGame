import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  doublePrecision,
  foreignKey,
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

export const memoryState = pgEnum('memory_state', ['learning', 'review', 'relearning'])

export const memoryRating = pgEnum('memory_rating', ['again', 'hard', 'good', 'easy'])

export const reviewFormat = pgEnum('review_format', ['recognition', 'recall'])

export const accountTokenKind = pgEnum('account_token_kind', ['reset', 'verify'])

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    reportReadAt: timestamp('report_read_at', { withTimezone: true }).notNull(),
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

export const cards = pgTable(
  'cards',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    wordId: text('word_id').notNull(),
    state: memoryState('state').notNull(),
    step: integer('step'),
    stability: doublePrecision('stability'),
    difficulty: doublePrecision('difficulty'),
    lastReviewAt: timestamp('last_review_at', { withTimezone: true }),
    lastRating: memoryRating('last_rating'),
    enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
    retainedAt: timestamp('retained_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ name: 'cards_pkey', columns: [table.playerId, table.wordId] }),
    check(
      'cards_step_terms',
      sql`(${table.step} IS NULL) = (${table.state}::text = 'review') AND (${table.step} IS NULL OR ${table.step} >= 0)`,
    ),
    check(
      'cards_review_terms',
      sql`num_nulls(${table.stability}, ${table.difficulty}, ${table.lastReviewAt}, ${table.lastRating}) IN (0, 4) AND (${table.lastReviewAt} IS NOT NULL OR ${table.state}::text = 'learning')`,
    ),
    check(
      'cards_memory_bounds',
      sql`(${table.stability} IS NULL OR ${table.stability} > 0) AND (${table.difficulty} IS NULL OR ${table.difficulty} BETWEEN 1 AND 10)`,
    ),
    check(
      'cards_retained_at_last_review',
      sql`${table.retainedAt} IS NULL OR ${table.retainedAt} = ${table.lastReviewAt}`,
    ),
  ],
)

export const pendingReviews = pgTable(
  'pending_reviews',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    wordId: text('word_id').notNull(),
    hintShown: boolean('hint_shown').notNull(),
    nearMissAnswer: text('near_miss_answer'),
  },
  (table) => [
    primaryKey({ name: 'pending_reviews_pkey', columns: [table.playerId, table.wordId] }),
    foreignKey({
      name: 'pending_reviews_card_fk',
      columns: [table.playerId, table.wordId],
      foreignColumns: [cards.playerId, cards.wordId],
    }).onDelete('cascade'),
  ],
)

export const reviewLog = pgTable(
  'review_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    wordId: text('word_id').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull(),
    format: reviewFormat('format').notNull(),
    answer: text('answer').notNull(),
    nearMissAnswer: text('near_miss_answer'),
    hintShown: boolean('hint_shown').notNull(),
    rating: memoryRating('rating').notNull(),
    elapsedDays: integer('elapsed_days'),
    beforeState: memoryState('before_state').notNull(),
    beforeStep: integer('before_step'),
    beforeStability: doublePrecision('before_stability'),
    beforeDifficulty: doublePrecision('before_difficulty'),
    beforeLastReviewAt: timestamp('before_last_review_at', { withTimezone: true }),
    beforeLastRating: memoryRating('before_last_rating'),
    beforeEnteredAt: timestamp('before_entered_at', { withTimezone: true }).notNull(),
    beforeRetainedAt: timestamp('before_retained_at', { withTimezone: true }),
    afterState: memoryState('after_state').notNull(),
    afterStep: integer('after_step'),
    afterStability: doublePrecision('after_stability').notNull(),
    afterDifficulty: doublePrecision('after_difficulty').notNull(),
    afterLastReviewAt: timestamp('after_last_review_at', { withTimezone: true }).notNull(),
    afterLastRating: memoryRating('after_last_rating').notNull(),
    afterEnteredAt: timestamp('after_entered_at', { withTimezone: true }).notNull(),
    afterRetainedAt: timestamp('after_retained_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'review_log_elapsed_days_terms',
      sql`(${table.elapsedDays} IS NULL) = (${table.beforeLastReviewAt} IS NULL) AND (${table.elapsedDays} IS NULL OR ${table.elapsedDays} >= 0)`,
    ),
    index('review_log_player_order').on(table.playerId, table.reviewedAt, table.id),
  ],
)

export const townBuilding = pgEnum('town_building', [
  'homes',
  'farm',
  'factory',
  'power_station',
  'storage',
  'school',
  'office',
])

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

export const townResource = pgEnum('town_resource', ['money', 'food', 'power', 'material'])

export const townHire = pgEnum('town_hire', ['worker', 'truck'])

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

export const bandStarts = pgTable(
  'band_starts',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    band: integer('band').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ name: 'band_starts_pkey', columns: [table.playerId, table.band] }),
    check('band_starts_band_known', sql`${table.band} BETWEEN 1 AND 3`),
  ],
)

export const heldOutWords = pgTable(
  'held_out_words',
  {
    playerId: uuid('player_id').notNull(),
    band: integer('band').notNull(),
    headword: text('headword').notNull(),
  },
  (table) => [
    primaryKey({ name: 'held_out_words_pkey', columns: [table.playerId, table.headword] }),
    foreignKey({
      name: 'held_out_words_band_start_fk',
      columns: [table.playerId, table.band],
      foreignColumns: [bandStarts.playerId, bandStarts.band],
    }).onDelete('cascade'),
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
    check('town_jobs_hours_positive', sql`${table.hours} >= 1`),
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
