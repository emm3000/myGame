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
    infantryCount: 10,
    cavalryCount: 0,
    settlerCount: 0,
    stayHours: 2,
    oneWaySeconds: 840,
    departedAt: new Date('2026-09-22T08:00:00Z'),
    lootWood: 60,
    lootStone: 60,
    lootIron: 0,
    lootGold: 0,
    lootFood: 0,
    lootPercentWood: 100,
    lootPercentStone: 100,
    lootPercentIron: 100,
    lootPercentGold: 100,
    lootPercentFood: 100,
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

  it('stores a cavalry count', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefUnits).values([
      { fiefId: anasFief.id, kind: 'infantry', count: 3 },
      { fiefId: anasFief.id, kind: 'cavalry', count: 6 },
    ])

    const restored = await new DrizzleFiefRepository(db, 'lockFree').fiefOf(anasFief.id)

    expect(
      restored.ok && {
        infantry: restored.value?.units.countOf('infantry'),
        cavalry: restored.value?.units.countOf('cavalry'),
      },
    ).toEqual({ infantry: 3, cavalry: 6 })
  })

  it('stores a settler count', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)
    await db.insert(fiefUnits).values([{ fiefId: anasFief.id, kind: 'settler', count: 1 }])
    await db
      .insert(fiefMarches)
      .values({ ...infantryMarchOf(anasFief.id), infantryCount: 0, settlerCount: 1 })

    const restored = await new DrizzleFiefRepository(db, 'lockFree').fiefOf(anasFief.id)

    expect(
      restored.ok && {
        atHome: restored.value?.units.countOf('settler'),
        away: restored.value?.march.kind === 'away' && restored.value.march.units,
      },
    ).toEqual({ atHome: 1, away: { infantry: 0, cavalry: 0, settler: 1 } })
  })

  it('refuses a negative settler count on a march', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), settlerCount: -1 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_settler_count_whole' },
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
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), infantryCount: 3 }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fief_marches_pkey' },
    })
  })

  it('refuses a march with no unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db
        .insert(fiefMarches)
        .values({ ...infantryMarchOf(anasFief.id), infantryCount: 0, cavalryCount: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_units_positive' },
    })
  })

  it('refuses a negative rider count on a march', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db
        .insert(fiefMarches)
        .values({ ...infantryMarchOf(anasFief.id), infantryCount: 10, cavalryCount: -1 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_cavalry_count_whole' },
    })
  })

  it('stores a march of riders alone', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await db
      .insert(fiefMarches)
      .values({ ...infantryMarchOf(anasFief.id), infantryCount: 0, cavalryCount: 6 })

    const restored = await new DrizzleFiefRepository(db, 'lockFree').fiefOf(anasFief.id)
    expect(
      restored.ok && restored.value?.march.kind === 'away' && restored.value.march.units,
    ).toEqual({
      infantry: 0,
      cavalry: 6,
      settler: 0,
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

  it.each([
    ['wood', { lootPercentWood: 0 }],
    ['stone', { lootPercentStone: 0 }],
    ['iron', { lootPercentIron: 0 }],
    ['gold', { lootPercentGold: 0 }],
    ['food', { lootPercentFood: 0 }],
  ])('refuses a %s loot percent of 0', async (resource, zeroPercent) => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...infantryMarchOf(anasFief.id), ...zeroPercent }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: `fief_marches_loot_percent_${resource}_positive` },
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

  const settlerFoundingOf = (fiefId: string): typeof fiefMarches.$inferInsert => ({
    ...infantryMarchOf(fiefId),
    infantryCount: 0,
    settlerCount: 1,
    stayHours: 0,
    oneWaySeconds: 900,
    lootWood: 0,
    lootStone: 0,
    marchOrder: 'found',
    foundingName: 'Sotoverde del Páramo',
  })

  const brunosFief = {
    ...aFief('00000000-0000-4000-8000-00000000000b', bruno.id),
    plot: 8,
    name: 'Robledal',
  }

  it('stores a founding march', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await db.insert(fiefMarches).values(settlerFoundingOf(anasFief.id))

    expect(
      await db
        .select({ order: fiefMarches.marchOrder, name: fiefMarches.foundingName })
        .from(fiefMarches),
    ).toEqual([{ order: 'found', name: 'Sotoverde del Páramo' }])
  })

  it('refuses two foundings to one plot', async () => {
    await db.insert(players).values([ana, bruno])
    await db.insert(fiefs).values([anasFief, brunosFief])
    await db.insert(fiefMarches).values(settlerFoundingOf(anasFief.id))

    await expect(
      db.insert(fiefMarches).values(settlerFoundingOf(brunosFief.id)),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'fief_marches_founding_plot_unique' },
    })
  })

  it('stores a founding to a plot whose founding was recalled', async () => {
    await db.insert(players).values([ana, bruno])
    await db.insert(fiefs).values([anasFief, brunosFief])
    await db
      .insert(fiefMarches)
      .values({ ...settlerFoundingOf(anasFief.id), recalledAt: new Date('2026-09-22T08:05:00Z') })

    await db.insert(fiefMarches).values(settlerFoundingOf(brunosFief.id))

    expect(await db.select({ fiefId: fiefMarches.fiefId }).from(fiefMarches)).toHaveLength(2)
  })

  it('refuses a founding march without its name', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...settlerFoundingOf(anasFief.id), foundingName: null }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses a founding march with a footman beside the settler', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefMarches).values({ ...settlerFoundingOf(anasFief.id), infantryCount: 1 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_marches_order_terms' },
    })
  })

  it('refuses a forage march with a founding name', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db
        .insert(fiefMarches)
        .values({ ...infantryMarchOf(anasFief.id), foundingName: 'Sotoverde del Páramo' }),
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

  it('refuses a province without a plot on a march-returned row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'march_returned',
        infantryCount: 10,
        cavalryCount: 0,
        settlerCount: 0,
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
        infantryCount: 10,
        cavalryCount: 0,
        settlerCount: 0,
        province: 2,
        plot: 5,
        campTier: 1,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_battle_terms' },
    })
  })

  it('refuses a return with no unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'march_returned',
        infantryCount: 0,
        cavalryCount: 0,
        settlerCount: 0,
        province: 2,
        plot: 5,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_unit_counts' },
    })
  })

  it('stores a battle that lost no unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await db.insert(fiefEvents).values({
      fiefId: anasFief.id,
      kind: 'battle_fought',
      infantryCount: 0,
      cavalryCount: 0,
      settlerCount: 0,
      province: 2,
      plot: 5,
      campTier: 1,
      campLost: 0,
      won: true,
      occurredAt: new Date('2026-09-22T09:00:00Z'),
    })

    expect(await new DrizzleChronicle(db).eventsOf(anasFief.id)).toMatchObject([
      { kind: 'battleFought', unitsLost: { infantry: 0, cavalry: 0, settler: 0 } },
    ])
  })

  it('refuses a march-returned row that names one unit', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'march_returned',
        unit: 'infantry',
        count: 10,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_unit_counts' },
    })
  })

  it('refuses unit counts on a recruit row', async () => {
    await db.insert(players).values(ana)
    await db.insert(fiefs).values(anasFief)

    await expect(
      db.insert(fiefEvents).values({
        fiefId: anasFief.id,
        kind: 'recruits_delivered',
        infantryCount: 5,
        cavalryCount: 0,
        settlerCount: 0,
        province: 2,
        plot: 5,
        occurredAt: new Date('2026-09-22T09:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'fief_events_unit_counts' },
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
        infantryCount: 4,
        cavalryCount: 0,
        settlerCount: 0,
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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )
    expect(restored.ok && restored.value?.march).toEqual({
      kind: 'away',
      order: 'forage',
      province: 2,
      plot: 5,
      units: { infantry: 10, cavalry: 0, settler: 0 },
      stayHours: 2,
      departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
      oneWaySeconds: 840,
      loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
      lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    })
    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasFief.id)).toEqual([
      {
        kind: 'marchReturned',
        province: 2,
        plot: 5,
        units: { infantry: 10, cavalry: 0, settler: 0 },
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

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )
    expect(restored.ok && restored.value?.march).toEqual({
      kind: 'away',
      order: 'forage',
      province: 2,
      plot: 5,
      units: { infantry: 10, cavalry: 0, settler: 0 },
      stayHours: 2,
      departedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
      oneWaySeconds: 840,
      loot: { wood: 25, stone: 25, iron: 0, gold: 0, food: 0 },
      lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
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
        units: { infantry: 10, cavalry: 0, settler: 0 },
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

describe('the cavalry migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the unit rows stored before the cavalry migration', async () => {
    await migratedFrom(client, 18, async () => {
      await insertPlayersOfPreviousVersion(client)
      await insertFiefOfPreviousVersion(client, anasFief.id, ana.id, 7, null)
      await client.query(
        `INSERT INTO fief_units (fief_id, kind, count) VALUES ($1, 'infantry', 12)`,
        [anasFief.id],
      )
      await client.query(
        `INSERT INTO fief_recruit_orders (fief_id, kind, count, cost_wood, cost_stone, cost_iron, cost_gold, cost_food, per_unit_seconds, started_at)
         VALUES ($1, 'infantry', 2, 40, 0, 20, 0, 60, 45, '2026-09-22T08:00:00Z')`,
        [anasFief.id],
      )
    })

    const restored = await new DrizzleFiefRepository(drizzle(client), 'lockFree').fiefOf(
      anasFief.id,
    )

    expect(
      restored.ok && {
        infantry: restored.value?.units.countOf('infantry'),
        cavalry: restored.value?.units.countOf('cavalry'),
        recruitOrder: restored.value?.recruitOrder,
      },
    ).toEqual({
      infantry: 12,
      cavalry: 0,
      recruitOrder: {
        kind: 'open',
        unit: 'infantry',
        count: 2,
        cost: { wood: 40, stone: 0, iron: 20, gold: 0, food: 60 },
        perUnitSeconds: 45,
        startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
      },
    })
  })
})

const carla = aPlayer('00000000-0000-4000-8000-000000000003', 'carla@example.com')
const dario = aPlayer('00000000-0000-4000-8000-000000000004', 'dario@example.com')

const anasPartyFief = '00000000-0000-4000-8000-0000000000a1'

const partyFiefs = [
  { player: ana, fiefId: anasPartyFief },
  { player: bruno, fiefId: '00000000-0000-4000-8000-0000000000a2' },
  { player: carla, fiefId: '00000000-0000-4000-8000-0000000000a3' },
  { player: dario, fiefId: '00000000-0000-4000-8000-0000000000a4' },
]

const insertMarchesOfPartyVersion = async (client: Client): Promise<void> => {
  await insertPlayersOfPreviousVersion(client)
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [carla.id, carla.email, dario.id, dario.email],
  )
  for (const [plot, { player, fiefId }] of partyFiefs.entries()) {
    await insertFiefOfPreviousVersion(client, fiefId, player.id, plot + 1, null)
  }
  await client.query(
    `INSERT INTO fief_marches (fief_id, province, plot, infantry, stay_hours, one_way_seconds, departed_at,
       loot_wood, loot_stone, loot_iron, loot_gold, loot_food, recalled_at, march_order, camp_tier, camp_strength, fought)
     VALUES ($1, 2, 5, 10, 2, 840, '2026-09-22T08:00:00Z', 60, 60, 0, 0, 0, NULL, 'forage', NULL, NULL, false),
            ($2, 2, 5, 8, 2, 840, '2026-09-22T08:00:00Z', 25, 25, 0, 0, 0, '2026-09-22T08:30:00Z', 'forage', NULL, NULL, false),
            ($3, 2, 6, 12, 0, 900, '2026-09-22T08:00:00Z', 0, 0, 0, 0, 0, NULL, 'attack', 1, 6, false),
            ($4, 2, 6, 9, 0, 900, '2026-09-22T08:00:00Z', 96, 96, 0, 96, 0, NULL, 'attack', 2, 15, true)`,
    partyFiefs.map(({ fiefId }) => fiefId),
  )
}

const insertEventsOfPartyVersion = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO fief_events (fief_id, kind, unit, count, cancelled_count, province, plot, refund_wood, refund_stone,
       refund_iron, refund_gold, refund_food, recalled, camp_tier, camp_lost, won, occurred_at)
     VALUES ($1, 'recruits_delivered', 'infantry', 4, NULL, NULL, NULL, 0, 0, 0, 0, 0, false, NULL, NULL, false, '2026-09-22T09:00:00Z'),
            ($1, 'recruits_cancelled', 'infantry', 1, 2, NULL, NULL, 40, 0, 20, 0, 60, false, NULL, NULL, false, '2026-09-22T09:10:00Z'),
            ($1, 'march_returned', 'infantry', 10, NULL, 2, 5, 240, 240, 0, 0, 0, false, NULL, NULL, false, '2026-09-22T09:20:00Z'),
            ($1, 'march_returned', 'infantry', 8, NULL, 2, 5, 25, 25, 0, 0, 0, true, NULL, NULL, false, '2026-09-22T09:30:00Z'),
            ($1, 'battle_fought', 'infantry', 4, NULL, 2, 6, 0, 0, 0, 0, 0, false, 2, 15, true, '2026-09-22T09:40:00Z'),
            ($1, 'battle_fought', 'infantry', 3, NULL, 2, 6, 0, 0, 0, 0, 0, false, 1, 2, false, '2026-09-22T09:50:00Z')`,
    [anasPartyFief],
  )
}

const departedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z'))

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const marchesOfPartyVersion = [
  {
    kind: 'away',
    order: 'forage',
    province: 2,
    plot: 5,
    units: { infantry: 10, cavalry: 0, settler: 0 },
    stayHours: 2,
    departedAt,
    oneWaySeconds: 840,
    loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
    lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
  },
  {
    kind: 'away',
    order: 'forage',
    province: 2,
    plot: 5,
    units: { infantry: 8, cavalry: 0, settler: 0 },
    stayHours: 2,
    departedAt,
    oneWaySeconds: 840,
    loot: { wood: 25, stone: 25, iron: 0, gold: 0, food: 0 },
    lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    recalledAt: instantAt('2026-09-22T08:30:00Z'),
  },
  {
    kind: 'away',
    order: 'attack',
    province: 2,
    plot: 6,
    units: { infantry: 12, cavalry: 0, settler: 0 },
    stayHours: 0,
    departedAt,
    oneWaySeconds: 900,
    loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
    lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    camp: { tier: 1, strength: 6 },
    fought: false,
  },
  {
    kind: 'away',
    order: 'attack',
    province: 2,
    plot: 6,
    units: { infantry: 9, cavalry: 0, settler: 0 },
    stayHours: 0,
    departedAt,
    oneWaySeconds: 900,
    loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
    lootPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    camp: { tier: 2, strength: 15 },
    fought: true,
  },
]

const eventsOfPartyVersion = [
  {
    kind: 'battleFought',
    province: 2,
    plot: 6,
    tier: 1,
    won: false,
    unitsLost: { infantry: 3, cavalry: 0, settler: 0 },
    campLost: 2,
    occurredAt: instantAt('2026-09-22T09:50:00Z'),
  },
  {
    kind: 'battleFought',
    province: 2,
    plot: 6,
    tier: 2,
    won: true,
    unitsLost: { infantry: 4, cavalry: 0, settler: 0 },
    campLost: 15,
    occurredAt: instantAt('2026-09-22T09:40:00Z'),
  },
  {
    kind: 'marchReturned',
    province: 2,
    plot: 5,
    units: { infantry: 8, cavalry: 0, settler: 0 },
    loot: { wood: 25, stone: 25, iron: 0, gold: 0, food: 0 },
    recalled: true,
    occurredAt: instantAt('2026-09-22T09:30:00Z'),
  },
  {
    kind: 'marchReturned',
    province: 2,
    plot: 5,
    units: { infantry: 10, cavalry: 0, settler: 0 },
    loot: { wood: 240, stone: 240, iron: 0, gold: 0, food: 0 },
    recalled: false,
    occurredAt: instantAt('2026-09-22T09:20:00Z'),
  },
  {
    kind: 'recruitsCancelled',
    unit: 'infantry',
    delivered: 1,
    cancelled: 2,
    refund: { wood: 40, stone: 0, iron: 20, gold: 0, food: 60 },
    occurredAt: instantAt('2026-09-22T09:10:00Z'),
  },
  {
    kind: 'recruitsDelivered',
    unit: 'infantry',
    count: 4,
    occurredAt: instantAt('2026-09-22T09:00:00Z'),
  },
]

const marchesOf = async (client: Client): Promise<ReadonlyArray<unknown>> => {
  const fiefs = new DrizzleFiefRepository(drizzle(client), 'lockFree')
  const restored = []
  for (const { fiefId } of partyFiefs) {
    const read = await fiefs.fiefOf(fiefId)
    restored.push(read.ok && read.value?.march)
  }
  return restored
}

describe('the march units migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the marches stored before the party migration as infantry', async () => {
    await migratedFrom(client, 19, async () => {
      await insertMarchesOfPartyVersion(client)
    })

    expect(await marchesOf(client)).toEqual(marchesOfPartyVersion)
  })

  it('keeps the return and battle events stored before the party migration as infantry', async () => {
    await migratedFrom(client, 19, async () => {
      await insertMarchesOfPartyVersion(client)
      await insertEventsOfPartyVersion(client)
    })

    expect(await new DrizzleChronicle(drizzle(client)).eventsOf(anasPartyFief)).toEqual(
      eventsOfPartyVersion,
    )
  })

  it('carries the marches and events forward in its own transaction on a database committed at the cavalry migration', async () => {
    const probeName = `mygame_party_probe_${process.pid}`
    const admin = new Client({ connectionString: databaseUrl() })
    await admin.connect()
    await admin.query(`CREATE DATABASE ${probeName}`)
    const probeUrl = new URL(databaseUrl())
    probeUrl.pathname = `/${probeName}`
    const probe = new Client({ connectionString: probeUrl.toString() })
    try {
      await probe.connect()
      const migrations = readMigrationFiles({ migrationsFolder })
      await applyMigrations(probe, migrations.slice(0, 19))
      await insertMarchesOfPartyVersion(probe)
      await insertEventsOfPartyVersion(probe)
      await probe.query('BEGIN')
      await applyMigrations(probe, migrations.slice(19))
      await probe.query('COMMIT')

      expect({
        marches: await marchesOf(probe),
        events: await new DrizzleChronicle(drizzle(probe)).eventsOf(anasPartyFief),
      }).toEqual({ marches: marchesOfPartyVersion, events: eventsOfPartyVersion })
    } finally {
      await probe.end()
      await admin.query(`DROP DATABASE ${probeName} WITH (FORCE)`)
      await admin.end()
    }
  })
})

const insertMarchesOfLootPercentVersion = async (client: Client): Promise<void> => {
  await insertPlayersOfPreviousVersion(client)
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [carla.id, carla.email, dario.id, dario.email],
  )
  for (const [plot, { player, fiefId }] of partyFiefs.entries()) {
    await insertFiefOfPreviousVersion(client, fiefId, player.id, plot + 1, null)
  }
  await client.query(
    `INSERT INTO fief_marches (fief_id, province, plot, infantry_count, cavalry_count, stay_hours, one_way_seconds,
       departed_at, loot_wood, loot_stone, loot_iron, loot_gold, loot_food, recalled_at, march_order, camp_tier,
       camp_strength, fought)
     VALUES ($1, 2, 5, 12, 6, 2, 900, '2026-09-22T08:00:00Z', 108, 108, 0, 0, 0, NULL, 'forage', NULL, NULL, false),
            ($2, 2, 5, 8, 0, 2, 840, '2026-09-22T08:00:00Z', 25, 25, 0, 0, 0, '2026-09-22T08:30:00Z', 'forage', NULL, NULL, false),
            ($3, 2, 6, 0, 10, 0, 450, '2026-09-22T08:00:00Z', 0, 0, 0, 0, 0, NULL, 'attack', 1, 6, false),
            ($4, 2, 6, 9, 0, 0, 900, '2026-09-22T08:00:00Z', 96, 96, 0, 96, 0, NULL, 'attack', 2, 15, true)`,
    partyFiefs.map(({ fiefId }) => fiefId),
  )
}

const [forageOfPartyVersion, recallOfPartyVersion, attackOfPartyVersion, wonAttackOfPartyVersion] =
  marchesOfPartyVersion

const marchesOfLootPercentVersion = [
  {
    ...forageOfPartyVersion,
    units: { infantry: 12, cavalry: 6, settler: 0 },
    oneWaySeconds: 900,
    loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
  },
  recallOfPartyVersion,
  { ...attackOfPartyVersion, units: { infantry: 0, cavalry: 10, settler: 0 }, oneWaySeconds: 450 },
  wonAttackOfPartyVersion,
]

describe('the march loot percents migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('reads the marches stored before the loot percents at 100', async () => {
    await migratedFrom(client, 20, async () => {
      await insertMarchesOfLootPercentVersion(client)
    })

    expect(await marchesOf(client)).toEqual(marchesOfLootPercentVersion)
  })
})

const insertMarchesOfSettlerVersion = async (client: Client): Promise<void> => {
  await insertPlayersOfPreviousVersion(client)
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [carla.id, carla.email, dario.id, dario.email],
  )
  for (const [plot, { player, fiefId }] of partyFiefs.entries()) {
    await insertFiefOfPreviousVersion(client, fiefId, player.id, plot + 1, null)
  }
  await client.query(
    `INSERT INTO fief_marches (fief_id, province, plot, infantry_count, cavalry_count, stay_hours, one_way_seconds,
       departed_at, loot_wood, loot_stone, loot_iron, loot_gold, loot_food, loot_percent_wood, loot_percent_stone,
       loot_percent_iron, loot_percent_gold, loot_percent_food, recalled_at, march_order, camp_tier, camp_strength,
       fought)
     VALUES ($1, 2, 5, 12, 6, 2, 900, '2026-09-22T08:00:00Z', 108, 108, 0, 0, 0, 100, 100, 100, 100, 100, NULL, 'forage', NULL, NULL, false),
            ($2, 2, 5, 8, 0, 2, 840, '2026-09-22T08:00:00Z', 25, 25, 0, 0, 0, 100, 100, 100, 100, 100, '2026-09-22T08:30:00Z', 'forage', NULL, NULL, false),
            ($3, 2, 6, 0, 10, 0, 450, '2026-09-22T08:00:00Z', 0, 0, 0, 0, 0, 100, 100, 100, 100, 100, NULL, 'attack', 1, 6, false),
            ($4, 2, 6, 9, 0, 0, 900, '2026-09-22T08:00:00Z', 96, 96, 0, 96, 0, 100, 100, 100, 100, 100, NULL, 'attack', 2, 15, true)`,
    partyFiefs.map(({ fiefId }) => fiefId),
  )
}

const insertEventsOfSettlerVersion = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO fief_events (fief_id, kind, unit, count, cancelled_count, infantry_count, cavalry_count, province, plot,
       refund_wood, refund_stone, refund_iron, refund_gold, refund_food, recalled, camp_tier, camp_lost, won, occurred_at)
     VALUES ($1, 'recruits_delivered', 'infantry', 4, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, false, NULL, NULL, false, '2026-09-22T09:00:00Z'),
            ($1, 'recruits_cancelled', 'infantry', 1, 2, NULL, NULL, NULL, NULL, 40, 0, 20, 0, 60, false, NULL, NULL, false, '2026-09-22T09:10:00Z'),
            ($1, 'march_returned', NULL, NULL, NULL, 10, 0, 2, 5, 240, 240, 0, 0, 0, false, NULL, NULL, false, '2026-09-22T09:20:00Z'),
            ($1, 'march_returned', NULL, NULL, NULL, 8, 0, 2, 5, 25, 25, 0, 0, 0, true, NULL, NULL, false, '2026-09-22T09:30:00Z'),
            ($1, 'battle_fought', NULL, NULL, NULL, 4, 0, 2, 6, 0, 0, 0, 0, 0, false, 2, 15, true, '2026-09-22T09:40:00Z'),
            ($1, 'battle_fought', NULL, NULL, NULL, 3, 0, 2, 6, 0, 0, 0, 0, 0, false, 1, 2, false, '2026-09-22T09:50:00Z')`,
    [anasPartyFief],
  )
}

describe('the settler migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the marches and events stored before the settler migration', async () => {
    await migratedFrom(client, 21, async () => {
      await insertMarchesOfSettlerVersion(client)
      await insertEventsOfSettlerVersion(client)
    })

    expect({
      marches: await marchesOf(client),
      events: await new DrizzleChronicle(drizzle(client)).eventsOf(anasPartyFief),
    }).toEqual({ marches: marchesOfLootPercentVersion, events: eventsOfPartyVersion })
  })
})

