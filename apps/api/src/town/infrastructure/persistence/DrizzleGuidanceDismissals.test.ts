import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, assert, beforeAll } from 'vitest'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import { DrizzleGuidanceDismissals } from './DrizzleGuidanceDismissals'
import { DrizzleTownReader } from './DrizzleTownReader'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import { guidanceDismissalsContract } from './guidanceDismissalsContract.testSupport'

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

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  for (const playerId of playerIds) {
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at, report_read_at, scaffold)
       VALUES ($1, $2, 'argon2id-hash', '2026-11-11T08:00:00Z', '2026-11-11T08:00:00Z', 'es')`,
      [playerId, `${playerId}@example.com`],
    )
  }
}

guidanceDismissalsContract('DrizzleGuidanceDismissals', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  const towns = new DrizzleTownRepository(database, 'lockFree')
  return {
    dismissals: new DrizzleGuidanceDismissals(database),
    towns,
    registerPlayers,
    dismissedAtOf: async (playerId) => {
      const read = await new DrizzleTownReader(database).townWithSchoolOf(playerId)
      assert(read.ok)
      return read.value?.guidanceDismissedAt
    },
  }
})
