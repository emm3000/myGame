import { fileURLToPath } from 'node:url'
import { Instant } from '@mygame/domain'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DrizzleAccounts } from './DrizzleAccounts'
import { fiefBuildings, fiefs, players, sessions } from './schema'
import { sessionTokenDigest } from './sessionTokenDigest'

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
      'fief_buildings',
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
    const tokenDigest = sessionTokenDigest('opaque-token')
    await db.insert(sessions).values({ tokenDigest, playerId: ana.id, expiresAt })

    await expect(
      db.insert(sessions).values({ tokenDigest, playerId: bruno.id, expiresAt }),
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

  it('refuses a second level row for the same building on a fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefBuildings).values({ fiefId: anasFief.id, building: 'sawmill', level: 1 })

    await expect(
      db.insert(fiefBuildings).values({ fiefId: anasFief.id, building: 'sawmill', level: 2 }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'fief_buildings_pkey' } })
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
