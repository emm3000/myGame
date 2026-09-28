import { Instant } from '@mygame/domain'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AccountToken } from '../../auth/AccountTokens'
import { accountTokensContract } from '../accountTokensContract'
import { DrizzleAccountTokens } from './DrizzleAccountTokens'
import { sessionTokenDigest } from './sessionTokenDigest'

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
    'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events',
  )
}

const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
  for (const playerId of playerIds) {
    await pool.query(
      `INSERT INTO players (id, email, password_hash, created_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-09-28T08:00:00Z')`,
      [playerId, `${playerId}@example.com`],
    )
  }
}

const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const probeLimit = 500

const isPlayerLockWaiting = async (): Promise<boolean> => {
  const probe = await pool.query<{ waiting: boolean }>(
    `SELECT pg_sleep(0.01), EXISTS (
       SELECT 1 FROM pg_stat_activity
       WHERE datname = current_database()
         AND pid <> pg_backend_pid()
         AND wait_event_type = 'Lock'
         AND query ILIKE 'select "id" from "players" %for update'
     ) AS waiting`,
  )
  return probe.rows[0]?.waiting === true
}

const untilBlockedOrIssued = async (issue: Promise<void>): Promise<void> => {
  let hasIssued = false
  void issue.then(() => {
    hasIssued = true
  })
  for (let probes = 0; probes < probeLimit; probes += 1) {
    if (hasIssued || (await isPlayerLockWaiting())) {
      return
    }
  }
  throw new Error('The second issue neither waited on the player lock nor finished')
}

const issueTogether = async (
  first: AccountToken,
  second: AccountToken,
  now: Instant,
): Promise<void> => {
  const database = drizzle(pool)
  const firstHasIssued = signal()
  const firstMayCommit = signal()
  const firstIssue = database.transaction(async (transaction) => {
    await new DrizzleAccountTokens(transaction).issue(first, now)
    firstHasIssued.resolve()
    await firstMayCommit.promise
  })
  await firstHasIssued.promise
  const secondIssue = new DrizzleAccountTokens(database).issue(second, now)
  await untilBlockedOrIssued(secondIssue)
  firstMayCommit.resolve()
  await Promise.all([firstIssue, secondIssue])
}

accountTokensContract('DrizzleAccountTokens', async () => {
  await emptyDatabase()
  return { accountTokens: new DrizzleAccountTokens(drizzle(pool)), registerPlayers, issueTogether }
})

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const dawn = Instant.fromEpochMilliseconds(Date.parse('2026-09-28T08:00:00Z'))

const storeToken = async (
  token: string,
  playerId: string,
  kind: 'reset' | 'verify',
  expiresAt: string,
  usedAt: string | null,
): Promise<void> => {
  await pool.query(
    `INSERT INTO account_tokens (token_digest, player_id, kind, expires_at, used_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionTokenDigest(token), playerId, kind, expiresAt, usedAt],
  )
}

const storedDigests = async (): Promise<ReadonlyArray<string>> => {
  const read = await pool.query<{ digest: string }>(
    'SELECT token_digest AS digest FROM account_tokens ORDER BY token_digest',
  )
  return read.rows.map((row) => row.digest)
}

describe('DrizzleAccountTokens stores', () => {
  it('deletes the used and expired tokens of the player when it issues one', async () => {
    await emptyDatabase()
    await registerPlayers([ana, bruno])
    await storeToken('used-verify', ana, 'verify', '2026-09-29T07:00:00Z', '2026-09-28T07:30:00Z')
    await storeToken('expired-verify', ana, 'verify', '2026-09-28T07:00:00Z', null)
    await storeToken('brunos-expired-reset', bruno, 'reset', '2026-09-28T07:00:00Z', null)

    await new DrizzleAccountTokens(drizzle(pool)).issue(
      {
        token: 'fresh-reset',
        playerId: ana,
        kind: 'reset',
        expiresAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-28T09:00:00Z')),
      },
      dawn,
    )

    expect(await storedDigests()).toEqual(
      [sessionTokenDigest('fresh-reset'), sessionTokenDigest('brunos-expired-reset')].sort(),
    )
  })

  it('answers one player to two racing redeems of one token', async () => {
    await emptyDatabase()
    await registerPlayers([ana])
    await storeToken('racing-reset', ana, 'reset', '2026-09-28T09:00:00Z', null)

    const redeemed = await Promise.all([
      new DrizzleAccountTokens(drizzle(pool)).redeem('racing-reset', 'reset', dawn),
      new DrizzleAccountTokens(drizzle(pool)).redeem('racing-reset', 'reset', dawn),
    ])

    expect(redeemed.filter((playerId) => playerId === ana)).toHaveLength(1)
  })
})
