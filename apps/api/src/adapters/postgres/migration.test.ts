import { fileURLToPath } from 'node:url'
import { Instant } from '@mygame/domain'
import { eq } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenDigest } from '../../auth/tokenDigest'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleCardRepository } from './DrizzleCardRepository'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import {
  accountTokens,
  cards,
  earnedSkills,
  pendingReviews,
  players,
  reviewLog,
  sessions,
} from './schema'

const migrationsFolder = fileURLToPath(new URL('../../../migrations', import.meta.url))

const uniqueViolation = '23505'

const checkViolation = '23514'

const foreignKeyViolation = '23503'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

function aPlayer(id: string, email: string): typeof players.$inferInsert {
  return {
    id,
    email,
    passwordHash: 'argon2id-hash',
    createdAt: new Date('2026-09-22T08:00:00Z'),
    reportReadAt: new Date('2026-09-22T08:00:00Z'),
  }
}

const lessonFinishedAt = new Date('2026-11-10T09:00:00Z')

function enteredCardOf(playerId: string): typeof cards.$inferInsert {
  return { playerId, wordId: 'school', state: 'learning', step: 0, enteredAt: lessonFinishedAt }
}

function reviewedCardOf(playerId: string): typeof cards.$inferInsert {
  return {
    playerId,
    wordId: 'school',
    state: 'review',
    step: null,
    stability: 10.971,
    difficulty: 2.1043,
    lastReviewAt: new Date('2026-11-12T09:10:00Z'),
    lastRating: 'good',
    enteredAt: lessonFinishedAt,
  }
}

function firstReviewOf(playerId: string): typeof reviewLog.$inferInsert {
  return {
    playerId,
    wordId: 'school',
    reviewedAt: lessonFinishedAt,
    format: 'recognition',
    answer: 'school',
    hintShown: false,
    rating: 'good',
    beforeState: 'learning',
    beforeStep: 0,
    beforeEnteredAt: lessonFinishedAt,
    afterState: 'learning',
    afterStep: 1,
    afterStability: 2.3065,
    afterDifficulty: 2.1181,
    afterLastReviewAt: lessonFinishedAt,
    afterLastRating: 'good',
    afterEnteredAt: lessonFinishedAt,
  }
}

function foodSkillOf(playerId: string): typeof earnedSkills.$inferInsert {
  return {
    playerId,
    lessonId: 'lesson-1',
    resource: 'food',
    ratePercent: 5,
    earnedAt: new Date('2026-11-23T09:10:00Z'),
  }
}

const ana = aPlayer('00000000-0000-4000-8000-000000000001', 'Ana@Example.com')
const bruno = aPlayer('00000000-0000-4000-8000-000000000002', 'bruno@example.com')

const openEmptyDatabase = async (): Promise<Client> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  await client.query('BEGIN')
  await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
  await client.query('DROP SCHEMA public CASCADE')
  await client.query('CREATE SCHEMA public')
  return client
}

const applyMigrations = async (
  client: Client,
  migrations: ReturnType<typeof readMigrationFiles>,
): Promise<void> => {
  for (const migration of migrations) {
    for (const statement of migration.sql) {
      await client.query(statement)
    }
  }
}

const closeWithoutChanges = async (client: Client): Promise<void> => {
  await client.query('ROLLBACK')
  await client.end()
}

