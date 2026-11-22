import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, assert, beforeAll } from 'vitest'
import { players } from '#account/infrastructure/postgres/accountTables'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import { regionMapReaderContract } from '../memory/regionMapReaderContract.testSupport'
import { DrizzleRegionMapReader } from './DrizzleRegionMapReader'
import { DrizzleTownRepository } from './DrizzleTownRepository'

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
  await pool.query(truncatePlayerTables)
}

regionMapReaderContract('DrizzleRegionMapReader', async (heldTowns) => {
  await emptyDatabase()
  const database = drizzle(pool)
  const townRepository = new DrizzleTownRepository(database, 'lockFree')
  for (const town of heldTowns) {
    await database.insert(players).values({
      id: town.playerId,
      email: `${town.playerId}@example.com`,
      passwordHash: 'argon2id-hash',
      createdAt: new Date('2026-11-10T08:00:00Z'),
      reportReadAt: new Date('2026-11-10T08:00:00Z'),
      scaffold: 'es',
    })
    assert((await townRepository.save(town)).ok)
  }
  return new DrizzleRegionMapReader(database)
})
