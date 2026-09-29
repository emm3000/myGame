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
  campBattles,
  fiefArts,
  fiefBuildings,
  fiefEvents,
  fiefMarches,
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

function tierOneBattle(): typeof campBattles.$inferInsert {
  return {
    kingdom: 1,
    province: 2,
    plot: 5,
    strength: 3,
    foughtAt: new Date('2026-09-22T09:00:00Z'),
  }
}

function infantryMarchOf(fiefId: string): typeof fiefMarches.$inferInsert {
  return {
    fiefId,
    province: 2,
    plot: 5,
    infantry: 10,
    stayHours: 2,
    oneWaySeconds: 840,
    departedAt: new Date('2026-09-22T08:00:00Z'),
    lootWood: 60,
    lootStone: 60,
    lootIron: 0,
    lootGold: 0,
    lootFood: 0,
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
      'camp_battles',
      'fief_arts',
      'fief_buildings',
      'fief_events',
      'fief_marches',
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

  it('refuses a cancelled count on a building row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_cancelled',
        building: 'sawmill',
        level: 1,
        cancelledCount: 3,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses a unit row that cancels no unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'recruits_cancelled',
        unit: 'infantry',
        count: 2,
        cancelledCount: 0,
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

  it('refuses a second march for one fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefMarches).values(infantryMarchOf(anasFief.id))

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), infantry: 3 }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fief_marches_pkey' },
    })
  })

  it('refuses a march of no infantry', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), infantry: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_infantry_positive' },
    })
  })

  it('refuses a march that takes no road', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), oneWaySeconds: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_one_way_seconds_positive' },
    })
  })

  it('refuses a negative loot', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), lootIron: -1 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_loot_iron_whole' },
    })
  })

  it('refuses a recall before the departure', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({
        ...infantryMarchOf(anasFief.id),
        recalledAt: new Date('2026-09-22T07:59:59Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_recalled_after_departure' },
    })
  })

  it('refuses an attack march with a stay', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({
        ...infantryMarchOf(anasFief.id),
        marchOrder: 'attack',
        campTier: 1,
        campStrength: 6,
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses a forage march with a camp', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({
        ...infantryMarchOf(anasFief.id),
        campTier: 1,
        campStrength: 6,
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses a forage march that has fought', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), fought: true }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses an attack on a camp of no tier', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({
        ...infantryMarchOf(anasFief.id),
        marchOrder: 'attack',
        stayHours: 0,
        campStrength: 6,
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses an attack on a camp of tier 4', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({
        ...infantryMarchOf(anasFief.id),
        marchOrder: 'attack',
        stayHours: 0,
        campTier: 4,
        campStrength: 6,
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses an attack on a camp of negative strength', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({
        ...infantryMarchOf(anasFief.id),
        marchOrder: 'attack',
        stayHours: 0,
        campTier: 1,
        campStrength: -1,
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('stores an attack march on a camp at strength 0', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await db.insert(fiefMarches).values({
      ...infantryMarchOf(anasFief.id),
      marchOrder: 'attack',
      stayHours: 0,
      campTier: 3,
      campStrength: 0,
      fought: true,
    })

    expect(
      await db
        .select({ order: fiefMarches.marchOrder, fought: fiefMarches.fought })
        .from(fiefMarches),
    ).toEqual([{ order: 'attack', fought: true }])
  })

  it('refuses a battle on plot 0', async () => {
    await expect(
      db.insert(campBattles).values({ ...tierOneBattle(), plot: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'camp_battles_plot_positive' },
    })
  })

  it('refuses a camp left at a negative strength', async () => {
    await expect(
      db.insert(campBattles).values({ ...tierOneBattle(), strength: -1 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'camp_battles_strength_whole' },
    })
  })

  it('keeps the battles of a camp when no fief stands', async () => {
    await db.insert(campBattles).values([tierOneBattle(), { ...tierOneBattle(), strength: 0 }])

    expect(await db.select({ strength: campBattles.strength }).from(campBattles)).toEqual([
      { strength: 3 },
      { strength: 0 },
    ])
  })

  it('refuses a recalled flag on a building row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_finished',
        building: 'sawmill',
        level: 1,
        recalled: true,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_recalled_only_march' },
    })
  })

  it('refuses a plot on a building row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_finished',
        building: 'sawmill',
        level: 1,
        province: 2,
        plot: 5,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses a province without a plot on a unit row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'march_returned',
        unit: 'infantry',
        count: 10,
        province: 2,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_one_subject' },
    })
  })

  it('refuses a camp tier on a march-returned row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'march_returned',
        unit: 'infantry',
        count: 10,
        province: 2,
        plot: 5,
        campTier: 1,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_battle_terms' },
    })
  })

  it('refuses won on a building row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'upgrade_finished',
        building: 'sawmill',
        level: 1,
        won: true,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_battle_terms' },
    })
  })

  it('refuses a battle row without its tier', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'battle_fought',
        unit: 'infantry',
        count: 4,
        province: 2,
        plot: 5,
        campLost: 6,
        won: true,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_battle_terms' },
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

  it('drops the march of a deleted fief', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefMarches).values(infantryMarchOf(anasFief.id))

    await db.delete(fiefs)

    expect(await db.select().from(fiefMarches)).toEqual([])
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

describe('the recruits cancelled migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the chronicle rows stored before the cancel migration', async () => {
    await migratedFrom(client, 13, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_events (fief_id, kind, building, art, unit, level, count, refund_wood, refund_stone, occurred_at)
         VALUES ($1, 'upgrade_finished', 'sawmill', NULL, NULL, 2, NULL, 0, 0, '2026-09-22T09:00:00Z'),
                ($1, 'study_cancelled', NULL, 'masonry', NULL, 1, NULL, 80, 120, '2026-09-22T09:30:00Z'),
                ($1, 'recruits_delivered', NULL, NULL, 'infantry', NULL, 5, 0, 0, '2026-09-22T10:00:00Z')`,
        [anasFief.id],
      )
    })

    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([
      {
        kind: 'recruitsDelivered',
        unit: 'infantry',
        count: 5,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T10:00:00Z')),
      },
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
})

describe('the marches migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the chronicle rows stored before the march migration', async () => {
    await migratedFrom(client, 14, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_events (fief_id, kind, building, unit, level, count, cancelled_count, refund_wood, refund_food, occurred_at)
         VALUES ($1, 'upgrade_finished', 'sawmill', NULL, 2, NULL, NULL, 0, 0, '2026-09-22T09:00:00Z'),
                ($1, 'recruits_cancelled', NULL, 'infantry', NULL, 2, 3, 60, 90, '2026-09-22T10:00:00Z')`,
        [anasFief.id],
      )
    })

    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([
      {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 2,
        cancelled: 3,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T10:00:00Z')),
        refund: { wood: 60, stone: 0, iron: 0, gold: 0, food: 90 },
      },
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 2,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:00:00Z')),
      },
    ])
  })

  it('reads an idle march slot on a fief stored by the previous version', async () => {
    await migratedFrom(client, 14, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)

    expect(restored.ok && restored.value?.march).toEqual({ kind: 'idle' })
  })
})

