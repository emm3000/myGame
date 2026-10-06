import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { guidanceDismissalsContract } from '../guidanceDismissalsContract'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'
import { DrizzleGuidanceDismissals } from './DrizzleGuidanceDismissals'
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
    'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
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
        digestAcknowledgedAt: new Date('2026-09-22T08:00:00Z'),
      })),
    )
}

guidanceDismissalsContract('DrizzleGuidanceDismissals', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  return {
    dismissals: new DrizzleGuidanceDismissals(database),
    fiefs: new DrizzleFiefRepository(database, 'lockFree'),
    registerPlayers,
  }
})