describe('the migrations', () => {
  let client: Client
  let db: NodePgDatabase

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await applyMigrations(client, readMigrationFiles({ migrationsFolder }))
    db = drizzle(client)
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('applies the migration to an empty database', async () => {
    const tables = await client.query<{ name: string }>(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    )

    expect(tables.rows.map((row) => row.name)).toEqual([
      'account_tokens',
      'band_starts',
      'cards',
      'earned_skills',
      'held_out_words',
      'pending_reviews',
      'players',
      'review_log',
      'sessions',
      'town_buildings',
      'town_events',
      'town_hires',
      'town_hiring_orders',
      'town_jobs',
      'town_lesson_slots',
      'town_waiting_work',
      'towns',
    ])
  })

  it("drops a deleted player's cards, pending reviews and review log", async () => {
    await db.insert(players).values([ana, bruno])
    for (const playerId of [ana.id, bruno.id]) {
      await db.insert(cards).values(enteredCardOf(playerId))
      await db.insert(pendingReviews).values({ playerId, wordId: 'school', hintShown: true })
      await db.insert(reviewLog).values(firstReviewOf(playerId))
    }

    await db.delete(players).where(eq(players.id, ana.id))

    const owners: Array<ReadonlyArray<{ playerId: string }>> = []
    for (const table of [cards, pendingReviews, reviewLog]) {
      owners.push(await db.select({ playerId: table.playerId }).from(table))
    }
    expect(owners).toEqual([
      [{ playerId: bruno.id }],
      [{ playerId: bruno.id }],
      [{ playerId: bruno.id }],
    ])
  })

  it('refuses a second card of one word for one player', async () => {
    await db.insert(players).values(ana)
    await db.insert(cards).values(enteredCardOf(ana.id))

    await expect(db.insert(cards).values(enteredCardOf(ana.id))).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'cards_pkey' },
    })
  })

  it('refuses a pending review of a word the player holds no card of', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(pendingReviews).values({ playerId: ana.id, wordId: 'school', hintShown: true }),
    ).rejects.toMatchObject({
      cause: { code: foreignKeyViolation, constraint: 'pending_reviews_card_fk' },
    })
  })

  it("drops a card's pending review with the card", async () => {
    await db.insert(players).values(ana)
    await db.insert(cards).values(enteredCardOf(ana.id))
    await db.insert(pendingReviews).values({ playerId: ana.id, wordId: 'school', hintShown: true })

    await db.delete(cards)

    expect(await db.select().from(pendingReviews)).toEqual([])
  })

  it('refuses a card in review that holds a learning step', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(cards).values({ ...reviewedCardOf(ana.id), step: 1 }),
    ).rejects.toMatchObject({ cause: { code: checkViolation, constraint: 'cards_step_terms' } })
  })

  it('refuses a reviewed card stored without its last rating', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(cards).values({ ...reviewedCardOf(ana.id), lastRating: null }),
    ).rejects.toMatchObject({ cause: { code: checkViolation, constraint: 'cards_review_terms' } })
  })

  it('refuses a card retained at an instant other than its last review', async () => {
    await db.insert(players).values(ana)

    await expect(
      db
        .insert(cards)
        .values({ ...reviewedCardOf(ana.id), retainedAt: new Date('2026-11-10T09:00:00Z') }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'cards_retained_at_last_review' },
    })
  })

  it('refuses a skill a player earned twice from one lesson', async () => {
    await db.insert(players).values(ana)
    await db.insert(earnedSkills).values({ ...foodSkillOf(ana.id), resource: 'material' })

    await expect(
      db.insert(earnedSkills).values({ ...foodSkillOf(ana.id), resource: 'material' }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'earned_skills_pkey' } })
  })

  it("drops a deleted player's earned skills", async () => {
    await db.insert(players).values([ana, bruno])
    for (const playerId of [ana.id, bruno.id]) {
      await db.insert(earnedSkills).values({ ...foodSkillOf(playerId), resource: 'food' })
    }

    await db.delete(players).where(eq(players.id, ana.id))

    expect(await db.select({ playerId: earnedSkills.playerId }).from(earnedSkills)).toEqual([
      { playerId: bruno.id },
    ])
  })

  it('refuses a town lesson that finishes before it starts', async () => {
    await db.insert(players).values(ana)
    await insertTownOf(client, ana.id, 1, plainStocks)

    await expect(
      client.query(
        `INSERT INTO town_lesson_slots (town_id, lesson_id, started_at, finishes_at)
         SELECT id, 'lesson-1', '2026-11-10T09:00:00Z', '2026-11-10T08:57:30Z' FROM towns`,
      ),
    ).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_lesson_slots_started_before_finish',
    })
  })

  it("drops a deleted town's lesson slot", async () => {
    await db.insert(players).values(ana)
    await insertTownOf(client, ana.id, 1, plainStocks)
    await client.query(
      `INSERT INTO town_lesson_slots (town_id, lesson_id, started_at, finishes_at)
       SELECT id, 'lesson-1', '2026-11-10T08:57:30Z', '2026-11-10T09:00:00Z' FROM towns`,
    )

    await db.delete(players).where(eq(players.id, ana.id))

    expect((await client.query('SELECT town_id FROM town_lesson_slots')).rows).toEqual([])
  })

  it('refuses a review logged with elapsed days before any earlier review', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(reviewLog).values({ ...firstReviewOf(ana.id), elapsedDays: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'review_log_elapsed_days_terms' },
    })
  })

  it('refuses two players with the same email in different case', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(players).values({ ...bruno, email: 'ana@example.com' }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'players_email_unique' },
    })
  })

  it('refuses two sessions with the same token digest', async () => {
    await db.insert(players).values([ana, bruno])
    const expiresAt = new Date('2026-10-22T08:00:00Z')
    const digest = tokenDigest('opaque-token')
    await db.insert(sessions).values({ tokenDigest: digest, playerId: ana.id, expiresAt })

    await expect(
      db.insert(sessions).values({ tokenDigest: digest, playerId: bruno.id, expiresAt }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'sessions_pkey' } })
  })

  it('refuses a session stored with a plain token', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(sessions).values({
        tokenDigest: 'opaque-token',
        playerId: ana.id,
        expiresAt: new Date('2026-10-22T08:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'sessions_token_digest_hex' },
    })
  })

  it('refuses an account token stored with a plain token', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(accountTokens).values({
        tokenDigest: 'opaque-token',
        playerId: ana.id,
        kind: 'verify',
        expiresAt: new Date('2026-09-23T08:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'account_tokens_token_digest_hex' },
    })
  })

  it('drops the tokens of a deleted player', async () => {
    await db.insert(players).values(ana)
    await db.insert(accountTokens).values({
      tokenDigest: tokenDigest('opaque-token'),
      playerId: ana.id,
      kind: 'reset',
      expiresAt: new Date('2026-09-22T09:00:00Z'),
    })

    await db.delete(players)

    expect(await db.select().from(accountTokens)).toEqual([])
  })
})

