import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fiefRepositoryContract } from '../fiefRepositoryContract'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'
import { players } from './schema'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

let pool: Pool

beforeAll(() => {
  pool = new Pool({ connectionString: databaseUrl() })
})

afterAll(async () => {
  await pool.end()
})

const emptyDatabase = async (): Promise<void> => {
  await pool.query(
    'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
  )
}

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  if (playerIds.length === 0) {
    return
  }
  await drizzle(pool)
    .insert(players)
    .values(
      playerIds.map((id) => ({
        id,
        email: `${id}@example.com`,
        passwordHash: 'argon2id-hash',
        createdAt: new Date('2026-09-22T08:00:00Z'),
      })),
    )
}

fiefRepositoryContract('DrizzleFiefRepository', async () => {
  await emptyDatabase()
  return { fiefs: new DrizzleFiefRepository(drizzle(pool), 'lockFree'), registerPlayers }
})

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'
const valdehierro = '00000000-0000-4000-8000-00000000000a'
const robledal = '00000000-0000-4000-8000-00000000000b'

const insertFief = async (
  id: string,
  playerId: string,
  plot: number,
  name: string,
): Promise<void> => {
  await pool.query(
    `INSERT INTO fiefs (id, player_id, kingdom, province, plot, terrain, name, wood, stone, iron, gold, food, stored_at)
     VALUES ($1, $2, 1, 4, $3, 'lowlands', $4, 500, 500, 200, 50, 300, '2026-09-22T08:00:00Z')`,
    [id, playerId, plot, name],
  )
}

const insertLevel = async (fiefId: string, building: string, level: number): Promise<void> => {
  await pool.query('INSERT INTO fief_buildings (fief_id, building, level) VALUES ($1, $2, $3)', [
    fiefId,
    building,
    level,
  ])
}

const anasFiefWithTwoBuildings = async (): Promise<void> => {
  await emptyDatabase()
  await registerPlayers([ana, bruno])
  await insertFief(valdehierro, ana, 7, 'Valdehierro')
  await insertLevel(valdehierro, 'sawmill', 2)
  await insertLevel(valdehierro, 'iron_mine', 1)
}

describe('DrizzleFiefRepository reads', () => {
  it('reads a fief in a single round trip', async () => {
    await anasFiefWithTwoBuildings()
    const statements: Array<string> = []
    const countingDatabase = drizzle(pool, {
      logger: { logQuery: (statement) => statements.push(statement) },
    })

    const read = await new DrizzleFiefRepository(countingDatabase, 'lockFree').fiefOf(valdehierro)

    expect(read.ok && read.value?.buildingLevels).toEqual({
      sawmill: 2,
      quarry: 0,
      ironMine: 1,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 0,
    })
    expect(statements).toHaveLength(1)
  })

  it('reads a fief without waiting on the lock a mutation holds', async () => {
    await anasFiefWithTwoBuildings()

    const read = await drizzle(pool).transaction(async (transaction) => {
      await new DrizzleFiefRepository(transaction, 'lockedForUpdate').fiefOf(valdehierro)
      return new DrizzleFiefRepository(drizzle(pool), 'lockFree').fiefOf(valdehierro)
    })

    expect(read.ok && read.value?.id).toBe(valdehierro)
  })

  it('restores a fief with the levels of its own buildings only', async () => {
    await anasFiefWithTwoBuildings()
    await insertFief(robledal, bruno, 8, 'Robledal')
    await insertLevel(robledal, 'quarry', 3)

    const read = await new DrizzleFiefRepository(drizzle(pool), 'lockFree').fiefOf(valdehierro)

    expect(read.ok && [read.value?.id, read.value?.buildingLevels]).toEqual([
      valdehierro,
      { sawmill: 2, quarry: 0, ironMine: 1, farm: 0, warehouse: 0, library: 0, barracks: 0 },
    ])
  })

  it('refuses to read a busy slot stored without its start instant', async () => {
    await anasFiefWithTwoBuildings()
    await pool.query(
      `UPDATE fiefs SET slot_building = 'sawmill', slot_level = 3, slot_finishes_at = '2026-09-22T09:00:00Z'
       WHERE id = $1`,
      [valdehierro],
    )

    await expect(
      new DrizzleFiefRepository(drizzle(pool), 'lockFree').fiefOf(valdehierro),
    ).rejects.toThrow('half-written build slot')
  })
})
