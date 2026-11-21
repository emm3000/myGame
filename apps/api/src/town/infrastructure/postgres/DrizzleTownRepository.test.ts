import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { players } from '../../../account/infrastructure/postgres/accountTables'
import { truncatePlayerTables } from '../../../truncatePlayerTables.testSupport'
import { townRepositoryContract } from '../memory/townRepositoryContract.testSupport'
import { DrizzleEarnedSkills } from './DrizzleEarnedSkills'
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
        createdAt: new Date('2026-11-04T08:00:00Z'),
        digestAcknowledgedAt: new Date('2026-11-04T08:00:00Z'),
        reportReadAt: new Date('2026-11-04T08:00:00Z'),
        scaffold: 'es' as const,
      })),
    )
}

const truncateAll = async (): Promise<void> => {
  await pool.query(truncatePlayerTables)
}

townRepositoryContract('DrizzleTownRepository', async () => {
  await truncateAll()
  return {
    towns: new DrizzleTownRepository(drizzle(pool), 'lockFree'),
    skills: new DrizzleEarnedSkills(drizzle(pool)),
    registerPlayers,
  }
})
