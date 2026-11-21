import { Instant } from '@mygame/domain'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeWithoutChanges,
  migratedFrom,
  migratedThroughNext,
  openEmptyDatabase,
} from '../../../platform/infrastructure/postgres/migrationDatabase.testSupport'
import { players } from './accountTables'
import { DrizzleSessions } from './DrizzleSessions'
import { ana, bruno } from './migrationPlayers.testSupport'

const insertPlayersOfPreviousVersion = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [ana.id, ana.email, bruno.id, bruno.email],
  )
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

    const renewedFor = await new DrizzleSessions(drizzle(client)).renewSession(
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

const scaffoldOwnerId = '00000000-0000-4000-8000-0000000000a9'

const migrationsBeforeTheScaffold = 43

describe('the scaffold migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheScaffold, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'learner@example.com', 'argon2id-hash', '2026-11-12T08:00:00Z', '2026-11-12T08:00:00Z')`,
        [scaffoldOwnerId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('sets the scaffold of every player stored before the migration to es', async () => {
    const stored = await client.query('SELECT id, scaffold FROM players')

    expect(stored.rows).toEqual([{ id: scaffoldOwnerId, scaffold: 'es' }])
  })

  it('refuses a player stored without a scaffold', async () => {
    await expect(
      client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ('00000000-0000-4000-8000-0000000000aa', 'newcomer@example.com', 'argon2id-hash',
           '2026-11-13T08:00:00Z', '2026-11-13T08:00:00Z')`,
      ),
    ).rejects.toThrow('null value in column "scaffold"')
  })

  it('refuses a scaffold language Townword does not offer', async () => {
    await expect(
      client.query(`UPDATE players SET scaffold = 'fr' WHERE id = $1`, [scaffoldOwnerId]),
    ).rejects.toThrow('invalid input value for enum scaffold')
  })
})

const scaffoldVersionOwnerId = '00000000-0000-4000-8000-0000000000b0'

const migrationsBeforeTheScaffoldVersion = 44

describe('the scaffold version migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheScaffoldVersion, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at, scaffold)
         VALUES ($1, 'learner@example.com', 'argon2id-hash', '2026-11-16T08:00:00Z', '2026-11-16T08:00:00Z', 'none')`,
        [scaffoldVersionOwnerId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the scaffold of every player stored before the migration', async () => {
    const stored = await client.query('SELECT id, scaffold FROM players')

    expect(stored.rows).toEqual([{ id: scaffoldVersionOwnerId, scaffold: 'none' }])
  })

  it('starts a player stored before the migration at the scaffold version a new player starts at', async () => {
    await client.query(
      `INSERT INTO players (id, email, password_hash, created_at, report_read_at, scaffold)
       VALUES ('00000000-0000-4000-8000-0000000000b1', 'newcomer@example.com', 'argon2id-hash',
         '2026-11-16T09:00:00Z', '2026-11-16T09:00:00Z', 'es')`,
    )

    const versions = await client.query('SELECT DISTINCT scaffold_version FROM players')

    expect(versions.rows).toHaveLength(1)
  })

  it('refuses a player without a scaffold version', async () => {
    await expect(
      client.query('UPDATE players SET scaffold_version = NULL WHERE id = $1', [
        scaffoldVersionOwnerId,
      ]),
    ).rejects.toThrow('null value in column "scaffold_version"')
  })
})