const insertPlayersOfPreviousVersion = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [ana.id, ana.email, bruno.id, bruno.email],
  )
}

const migratedFrom = async (
  client: Client,
  appliedCount: number,
  seed: () => Promise<void>,
): Promise<void> => {
  const migrations = readMigrationFiles({ migrationsFolder })
  await applyMigrations(client, migrations.slice(0, appliedCount))
  await seed()
  await applyMigrations(client, migrations.slice(appliedCount))
}

const migratedThroughNext = async (
  client: Client,
  appliedCount: number,
  seed: () => Promise<void>,
): Promise<void> => {
  const migrations = readMigrationFiles({ migrationsFolder })
  await applyMigrations(client, migrations.slice(0, appliedCount))
  await seed()
  await applyMigrations(client, migrations.slice(appliedCount, appliedCount + 1))
}

describe('the session token digest migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a session opened before the digest signed in', async () => {
    const token = 'opened-before-the-digest'
    await migratedFrom(client, 3, async () => {
      await insertPlayersOfPreviousVersion(client)
      await client.query(
        `INSERT INTO sessions (token, player_id, expires_at) VALUES ($1, $2, '2026-10-22T08:00:00Z')`,
        [token, ana.id],
      )
    })

    const renewedFor = await new DrizzleAccounts(drizzle(client)).renewSession(
      token,
      Instant.fromEpochMilliseconds(Date.parse('2026-09-23T08:00:00Z')),
      Instant.fromEpochMilliseconds(Date.parse('2026-10-23T08:00:00Z')),
    )

    expect(renewedFor).toBe(ana.id)
  })
})

describe('the account tokens migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('reads an unverified email on a player stored by the previous version', async () => {
    await migratedFrom(client, 10, async () => {
      await insertPlayersOfPreviousVersion(client)
    })

    expect(
      await drizzle(client)
        .select({ id: players.id, emailVerifiedAt: players.emailVerifiedAt })
        .from(players)
        .orderBy(players.id),
    ).toEqual([
      { id: ana.id, emailVerifiedAt: null },
      { id: bruno.id, emailVerifiedAt: null },
    ])
  })
})

const insertPlayersBeforeTheReport = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z'),
            ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z')`,
    [ana.id, ana.email, bruno.id, bruno.email],
  )
}

describe('the learning memory migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('holds no card for a player stored before the migration', async () => {
    await migratedFrom(client, 30, async () => {
      await insertPlayersBeforeTheReport(client)
    })

    expect(await new DrizzleCardRepository(drizzle(client)).cardsOf(ana.id)).toEqual({
      ok: true,
      value: [],
    })
  })
})

