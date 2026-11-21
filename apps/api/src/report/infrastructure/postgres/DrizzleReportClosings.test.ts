import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { DrizzleAccounts } from '#account/infrastructure/postgres/DrizzleAccounts'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import { reportClosingsContract } from '../memory/reportClosingsContract.testSupport'
import { DrizzleReportClosings } from './DrizzleReportClosings'

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

reportClosingsContract('DrizzleReportClosings', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  const accounts = new DrizzleAccounts(database)
  return {
    closings: new DrizzleReportClosings(database),
    signUp: async (playerId, at) => {
      await accounts.addPlayer({
        id: playerId,
        email: `${playerId}@example.com`,
        passwordHash: 'argon2id-hash',
        createdAt: at,
        scaffold: 'es',
      })
    },
  }
})
