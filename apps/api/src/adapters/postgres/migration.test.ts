import { fileURLToPath } from 'node:url'
import { Instant } from '@mygame/domain'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenDigest } from '../../auth/tokenDigest'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleChronicle } from './DrizzleChronicle'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'
import {
  accountTokens,
  fiefArts,
  fiefBuildings,
  fiefEvents,
  fiefQueueEntries,
  fiefRecruitOrders,
  fiefs,
  fiefUnits,
  players,
  sessions,
} from './schema'

const migrationsFolder = fileURLToPath(new URL('../../../migrations', import.meta.url))

const uniqueViolation = '23505'

const checkViolation = '23514'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

function aPlayer(id: string, email: string): typeof players.$inferInsert {
  return { id, email, passwordHash: 'argon2id-hash', createdAt: new Date('2026-09-22T08:00:00Z') }
}

function aFief(id: string, playerId: string): typeof fiefs.$inferInsert {
  return {
    id,
    playerId,
    kingdom: 1,
    province: 4,
    plot: 7,
    terrain: 'lowlands',
    name: 'Valdehierro',
    wood: 500,
    stone: 500,
    iron: 0,
    gold: 0,
    food: 200,
    storedAt: new Date('2026-09-22T08:00:00Z'),
  }
}

function infantryOrderOf(fiefId: string): typeof fiefRecruitOrders.$inferInsert {
  return {
    fiefId,
    kind: 'infantry',
    count: 5,
    costWood: 100,
    costStone: 0,
    costIron: 50,
    costGold: 0,
    costFood: 150,
    perUnitSeconds: 90,
    startedAt: new Date('2026-09-22T08:00:00Z'),
  }
}

const ana = aPlayer('00000000-0000-4000-8000-000000000001', 'Ana@Example.com')
const bruno = aPlayer('00000000-0000-4000-8000-000000000002', 'bruno@example.com')
const anasFief = aFief('00000000-0000-4000-8000-00000000000a', ana.id)

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
      'fief_arts',
      'fief_buildings',
      'fief_events',
      'fief_queue_entries',
      'fief_recruit_orders',
      'fief_units',
      'fiefs',
      'players',
      'sessions',
    ])
  })

  it('refuses two players with the same email in different case', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(players).values({ ...bruno, email: 'ana@example.com' }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'players_email_unique' },
    })
  })

  it('refuses two fiefs on the same plot', async () => {
    await db.insert(players).values([ana, bruno])
    await db.insert(fiefs).values(anasFief)

    await expect(
      db
        .insert(fiefs)
        .values({ ...aFief('00000000-0000-4000-8000-00000000000b', bruno.id), name: 'Robledal' }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fiefs_coordinates_unique' },
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

  it('refuses a second level row for the same building on a fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefBuildings).values({ fiefId: anasFief.id, building: 'sawmill', level: 1 })

    await expect(
      db.insert(fiefBuildings).values({ fiefId: anasFief.id, building: 'sawmill', level: 2 }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'fief_buildings_pkey' } })
  })

  it('refuses two entries at the same position of one fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    const waitingSawmill: typeof fiefQueueEntries.$inferInsert = {
      fiefId: anasFief.id,
      position: 0,
      building: 'sawmill',
      targetLevel: 2,
      costWood: 90,
      costStone: 40,
      costIron: 0,
      costGold: 0,
      costFood: 0,
      durationSeconds: 240,
    }
    await db.insert(fiefQueueEntries).values(waitingSawmill)

    await expect(
      db.insert(fiefQueueEntries).values({ ...waitingSawmill, building: 'farm', targetLevel: 1 }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fief_queue_entries_pkey' },
    })
  })

  it('refuses two rows for one art of one fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefArts).values({ fiefId: anasFief.id, art: 'smithing', level: 1 })

    await expect(
      db.insert(fiefArts).values({ fiefId: anasFief.id, art: 'smithing', level: 2 }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'fief_arts_pkey' } })
  })

  it('drops the art rows of a deleted fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefArts).values({ fiefId: anasFief.id, art: 'masonry', level: 1 })

    await db.delete(fiefs)

    expect(await db.select().from(fiefArts)).toEqual([])
  })

  it('refuses an event that names a building and a unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'recruits_delivered',
        building: 'barracks',
        unit: 'infantry',
        count: 5,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses a unit event that carries a level', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'recruits_delivered',
        unit: 'infantry',
        level: 1,
        count: 5,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses a building event that carries a count', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_finished',
        building: 'sawmill',
        level: 1,
        count: 5,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses a second row for one unit of one fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefUnits).values({ fiefId: anasFief.id, kind: 'infantry', count: 3 })

    await expect(
      db.insert(fiefUnits).values({ fiefId: anasFief.id, kind: 'infantry', count: 4 }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'fief_units_pkey' } })
  })

  it('refuses a negative unit count', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefUnits).values({ fiefId: anasFief.id, kind: 'infantry', count: -1 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_units_count_whole' },
    })
  })

  it('refuses a second recruit order for one fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefRecruitOrders).values(infantryOrderOf(anasFief.id))

    await expect(
      db.insert(fiefRecruitOrders).values({ ...infantryOrderOf(anasFief.id), count: 2 }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fief_recruit_orders_pkey' },
    })
  })

  it('refuses a recruit order of no unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefRecruitOrders).values({ ...infantryOrderOf(anasFief.id), count: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_recruit_orders_count_positive' },
    })
  })

  it('refuses a recruit order that delivers in no time', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefRecruitOrders).values({ ...infantryOrderOf(anasFief.id), perUnitSeconds: 0 }),
    ).rejects.toMatchObject({
      cause: {
        code: checkViolation,
        constraint: 'fief_recruit_orders_per_unit_seconds_positive',
      },
    })
  })

  it('drops the units and the recruit order of a deleted fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefUnits).values({ fiefId: anasFief.id, kind: 'infantry', count: 3 })
    await db.insert(fiefRecruitOrders).values(infantryOrderOf(anasFief.id))

    await db.delete(fiefs)

    expect({
      units: await db.select().from(fiefUnits),
      orders: await db.select().from(fiefRecruitOrders),
    }).toEqual({ units: [], orders: [] })
  })

  it('refuses an event that names both a building and an art', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_finished',
        building: 'sawmill',
        art: 'smithing',
        level: 1,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses an event that names neither a building nor an art', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_finished',
        level: 1,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('drops the events of a deleted fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefEvents).values({
      fiefId: anasFief.id,
      kind: 'art_learned',
      art: 'masonry',
      level: 1,
      occurredAt: new Date('2026-09-22T09:00:00Z'),
    })

    await db.delete(fiefs)

    expect(await db.select().from(fiefEvents)).toEqual([])
  })

  it('refuses a second fief for the same player', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db
        .insert(fiefs)
        .values({ ...aFief('00000000-0000-4000-8000-00000000000b', ana.id), plot: 8 }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fiefs_player_unique' },
    })
  })

  it('refuses a fractional stored amount', async () => {
    await db.insert(players).values(ana)

    await expect(db.insert(fiefs).values({ ...anasFief, wood: 500.5 })).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fiefs_wood_whole' },
    })
  })

  it('refuses a negative stored amount', async () => {
    await db.insert(players).values(ana)

    await expect(db.insert(fiefs).values({ ...anasFief, food: -1 })).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fiefs_food_whole' },
    })
  })
})

