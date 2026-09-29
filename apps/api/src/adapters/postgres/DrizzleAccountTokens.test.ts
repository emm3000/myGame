import { Instant, type PlayerId } from '@mygame/domain'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AccountToken } from '../../auth/AccountTokens'
import { tokenDigest } from '../../auth/tokenDigest'
import { accountTokensContract } from '../accountTokensContract'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleAccountTokens } from './DrizzleAccountTokens'

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
    'TRUNCATE players, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders',
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

const playerLockQuery = 'select "id" from "players" %for no key update'
const tokenDeleteQuery = 'delete from "account_tokens" %'

const isLockWaiting = async (queries: ReadonlyArray<string>): Promise<boolean> => {
  const probe = await pool.query<{ waiting: boolean }>(
    `SELECT pg_sleep(0.01), EXISTS (
       SELECT 1 FROM pg_stat_activity
       WHERE datname = current_database()
         AND pid <> pg_backend_pid()
         AND wait_event_type = 'Lock'
         AND query ILIKE ANY($1::text[])
     ) AS waiting`,
    [queries],
  )
  return probe.rows[0]?.waiting === true
}

const untilWaitingOrDone = async (
  work: Promise<void>,
  queries: ReadonlyArray<string>,
  failure: string,
): Promise<void> => {
  let isDone = false
  void work.then(() => {
    isDone = true
  })
  for (let probes = 0; probes < probeLimit; probes += 1) {
    if (isDone || (await isLockWaiting(queries))) {
      return
    }
  }
  throw new Error(failure)
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
  await untilWaitingOrDone(
    secondIssue,
    [playerLockQuery],
    'The second issue neither waited on the player lock nor finished',
  )
  firstMayCommit.resolve()
  await Promise.all([firstIssue, secondIssue])
}

const verifyWhileIssuing = async (
  redeemed: string,
  issued: AccountToken,
  now: Instant,
): Promise<PlayerId | undefined> => {
  const database = drizzle(pool)
  const hasRedeemed = signal()
  const mayVerify = signal()
  const verify = database.transaction(async (transaction) => {
    const playerId = await new DrizzleAccountTokens(transaction).redeem(redeemed, 'verify', now)
    hasRedeemed.resolve()
    await mayVerify.promise
    if (playerId !== undefined) {
      await new DrizzleAccounts(transaction).markEmailVerified(playerId, now)
    }
    return playerId
  })
  await hasRedeemed.promise
  const issue = new DrizzleAccountTokens(database).issue(issued, now)
  await untilWaitingOrDone(
    issue,
    [playerLockQuery, tokenDeleteQuery],
    'The issue neither waited on a lock nor finished',
  )
  mayVerify.resolve()
  const [verifiedPlayer] = await Promise.all([verify, issue])
  return verifiedPlayer
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
    [tokenDigest(token), playerId, kind, expiresAt, usedAt],
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
      [tokenDigest('fresh-reset'), tokenDigest('brunos-expired-reset')].sort(),
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

  it('lets a redeem and an issue of the same kind race without a deadlock', async () => {
    await emptyDatabase()
    await registerPlayers([ana])
    await storeToken('first-verify', ana, 'verify', '2026-09-29T08:00:00Z', null)

    const verifiedPlayer = await verifyWhileIssuing(
      'first-verify',
      {
        token: 'resent-verify',
        playerId: ana,
        kind: 'verify',
        expiresAt: Instant.fromEpochMilliseconds(Date.parse('2026-09-29T08:00:00Z')),
      },
      dawn,
    )

    expect(verifiedPlayer).toBe(ana)
    expect(await storedDigests()).toEqual([tokenDigest('resent-verify')])
  })
})