describe('the march recall migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the marches and the chronicle rows stored before the recall migration', async () => {
    await migratedFrom(client, 15, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_marches (fief_id, province, plot, infantry, stay_hours, one_way_seconds, departed_at,
           loot_wood, loot_stone, loot_iron, loot_gold, loot_food)
         VALUES ($1, 2, 5, 10, 2, 840, '2026-09-22T08:00:00Z', 60, 60, 0, 0, 0)`,
        [anasFief.id],
      )
      await client.query(
        `INSERT INTO fief_events (fief_id, kind, building, unit, level, count, province, plot, refund_wood, refund_stone, occurred_at)
         VALUES ($1, 'upgrade_finished', 'sawmill', NULL, 2, NULL, NULL, NULL, 0, 0, '2026-09-22T09:00:00Z'),
                ($1, 'march_returned', NULL, 'infantry', NULL, 10, 2, 5, 240, 240, '2026-09-22T10:00:00Z')`,
        [anasFief.id],
      )
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)
    expect(restored.ok && restored.value?.march).toEqual({
      kind: 'away',
      order: 'forage',
      province: 2,
      plot: 5,
      infantry: 10,
      stayHours: 2,
      departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
      oneWaySeconds: 840,
      loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
    })
    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 5,
        infantry: 10,
        loot: { wood: 240, stone: 240, iron: 0, gold: 0, food: 0 },
        recalled: false,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T10:00:00Z')),
      },
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 2,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:00:00Z')),
      },
    ])
  })
})

describe('the attack marches migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the marches stored before the attack migration', async () => {
    await migratedFrom(client, 16, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_marches (fief_id, province, plot, infantry, stay_hours, one_way_seconds, departed_at,
           loot_wood, loot_stone, loot_iron, loot_gold, loot_food, recalled_at)
         VALUES ($1, 2, 5, 10, 2, 840, '2026-09-22T08:00:00Z', 25, 25, 0, 0, 0, '2026-09-22T08:30:00Z')`,
        [anasFief.id],
      )
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(ana.id)
    expect(restored.ok && restored.value?.march).toEqual({
      kind: 'away',
      order: 'forage',
      province: 2,
      plot: 5,
      infantry: 10,
      stayHours: 2,
      departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
      oneWaySeconds: 840,
      loot: { wood: 25, stone: 25, iron: 0, gold: 0, food: 0 },
      recalledAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:30:00Z')),
    })
  })
})