const insertTownOf = async (
  client: Client,
  playerId: string,
  site: number,
  stocks: { readonly money: number; readonly food: number },
): Promise<void> => {
  await client.query(
    `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
     VALUES (gen_random_uuid(), $1, 1, 1, $2, 'Maple Hill', $3, $4, 0, 0, '2026-11-04T08:00:00Z')`,
    [playerId, site, stocks.money, stocks.food],
  )
}

const plainStocks = { money: 400, food: 300 }

describe('the town migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedFrom(client, 31, async () => {
      await insertPlayersBeforeTheReport(client)
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('founds no town for a player stored before the migration', async () => {
    const towns = new DrizzleTownRepository(drizzle(client), 'lockFree')

    expect(await towns.holdsTown(ana.id)).toBe(false)
  })

  it('refuses a fractional stock', async () => {
    await expect(
      insertTownOf(client, ana.id, 1, { ...plainStocks, food: 2.5 }),
    ).rejects.toMatchObject({ code: checkViolation, constraint: 'towns_food_whole' })
  })

  it('refuses a negative stock', async () => {
    await expect(
      insertTownOf(client, ana.id, 1, { ...plainStocks, money: -1 }),
    ).rejects.toMatchObject({ code: checkViolation, constraint: 'towns_money_whole' })
  })

  it('refuses a second town for one player', async () => {
    await insertTownOf(client, ana.id, 1, plainStocks)

    await expect(insertTownOf(client, ana.id, 2, plainStocks)).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'towns_player_unique',
    })
  })

  it("drops a deleted player's town and its building levels", async () => {
    await insertTownOf(client, ana.id, 1, plainStocks)
    await client.query(
      `INSERT INTO town_buildings (town_id, building, level)
       SELECT id, 'homes', 1 FROM towns WHERE player_id = $1`,
      [ana.id],
    )

    await client.query('DELETE FROM players WHERE id = $1', [ana.id])

    const left = await client.query(
      'SELECT (SELECT count(*) FROM towns) + (SELECT count(*) FROM town_buildings) AS count',
    )
    expect(left.rows).toEqual([{ count: '0' }])
  })

  it('refuses two towns on one site', async () => {
    await insertTownOf(client, ana.id, 1, plainStocks)

    await expect(insertTownOf(client, bruno.id, 1, plainStocks)).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'towns_site_unique',
    })
  })
})

describe('the building work and town news migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, 32, async () => {
      await insertPlayersBeforeTheReport(client)
      await insertTownOf(client, ana.id, 1, plainStocks)
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const insertEventOf = async (
    kind: string,
    building: string | null,
    level: number | null,
  ): Promise<void> => {
    await client.query(
      `INSERT INTO town_events (town_id, kind, building, level, occurred_at)
       SELECT id, $1, $2, $3, '2026-11-05T08:00:00Z' FROM towns WHERE player_id = $4`,
      [kind, building, level, ana.id],
    )
  }

  it('reads every stored player at the migration instant', async () => {
    const read = await client.query<{ id: string; atMigration: boolean }>(
      'SELECT id, report_read_at = now() AS "atMigration" FROM players ORDER BY id',
    )

    expect(read.rows).toEqual([
      { id: ana.id, atMigration: true },
      { id: bruno.id, atMigration: true },
    ])
  })

  it('stores a town stored before the migration idle with nothing waiting', async () => {
    const read = await client.query(
      `SELECT work_building AS building, (SELECT count(*) FROM town_waiting_work) AS waiting
       FROM towns WHERE player_id = $1`,
      [ana.id],
    )

    expect(read.rows).toEqual([{ building: null, waiting: '0' }])
  })

  it('holds every kind of town event', async () => {
    const kinds = await client.query<{ kind: string }>(
      'SELECT unnest(enum_range(NULL::town_event_kind))::text AS kind',
    )

    expect(kinds.rows.map(({ kind }) => kind)).toEqual([
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
  })

  it('refuses building work in the slot without its finish', async () => {
    await expect(
      client.query(
        `UPDATE towns SET work_building = 'farm', work_level = 1, work_started_at = stored_at,
           work_cost_money = 0, work_cost_food = 0, work_cost_power = 0, work_cost_material = 0`,
      ),
    ).rejects.toMatchObject({ code: checkViolation, constraint: 'towns_work_slot_terms' })
  })

  it('refuses two waiting entries at one position of a town', async () => {
    const insertWaiting = (): Promise<unknown> =>
      client.query(
        `INSERT INTO town_waiting_work (town_id, position, building, level, cost_money, cost_food, cost_power, cost_material, duration_seconds)
         SELECT id, 0, 'farm', 1, 0, 0, 0, 0, 60 FROM towns WHERE player_id = $1`,
        [ana.id],
      )
    await insertWaiting()

    await expect(insertWaiting()).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'town_waiting_work_pkey',
    })
  })

  it('refuses a building work event without its building', async () => {
    await expect(insertEventOf('building_work_finished', null, null)).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_events_building_terms',
    })
  })

  it('refuses a building named on an event of another kind', async () => {
    await expect(insertEventOf('became_city', 'homes', 2)).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_events_building_terms',
    })
  })

  it("drops a deleted town's waiting work and events", async () => {
    await client.query(
      `INSERT INTO town_waiting_work (town_id, position, building, level, cost_money, cost_food, cost_power, cost_material, duration_seconds)
       SELECT id, 0, 'farm', 1, 0, 0, 0, 0, 60 FROM towns WHERE player_id = $1`,
      [ana.id],
    )
    await insertEventOf('became_city', null, null)

    await client.query('DELETE FROM players WHERE id = $1', [ana.id])

    const left = await client.query(
      'SELECT (SELECT count(*) FROM town_waiting_work) + (SELECT count(*) FROM town_events) AS count',
    )
    expect(left.rows).toEqual([{ count: '0' }])
  })
})

