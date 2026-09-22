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
  await pool.query('TRUNCATE players, sessions, fiefs, fief_buildings')
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
  return { fiefs: new DrizzleFiefRepository(drizzle(pool)), registerPlayers }
})

describe('DrizzleFiefRepository reads', () => {
  it('reads a fief in a single round trip', async () => {
    await emptyDatabase()
    const ana = '00000000-0000-4000-8000-000000000001'
    await registerPlayers([ana])
    await pool.query(
      `INSERT INTO fiefs (id, player_id, kingdom, province, plot, terrain, name, wood, stone, iron, gold, food, stored_at)
       VALUES ('00000000-0000-4000-8000-00000000000a', $1, 1, 4, 7, 'lowlands', 'Valdehierro', 500, 500, 200, 50, 300, '2026-09-22T08:00:00Z')`,
      [ana],
    )
    await pool.query(
      `INSERT INTO fief_buildings (fief_id, building, level)
       VALUES ('00000000-0000-4000-8000-00000000000a', 'sawmill', 2), ('00000000-0000-4000-8000-00000000000a', 'iron_mine', 1)`,
    )
    const statements: Array<string> = []
    const countingDatabase = drizzle(pool, {
      logger: { logQuery: (statement) => statements.push(statement) },
    })

    const read = await new DrizzleFiefRepository(countingDatabase).fiefOf(ana)

    expect(read.ok && read.value?.buildingLevels).toEqual({
      sawmill: 2,
      quarry: 0,
      ironMine: 1,
      farm: 0,
      warehouse: 0,
    })
    expect(statements).toHaveLength(1)
  })
})
