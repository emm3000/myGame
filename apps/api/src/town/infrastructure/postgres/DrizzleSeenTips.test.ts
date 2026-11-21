import { Instant, Town, TownAddress, TownName } from '@mygame/domain'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, assert, beforeAll } from 'vitest'
import { truncatePlayerTables } from '../../../truncatePlayerTables.testSupport'
import { seenTipsContract } from '../memory/seenTipsContract.testSupport'
import { DrizzleSeenTips } from './DrizzleSeenTips'
import { DrizzleTownReader } from './DrizzleTownReader'
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

const townOf = (playerId: string, site: number): Town => {
  const address = TownAddress.create(1, 1, site)
  const name = TownName.create(`Maple ${site}`)
  assert(address.ok && name.ok)
  return Town.found({
    id: `10000000-0000-4000-8000-00000000000${site}`,
    playerId,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: Instant.fromEpochMilliseconds(Date.parse('2026-11-11T08:00:00Z')),
  })
}

seenTipsContract('DrizzleSeenTips', async () => {
  await emptyDatabase()
  const database = drizzle(pool)
  const towns = new DrizzleTownRepository(database, 'lockFree')
  return {
    seenTips: new DrizzleSeenTips(database),
    registerMayors: async (playerIds) => {
      for (const [index, playerId] of playerIds.entries()) {
        await pool.query(
          `INSERT INTO players (id, email, password_hash, created_at, report_read_at, scaffold)
           VALUES ($1, $2, 'argon2id-hash', '2026-11-11T08:00:00Z', '2026-11-11T08:00:00Z', 'es')`,
          [playerId, `${playerId}@example.com`],
        )
        assert((await towns.save(townOf(playerId, index + 1))).ok)
      }
    },
    seenTipsOf: async (playerId) => {
      const read = await new DrizzleTownReader(database).townWithSchoolOf(playerId)
      assert(read.ok && read.value !== undefined)
      return read.value.seenTips
    },
  }
})