describe('the skills move migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const insertPlayersOfBuildingWorkVersion = async (): Promise<void> => {
    await client.query(
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z')`,
      [ana.id, ana.email],
    )
  }

  const insertSkillOfPreviousVersion = async (resource: string): Promise<void> => {
    await client.query(
      `INSERT INTO player_skills (player_id, lesson_id, resource, rate_percent, earned_at)
       VALUES ($1, 'lesson-1', $2, 5, '2026-11-23T09:10:00Z')`,
      [ana.id, resource],
    )
  }

  it('copies a food skill to the town food, keeping its lesson, percent and instant', async () => {
    await migratedFrom(client, 33, async () => {
      await insertPlayersOfBuildingWorkVersion()
      await insertSkillOfPreviousVersion('food')
    })

    const copied = await drizzle(client).select().from(earnedSkills)

    expect(copied).toEqual([
      {
        playerId: ana.id,
        lessonId: 'lesson-1',
        resource: 'food',
        ratePercent: 5,
        earnedAt: new Date('2026-11-23T09:10:00Z'),
      },
    ])
  })

  const failedSkillsMove = async (seed: () => Promise<void>): Promise<unknown> => {
    const migrations = readMigrationFiles({ migrationsFolder })
    await applyMigrations(client, migrations.slice(0, 33))
    await seed()
    await client.query('SAVEPOINT skills_move')
    const failure = await applyMigrations(client, migrations.slice(33)).then(
      () => undefined,
      (refused: unknown) => refused,
    )
    await client.query('ROLLBACK TO SAVEPOINT skills_move')
    return failure
  }

  it('fails on a skill earned on another resource than food', async () => {
    const failure = await failedSkillsMove(async () => {
      await insertPlayersOfBuildingWorkVersion()
      await insertSkillOfPreviousVersion('wood')
    })

    expect(failure).toMatchObject({
      message: 'player_skills holds a skill on a resource other than food',
    })
  })

  it('fails on a town stored before the move', async () => {
    const failure = await failedSkillsMove(async () => {
      await insertPlayersOfBuildingWorkVersion()
      await insertSkillOfPreviousVersion('food')
      await insertTownOf(client, ana.id, 1, plainStocks)
    })

    expect(failure).toMatchObject({ message: 'towns holds a town before the skills move' })
  })
})

