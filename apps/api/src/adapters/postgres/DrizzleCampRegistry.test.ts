import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { campRegistryContract } from '../campRegistryContract'
import { DrizzleCampRegistry } from './DrizzleCampRegistry'

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

campRegistryContract('DrizzleCampRegistry', async () => {
  await pool.query('TRUNCATE camp_battles')
  return { camps: new DrizzleCampRegistry(drizzle(pool)) }
})
