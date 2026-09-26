import { Coordinates, type DomainError, Fief, FiefName, Instant, type Result } from '@mygame/domain'
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
  await pool.query('TRUNCATE players, sessions, fiefs, fief_buildings, fief_queue_entries')
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

    const read = await new DrizzleFiefRepository(countingDatabase, 'lockFree').fiefOf(ana)

    expect(read.ok && read.value?.buildingLevels).toEqual({
      sawmill: 2,
      quarry: 0,
      ironMine: 1,
      farm: 0,
      warehouse: 0,
    })
    expect(statements).toHaveLength(1)
  })

  it('reads a fief without waiting on the lock a mutation holds', async () => {
    await anasFiefWithTwoBuildings()

    const read = await drizzle(pool).transaction(async (transaction) => {
      await new DrizzleFiefRepository(transaction, 'lockedForUpdate').fiefOf(ana)
      return new DrizzleFiefRepository(drizzle(pool), 'lockFree').fiefOf(ana)
    })

    expect(read.ok && read.value?.id).toBe(valdehierro)
  })

  it('restores a fief with the levels of its own buildings only', async () => {
    await anasFiefWithTwoBuildings()
    await insertFief(robledal, bruno, 8, 'Robledal')
    await insertLevel(robledal, 'quarry', 3)

    const read = await new DrizzleFiefRepository(drizzle(pool), 'lockFree').fiefOf(ana)

    expect(read.ok && [read.value?.id, read.value?.buildingLevels]).toEqual([
      valdehierro,
      { sawmill: 2, quarry: 0, ironMine: 1, farm: 0, warehouse: 0 },
    ])
  })

  it('refuses to read a busy slot stored without its start instant', async () => {
    await anasFiefWithTwoBuildings()
    await pool.query(
      `UPDATE fiefs SET slot_building = 'sawmill', slot_level = 3, slot_finishes_at = '2026-09-22T09:00:00Z'
       WHERE id = $1`,
      [valdehierro],
    )

    await expect(new DrizzleFiefRepository(drizzle(pool), 'lockFree').fiefOf(ana)).rejects.toThrow(
      'half-written build slot',
    )
  })
})

const accepted = <T>(result: Result<T, DomainError>): T => {
  if (!result.ok) {
    throw new Error(`Fixture refused: ${result.error.kind}`)
  }
  return result.value
}

const anasFoundingOn = (id: string, plot: number): Fief =>
  Fief.found({
    id,
    playerId: ana,
    name: accepted(FiefName.create('Valdehierro')),
    coordinates: accepted(Coordinates.create(1, 4, plot)),
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    at: Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z')),
  })

const foundInItsOwnTransaction = (fief: Fief): Promise<string> =>
  drizzle(pool).transaction(async (transaction) => {
    const saved = await new DrizzleFiefRepository(transaction, 'lockedForUpdate').save(fief)
    return saved.ok ? 'founded' : saved.error.kind
  })

describe('DrizzleFiefRepository writes', () => {
  it('seats one fief when two foundings for one player race', async () => {
    await emptyDatabase()
    await registerPlayers([ana])

    const outcomes = await Promise.all([
      foundInItsOwnTransaction(anasFoundingOn(valdehierro, 7)),
      foundInItsOwnTransaction(anasFoundingOn(robledal, 8)),
    ])

    const held = await pool.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM fiefs WHERE player_id = $1',
      [ana],
    )
    expect([[...outcomes].sort(), held.rows[0]?.count]).toEqual([
      ['PlayerAlreadyHoldsFief', 'founded'],
      1,
    ])
  })
})
