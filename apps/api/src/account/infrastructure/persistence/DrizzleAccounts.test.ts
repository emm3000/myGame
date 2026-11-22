import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import { accountsContract } from './accountsContract.testSupport'
import { DrizzleAccounts } from './DrizzleAccounts'

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

accountsContract('DrizzleAccounts', async () => {
  await pool.query(truncatePlayerTables)
  return new DrizzleAccounts(drizzle(pool))
})