const insertMarchesOfFoundingVersion = async (client: Client): Promise<void> => {
  await insertPlayersOfPreviousVersion(client)
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z'), ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
    [carla.id, carla.email, dario.id, dario.email],
  )
  for (const [plot, { player, fiefId }] of partyFiefs.entries()) {
    await insertFiefOfPreviousVersion(client, fiefId, player.id, plot + 1, null)
  }
  await client.query(
    `INSERT INTO fief_marches (fief_id, province, plot, infantry_count, cavalry_count, settler_count, stay_hours,
       one_way_seconds, departed_at, loot_wood, loot_stone, loot_iron, loot_gold, loot_food, loot_percent_wood,
       loot_percent_stone, loot_percent_iron, loot_percent_gold, loot_percent_food, recalled_at, march_order,
       camp_tier, camp_strength, fought)
     VALUES ($1, 2, 5, 12, 6, 0, 2, 900, '2026-09-22T08:00:00Z', 108, 108, 0, 0, 0, 100, 100, 100, 100, 100, NULL, 'forage', NULL, NULL, false),
            ($2, 2, 5, 8, 0, 0, 2, 840, '2026-09-22T08:00:00Z', 25, 25, 0, 0, 0, 100, 100, 100, 100, 100, '2026-09-22T08:30:00Z', 'forage', NULL, NULL, false),
            ($3, 2, 6, 0, 10, 0, 0, 450, '2026-09-22T08:00:00Z', 0, 0, 0, 0, 0, 100, 100, 100, 100, 100, NULL, 'attack', 1, 6, false),
            ($4, 2, 6, 9, 0, 0, 0, 900, '2026-09-22T08:00:00Z', 96, 96, 0, 96, 0, 100, 100, 100, 100, 100, NULL, 'attack', 2, 15, true)`,
    partyFiefs.map(({ fiefId }) => fiefId),
  )
}

describe('the founding march migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps the marches stored before the founding migration', async () => {
    await migratedFrom(client, 22, async () => {
      await insertMarchesOfFoundingVersion(client)
    })

    expect(await marchesOf(client)).toEqual(marchesOfLootPercentVersion)
  })
})
