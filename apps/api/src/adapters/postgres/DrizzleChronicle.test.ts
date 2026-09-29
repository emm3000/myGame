import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { keptEventsPerFief } from '../../fief/ChronicleReader'
import { chronicleContract } from '../chronicleContract'
import { DrizzleChronicle } from './DrizzleChronicle'

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

const registerFiefs = async (fiefIds: ReadonlyArray<string>): Promise<void> => {
  for (const [index, fiefId] of fiefIds.entries()) {
    const playerId = `00000000-0000-4000-8000-00000000000${index + 1}`
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
    await pool.query(
      `INSERT INTO fiefs (id, player_id, kingdom, province, plot, terrain, name, wood, stone, iron, gold, food, stored_at)
       VALUES ($1, $2, 1, 4, $3, 'lowlands', 'Valdehierro', 500, 500, 200, 50, 300, '2026-09-22T08:00:00Z')`,
      [fiefId, playerId, index + 1],
    )
  }
}

const emptyDatabase = async (): Promise<void> => {
  await pool.query(
    'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, camp_battles',
  )
}

chronicleContract('DrizzleChronicle', async () => {
  await emptyDatabase()
  return { chronicle: new DrizzleChronicle(drizzle(pool)), registerFiefs }
})

describe('DrizzleChronicle reads', () => {
  it('reads only the latest hundred events of a fief that stores more', async () => {
    await emptyDatabase()
    const valdehierro = '00000000-0000-4000-8000-00000000000a'
    await registerFiefs([valdehierro])
    await pool.query(
      `INSERT INTO fief_events (fief_id, kind, building, level, occurred_at)
       SELECT $1, 'upgrade_finished', 'sawmill', minute + 1,
         timestamptz '2026-09-22T08:00:00Z' + minute * interval '1 minute'
       FROM generate_series(0, $2) AS minute`,
      [valdehierro, keptEventsPerFief],
    )

    const events = await new DrizzleChronicle(drizzle(pool)).eventsOf(valdehierro)

    expect([events.length, events.at(-1)]).toEqual([
      keptEventsPerFief,
      expect.objectContaining({ kind: 'upgradeFinished', level: 2 }),
    ])
  })
})