const insertPlayersOfPreviousVersion = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [ana.id, ana.email, bruno.id, bruno.email],
  )
}

type PreviousVersionSlot = {
  readonly building: string
  readonly level: number
  readonly finishesAt: string
}

const insertFiefOfPreviousVersion = async (
  client: Client,
  id: string,
  playerId: string,
  plot: number,
  slot: PreviousVersionSlot | null,
): Promise<void> => {
  await client.query(
    `INSERT INTO fiefs (id, player_id, kingdom, province, plot, terrain, name, wood, stone, iron, gold, food,
       stored_at, slot_building, slot_level, slot_finishes_at)
     VALUES ($1, $2, 1, 4, $3, 'lowlands', 'Valdehierro', 500, 500, 0, 0, 200,
       '2026-09-22T08:00:00Z', $4, $5, $6)`,
    [id, playerId, plot, slot?.building ?? null, slot?.level ?? null, slot?.finishesAt ?? null],
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

describe('the one fief per player migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the fiefs stored by the previous version', async () => {
    await migratedFrom(client, 1, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    expect(
      await drizzle(client).select({ id: fiefs.id, playerId: fiefs.playerId }).from(fiefs),
    ).toEqual([{ id: anasFief.id, playerId: ana.id }])
  })
})

describe('the busy slot start migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const slotStartOf = async (id: string): Promise<Date | null | undefined> => {
    const read = await client.query<{ slotStartedAt: Date | null }>(
      'SELECT slot_started_at AS "slotStartedAt" FROM fiefs WHERE id = $1',
      [id],
    )
    return read.rows[0]?.slotStartedAt
  }

  it('backfills a running upgrade with the instant it was stored', async () => {
    await migratedFrom(client, 2, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, {
        building: 'sawmill',
        level: 2,
        finishesAt: '2026-09-22T09:00:00Z',
      })
    })

    expect(await slotStartOf(anasFief.id)).toEqual(new Date('2026-09-22T08:00:00Z'))
  })

  it('leaves the start empty on an idle fief', async () => {
    await migratedFrom(client, 2, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    expect(await slotStartOf(anasFief.id)).toBeNull()
  })
})

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

