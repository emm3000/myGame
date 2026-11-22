import { ok } from '@mygame/domain'
import { sql } from 'drizzle-orm'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Transaction } from '../../application/ports/Transaction'
import { thrownCauseOf } from '../../thrownCauseOf'
import { connectPostgres, type PostgresConnection, type PostgresSession } from './connectPostgres'
import { postgresTransaction } from './postgresTransaction'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const causeOf = (failure: unknown): string =>
  failure instanceof Error ? thrownCauseOf(failure) : typeof failure

let connection: PostgresConnection
let inTransaction: Transaction<PostgresSession>

const credentialsOfNobody = sql`SELECT password_hash FROM players WHERE email = 'nobody@example.com'`

beforeAll(() => {
  connection = connectPostgres(databaseUrl())
  inTransaction = postgresTransaction(connection.database, (transaction) => transaction)
})

afterAll(async () => {
  await connection.close()
})

const credentialsLookup = (): ReturnType<Transaction<PostgresSession>> =>
  inTransaction(async (session) => ok((await session.execute(credentialsOfNobody)).rows[0]))

describe('postgresTransaction', () => {
  it('cancels a statement past the statement timeout, leaving the pool able to answer', async () => {
    const lockHolder = new Client({ connectionString: databaseUrl() })
    await lockHolder.connect()
    try {
      await lockHolder.query('BEGIN')
      await lockHolder.query('LOCK TABLE players IN ACCESS EXCLUSIVE MODE')
      const stuck = await credentialsLookup().then(
        () => 'returned',
        (failure: unknown) => causeOf(failure),
      )
      expect(stuck).toBe('DrizzleQueryError 57014')
    } finally {
      await lockHolder.query('ROLLBACK')
      await lockHolder.end()
    }
    expect(await credentialsLookup()).toEqual(ok(undefined))
  })
})