describe('the battle event migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('adds the battle kind in the transaction that migrates a database committed at the recall migration', async () => {
    const probeName = `mygame_battle_probe_${process.pid}`
    const admin = new Client({ connectionString: databaseUrl() })
    await admin.connect()
    await admin.query(`CREATE DATABASE ${probeName}`)
    const probeUrl = new URL(databaseUrl())
    probeUrl.pathname = `/${probeName}`
    const probe = new Client({ connectionString: probeUrl.toString() })
    try {
      await probe.connect()
      const migrations = readMigrationFiles({ migrationsFolder })
      await applyMigrations(probe, migrations.slice(0, 16))
      await probe.query('BEGIN')
      await applyMigrations(probe, migrations.slice(16))
      await probe.query('COMMIT')

      const kinds = await probe.query(
        'SELECT unnest(enum_range(NULL::fief_event_kind))::text AS kind',
      )
      expect(kinds.rows.map(({ kind }) => kind)).toContain('battle_fought')
    } finally {
      await probe.end()
      await admin.query(`DROP DATABASE ${probeName} WITH (FORCE)`)
      await admin.end()
    }
  })

  it('keeps the chronicle rows stored before the battle migration', async () => {
    await migratedFrom(client, 17, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_events (fief_id, kind, building, unit, level, count, province, plot, refund_wood, refund_stone, recalled, occurred_at)
         VALUES ($1, 'upgrade_finished', 'sawmill', NULL, 2, NULL, NULL, NULL, 0, 0, false, '2026-09-22T09:00:00Z'),
                ($1, 'march_returned', NULL, 'infantry', NULL, 10, 2, 5, 240, 240, true, '2026-09-22T10:00:00Z')`,
        [anasFief.id],
      )
    })

    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 5,
        infantry: 10,
        loot: { wood: 240, stone: 240, iron: 0, gold: 0, food: 0 },
        recalled: true,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T10:00:00Z')),
      },
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 2,
        occurredAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T09:00:00Z')),
      },
    ])
  })
})