describe('the slot cost migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('stores a zero cost on a fief stored by the previous version', async () => {
    await migratedFrom(client, 4, async () => {
      await insertPlayersOfPreviousVersion(client)
      await client.query(
        `INSERT INTO fiefs (id, player_id, kingdom, province, plot, terrain, name, wood, stone, iron, gold, food,
           stored_at, slot_building, slot_level, slot_started_at, slot_finishes_at)
         VALUES ($1, $2, 1, 4, 7, 'lowlands', 'Valdehierro', 500, 500, 0, 0, 200,
           '2026-09-22T08:00:00Z', 'sawmill', 2, '2026-09-22T08:00:00Z', '2026-09-22T09:00:00Z')`,
        [anasFief.id, ana.id],
      )
    })

    const read = await client.query(
      `SELECT slot_cost_wood, slot_cost_stone, slot_cost_iron, slot_cost_gold, slot_cost_food
       FROM fiefs WHERE id = $1`,
      [anasFief.id],
    )
    expect(read.rows).toEqual([
      {
        slot_cost_wood: 0,
        slot_cost_stone: 0,
        slot_cost_iron: 0,
        slot_cost_gold: 0,
        slot_cost_food: 0,
      },
    ])
  })
})

describe('the fief arts migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('reads every art at level zero on a fief stored by the previous version', async () => {
    await migratedFrom(client, 6, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)

    expect(restored.ok && restored.value?.artLevels).toEqual({ smithing: 0, masonry: 0 })
  })
})

describe('the library building migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('reads a library level stored on a fief of the previous version', async () => {
    await migratedFrom(client, 7, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })
    await client.query(
      `INSERT INTO fief_buildings (fief_id, building, level) VALUES ($1, 'library', 1)`,
      [anasFief.id],
    )

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)

    expect(restored.ok && restored.value?.buildingLevels.library).toBe(1)
  })
})

describe('the study slot migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('reads an idle study slot on a fief stored by the previous version', async () => {
    await migratedFrom(client, 8, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)

    expect(restored.ok && restored.value?.studySlot).toEqual({ kind: 'idle' })
  })

  it('stores a zero study cost on a fief stored by the previous version', async () => {
    await migratedFrom(client, 8, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    const read = await client.query(
      `SELECT study_cost_wood, study_cost_stone, study_cost_iron, study_cost_gold, study_cost_food
       FROM fiefs WHERE id = $1`,
      [anasFief.id],
    )
    expect(read.rows).toEqual([
      {
        study_cost_wood: 0,
        study_cost_stone: 0,
        study_cost_iron: 0,
        study_cost_gold: 0,
        study_cost_food: 0,
      },
    ])
  })
})

describe('the fief events migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('reads an empty chronicle on a fief stored by the previous version', async () => {
    await migratedFrom(client, 9, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([])
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

describe('the barracks building migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the building levels stored before the barracks migration', async () => {
    await migratedFrom(client, 11, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_buildings (fief_id, building, level)
         VALUES ($1, 'sawmill', 2), ($1, 'library', 1)`,
        [anasFief.id],
      )
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)

    expect(restored.ok && restored.value?.buildingLevels).toEqual({
      sawmill: 2,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 1,
      barracks: 0,
    })
  })
})

describe('the units and recruit orders migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the chronicle rows stored before the migration', async () => {
    await migratedFrom(client, 12, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_events (fief_id, kind, building, art, level, refund_wood, refund_stone, occurred_at)
         VALUES ($1, 'upgrade_finished', 'sawmill', NULL, 2, 0, 0, '2026-09-22T09:00:00Z'),
                ($1, 'study_cancelled', NULL, 'masonry', 1, 80, 120, '2026-09-22T09:30:00Z')`,
        [anasFief.id],
      )
    })

    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([
      {
        kind: 'studyCancelled',
        art: 'masonry',
        level: 1,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:30:00Z')),
        refund: { wood: 80, stone: 120, iron: 0, gold: 0, food: 0 },
      },
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 2,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:00:00Z')),
      },
    ])
  })

  it('reads no unit and an idle recruit slot on a fief stored by the previous version', async () => {
    await migratedFrom(client, 12, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)

    expect(
      restored.ok && {
        infantry: restored.value?.units.countOf('infantry'),
        recruitOrder: restored.value?.recruitOrder,
      },
    ).toEqual({ infantry: 0, recruitOrder: { kind: 'idle' } })
  })
})
