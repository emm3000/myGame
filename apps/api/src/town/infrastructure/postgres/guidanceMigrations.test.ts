import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeWithoutChanges,
  foreignKeyViolation,
  invalidEnumValue,
  migratedThroughNext,
  openEmptyDatabase,
  uniqueViolation,
} from '../../../platform/infrastructure/postgres/migrationDatabase.testSupport'

const guidanceOwnerId = '00000000-0000-4000-8000-0000000000a5'

const guidanceTownId = '00000000-0000-4000-8000-0000000000b5'

const migrationsBeforeTheGuidance = 39

const insertSeenTip = async (client: Client, playerId: string, tip: string): Promise<void> => {
  await client.query('INSERT INTO player_seen_tips (player_id, tip) VALUES ($1, $2)', [
    playerId,
    tip,
  ])
}

describe('the goals and tips migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheGuidance, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'mayor@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-11-10T08:00:00Z')`,
        [guidanceOwnerId],
      )
      await client.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-10T08:00:00Z')`,
        [guidanceOwnerId, guidanceTownId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a town stored before the migration with its guidance not dismissed', async () => {
    const stored = await client.query(
      'SELECT name, guidance_dismissed_at FROM towns WHERE id = $1',
      [guidanceTownId],
    )

    expect(stored.rows).toEqual([{ name: 'Maple Falls', guidance_dismissed_at: null }])
  })

  it('stores a tip a player has seen', async () => {
    await insertSeenTip(client, guidanceOwnerId, 'waiting_list')

    const stored = await client.query('SELECT tip FROM player_seen_tips WHERE player_id = $1', [
      guidanceOwnerId,
    ])

    expect(stored.rows).toEqual([{ tip: 'waiting_list' }])
  })

  it('refuses a tip seen twice by one player', async () => {
    await insertSeenTip(client, guidanceOwnerId, 'people')

    await expect(insertSeenTip(client, guidanceOwnerId, 'people')).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'player_seen_tips_pkey',
    })
  })

  it('refuses a tip the town does not know', async () => {
    await expect(insertSeenTip(client, guidanceOwnerId, 'peasants')).rejects.toMatchObject({
      code: invalidEnumValue,
    })
  })

  it('refuses a tip seen by an unknown player', async () => {
    await expect(
      insertSeenTip(client, '00000000-0000-4000-8000-0000000000ff', 'people'),
    ).rejects.toMatchObject({ code: foreignKeyViolation })
  })

  it("drops a player's seen tips with the player", async () => {
    await insertSeenTip(client, guidanceOwnerId, 'office')

    await client.query('DELETE FROM players WHERE id = $1', [guidanceOwnerId])

    const stored = await client.query('SELECT tip FROM player_seen_tips')
    expect(stored.rows).toEqual([])
  })
})