describe('the band starts migration', () => {
  let client: Client

  const bandStartsMigrationIndex = 34

  beforeEach(async () => {
    client = await openEmptyDatabase()
    const migrations = readMigrationFiles({ migrationsFolder })
    await applyMigrations(client, migrations.slice(0, bandStartsMigrationIndex))
    await client.query(
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z')`,
      [ana.id, ana.email],
    )
    await client.query(
      `INSERT INTO cards (player_id, word_id, state, step, entered_at)
       VALUES ($1, 'lesson-1-1', 'learning', 0, '2026-11-02T09:00:00Z')`,
      [ana.id],
    )
    await client.query(
      `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
       VALUES ($1, 'lesson-1', 'food', 5, '2026-11-23T09:10:00Z')`,
      [ana.id],
    )
    await applyMigrations(client, migrations.slice(bandStartsMigrationIndex))
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const insertBandStart = async (band: number): Promise<void> => {
    await client.query(
      `INSERT INTO band_starts (player_id, band, started_at) VALUES ($1, $2, '2026-11-23T09:10:00Z')`,
      [ana.id, band],
    )
  }

  const insertHeldOutWord = async (band: number, headword: string): Promise<void> => {
    await client.query(
      'INSERT INTO held_out_words (player_id, band, headword) VALUES ($1, $2, $3)',
      [ana.id, band, headword],
    )
  }

  const failureCodeOf = async (work: () => Promise<void>): Promise<unknown> => {
    await client.query('SAVEPOINT band_starts')
    const code = await work().then(
      () => undefined,
      (refused: { readonly code: unknown }) => refused.code,
    )
    await client.query('ROLLBACK TO SAVEPOINT band_starts')
    return code
  }

  it('starts no band for a player stored before the migration', async () => {
    const stored = await client.query('SELECT 1 FROM band_starts')

    expect(stored.rows).toEqual([])
  })

  it('holds no word out for a player stored before the migration', async () => {
    const stored = await client.query('SELECT 1 FROM held_out_words')

    expect(stored.rows).toEqual([])
  })

  it('keeps the cards and the skills stored before the migration', async () => {
    const cardsStored = await client.query('SELECT word_id FROM cards')
    const skillsStored = await client.query('SELECT lesson_id FROM earned_skills')

    expect([cardsStored.rows, skillsStored.rows]).toEqual([
      [{ word_id: 'lesson-1-1' }],
      [{ lesson_id: 'lesson-1' }],
    ])
  })

  it('refuses a band outside the three', async () => {
    expect(await failureCodeOf(() => insertBandStart(4))).toBe(checkViolation)
  })

  it('refuses a second start of one band', async () => {
    await insertBandStart(1)

    expect(await failureCodeOf(() => insertBandStart(1))).toBe(uniqueViolation)
  })

  it('refuses a held-out word of a band the player never started', async () => {
    expect(await failureCodeOf(() => insertHeldOutWord(1, 'say'))).toBe(foreignKeyViolation)
  })

  it('refuses one word held out twice for a player', async () => {
    await insertBandStart(1)
    await insertBandStart(2)
    await insertHeldOutWord(1, 'say')

    expect(await failureCodeOf(() => insertHeldOutWord(2, 'say'))).toBe(uniqueViolation)
  })

  it("drops a deleted player's band starts and held-out words", async () => {
    await insertBandStart(1)
    await insertHeldOutWord(1, 'say')

    await client.query('DELETE FROM players WHERE id = $1', [ana.id])

    const stored = await client.query('SELECT 1 FROM held_out_words')
    expect(stored.rows).toEqual([])
  })
})

const keptTables = [
  'players',
  'sessions',
  'account_tokens',
  'cards',
  'pending_reviews',
  'review_log',
  'earned_skills',
  'band_starts',
  'held_out_words',
  'towns',
  'town_buildings',
  'town_waiting_work',
  'town_lesson_slots',
  'town_events',
] as const

const droppedTables = [
  'fiefs',
  'fief_buildings',
  'fief_queue_entries',
  'fief_arts',
  'fief_units',
  'fief_recruit_orders',
  'fief_marches',
  'fief_incoming_cargo',
  'fief_events',
  'camp_battles',
  'player_seen_hints',
  'player_skills',
] as const

const droppedEnums = [
  'terrain',
  'building',
  'art',
  'unit',
  'march_order',
  'fief_event_kind',
  'resource',
] as const

const resetOwnerId = '00000000-0000-4000-8000-0000000000a1'

const resetTownId = '00000000-0000-4000-8000-0000000000b1'

const resetFiefId = '00000000-0000-4000-8000-0000000000c1'

const resetSeedStatements: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
  [
    `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
   VALUES ($1, 'owner@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z', '2026-11-09T08:00:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO sessions (token_digest, player_id, expires_at)
   VALUES (repeat('a', 64), $1, '2026-12-10T08:00:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO account_tokens (token_digest, player_id, kind, expires_at)
   VALUES (repeat('b', 64), $1, 'verify', '2026-11-11T08:00:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO cards (player_id, word_id, state, step, entered_at)
   VALUES ($1, 'lesson-1-1', 'learning', 0, '2026-11-02T09:00:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO pending_reviews (player_id, word_id, hint_shown) VALUES ($1, 'lesson-1-1', true)`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO review_log (player_id, word_id, reviewed_at, format, answer, hint_shown, rating,
     before_state, before_step, before_entered_at,
     after_state, after_step, after_stability, after_difficulty, after_last_review_at, after_last_rating, after_entered_at)
   VALUES ($1, 'lesson-1-1', '2026-11-03T09:00:00Z', 'recognition', 'abc12345', false, 'good',
     'learning', 0, '2026-11-02T09:00:00Z',
     'learning', 1, 2.3, 2.1, '2026-11-03T09:00:00Z', 'good', '2026-11-02T09:00:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
   VALUES ($1, 'lesson-1', 'food', 5, '2026-11-08T09:10:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO band_starts (player_id, band, started_at) VALUES ($1, 1, '2026-11-02T09:00:00Z')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO held_out_words (player_id, band, headword) VALUES ($1, 1, 'river')`,
    [resetOwnerId],
  ],
  [
    `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
   VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-09T08:00:00Z')`,
    [resetOwnerId, resetTownId],
  ],
  [`INSERT INTO town_buildings (town_id, building, level) VALUES ($1, 'homes', 1)`, [resetTownId]],
  [
    `INSERT INTO town_waiting_work (town_id, position, building, level, cost_money, cost_food, cost_power, cost_material, duration_seconds)
   VALUES ($1, 0, 'farm', 1, 40, 0, 0, 10, 600)`,
    [resetTownId],
  ],
  [
    `INSERT INTO town_lesson_slots (town_id, lesson_id, started_at, finishes_at)
   VALUES ($1, 'lesson-2', '2026-11-09T08:00:00Z', '2026-11-09T09:00:00Z')`,
    [resetTownId],
  ],
  [
    `INSERT INTO town_events (town_id, kind, occurred_at) VALUES ($1, 'became_city', '2026-11-09T08:00:00Z')`,
    [resetTownId],
  ],
  [
    `INSERT INTO fiefs (id, player_id, kingdom, province, plot, terrain, name, wood, stone, iron, gold, food, stored_at)
   VALUES ($2, $1, 1, 1, 1, 'lowlands', 'Vado Gris', 10, 10, 10, 10, 10, '2026-11-01T08:00:00Z')`,
    [resetOwnerId, resetFiefId],
  ],
  [
    `INSERT INTO fief_buildings (fief_id, building, level) VALUES ($1, 'sawmill', 2)`,
    [resetFiefId],
  ],
  [`INSERT INTO player_seen_hints (player_id, hint) VALUES ($1, 'peasants')`, [resetOwnerId]],
  [
    `INSERT INTO player_skills (player_id, lesson_id, resource, rate_percent, earned_at)
   VALUES ($1, 'lesson-1', 'food', 5, '2026-11-08T09:10:00Z')`,
    [resetOwnerId],
  ],
]

const migrationsBeforeTheReset = 35

describe('the reset migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheReset, async () => {
      for (const [statement, values] of resetSeedStatements) {
        await client.query(statement, [...values])
      }
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it.each(keptTables)('keeps the row stored in %s before the reset', async (table) => {
    const stored = await client.query(`SELECT count(*)::int AS count FROM ${table}`)

    expect(stored.rows[0].count).toBe(1)
  })

  it.each(droppedTables)('drops the medieval table %s', async (table) => {
    const found = await client.query('SELECT to_regclass($1) AS found', [`public.${table}`])

    expect(found.rows[0].found).toBeNull()
  })

  it.each(droppedEnums)('drops the medieval enum %s', async (name) => {
    const found = await client.query(
      `SELECT 1 FROM pg_type JOIN pg_namespace ON pg_namespace.oid = typnamespace
       WHERE nspname = 'public' AND typname = $1`,
      [name],
    )

    expect(found.rowCount).toBe(0)
  })

  it("drops the players' digest acknowledgement", async () => {
    const found = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'digest_acknowledged_at'`,
    )

    expect(found.rowCount).toBe(0)
  })

  it("keeps the player's Report instant", async () => {
    const stored = await client.query('SELECT report_read_at FROM players')

    expect(stored.rows[0].report_read_at).toEqual(new Date('2026-11-09T08:00:00Z'))
  })
})

const hiringOwnerId = '00000000-0000-4000-8000-0000000000a2'

const hiringTownId = '00000000-0000-4000-8000-0000000000b2'

const migrationsBeforeTheHiring = 36

describe('the town hiring migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheHiring, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'owner@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-11-09T08:00:00Z')`,
        [hiringOwnerId],
      )
      await client.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-09T08:00:00Z')`,
        [hiringOwnerId, hiringTownId],
      )
      await client.query(
        `INSERT INTO town_buildings (town_id, building, level) VALUES ($1, 'homes', 1), ($1, 'office', 1)`,
        [hiringTownId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('gives a town stored before the migration no worker and no truck', async () => {
    const stored = await client.query<{ hire: string; count: number }>(
      'SELECT hire, count FROM town_hires WHERE town_id = $1 ORDER BY hire',
      [hiringTownId],
    )

    expect(stored.rows).toEqual([
      { hire: 'worker', count: 0 },
      { hire: 'truck', count: 0 },
    ])
  })

  it('leaves the hiring slot of a town stored before the migration idle', async () => {
    const stored = await client.query('SELECT 1 FROM town_hiring_orders')

    expect(stored.rowCount).toBe(0)
  })

  it('refuses a hiring order of no hire', async () => {
    const insert = client.query(
      `INSERT INTO town_hiring_orders (town_id, hire, count, cost_money, cost_food, cost_power, cost_material, seconds_per_hire, started_at)
       VALUES ($1, 'worker', 0, 50, 0, 0, 0, 300, '2026-11-09T08:00:00Z')`,
      [hiringTownId],
    )

    await expect(insert).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_hiring_orders_count_positive',
    })
  })
})

const jobsOwnerId = '00000000-0000-4000-8000-0000000000a3'

const jobsTownId = '00000000-0000-4000-8000-0000000000b3'

const migrationsBeforeTheJobs = 37

const insertJobOf = (
  client: Client,
  [workerCount, truckCount]: readonly [number, number],
): Promise<unknown> =>
  client.query(
    `INSERT INTO town_jobs (town_id, region, area, site, worker_count, truck_count, hours, sent_at, one_way_seconds, pay_money, pay_food, pay_power, pay_material, pay_percent_money, pay_percent_food, pay_percent_power, pay_percent_material)
     VALUES ($1, 1, 2, 4, $2, $3, 2, '2026-11-10T08:00:00Z', 660, 0, 300, 0, 300, 100, 100, 100, 100)`,
    [jobsTownId, workerCount, truckCount],
  )

describe('the town jobs migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheJobs, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'owner@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-11-09T08:00:00Z')`,
        [jobsOwnerId],
      )
      await client.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-09T08:00:00Z')`,
        [jobsOwnerId, jobsTownId],
      )
      await client.query(
        `INSERT INTO town_hires (town_id, hire, count) VALUES ($1, 'worker', 3), ($1, 'truck', 1)`,
        [jobsTownId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a town stored before the migration with its job slot idle', async () => {
    const town = await client.query('SELECT name FROM towns WHERE id = $1', [jobsTownId])
    const jobs = await client.query('SELECT 1 FROM town_jobs')

    expect([town.rows, jobs.rowCount]).toEqual([[{ name: 'Maple Falls' }], 0])
  })

  it("stores the job of a town's team", async () => {
    await insertJobOf(client, [2, 1])

    const stored = await client.query<{ worker_count: number; truck_count: number }>(
      'SELECT worker_count, truck_count FROM town_jobs WHERE town_id = $1',
      [jobsTownId],
    )

    expect(stored.rows).toEqual([{ worker_count: 2, truck_count: 1 }])
  })

  it('refuses a job of an empty team', async () => {
    await expect(insertJobOf(client, [0, 0])).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_jobs_team_not_empty',
    })
  })
})
