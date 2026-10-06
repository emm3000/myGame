import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll } from 'vitest'
import { digestAcknowledgementsContract } from '../digestAcknowledgementsContract'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleDigestAcknowledgements } from './DrizzleDigestAcknowledgements'

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

digestAcknowledgementsContract('DrizzleDigestAcknowledgements', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  const accounts = new DrizzleAccounts(database)
  return {
    acknowledgements: new DrizzleDigestAcknowledgements(database),
    signUp: async (playerId, at) => {
      await accounts.addPlayer({
        id: playerId,
        email: `${playerId}@example.com`,
        passwordHash: 'argon2id-hash',
        createdAt: at,
      })
    },
  }
})
