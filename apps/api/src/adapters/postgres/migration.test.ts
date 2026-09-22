import { fileURLToPath } from 'node:url'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fiefBuildings, fiefs, players, sessions } from './schema'

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

  it('refuses two sessions with the same token', async () => {
    await db.insert(players).values([ana, bruno])
    const expiresAt = new Date('2026-10-22T08:00:00Z')
    await db.insert(sessions).values({ token: 'opaque-token', playerId: ana.id, expiresAt })

    await expect(
      db.insert(sessions).values({ token: 'opaque-token', playerId: bruno.id, expiresAt }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'sessions_pkey' } })
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

describe('the one fief per player migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the fiefs stored by the previous version', async () => {
    const migrations = readMigrationFiles({ migrationsFolder })
    await applyMigrations(client, migrations.slice(0, 1))
    const db = drizzle(client)
    await db.insert(players).values([ana, bruno])
    await db.insert(fiefs).values(anasFief)

    await applyMigrations(client, migrations.slice(1))

    expect(await db.select({ id: fiefs.id, playerId: fiefs.playerId }).from(fiefs)).toEqual([
      { id: anasFief.id, playerId: ana.id },
    ])
  })
})
