import { err, ok, type Result, thrownCauseOf, type UnitOfWork } from '@mygame/domain'
import { type SQL, sql } from 'drizzle-orm'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { connectPostgres, type PostgresConnection, type PostgresSession } from './connectPostgres'
import { DrizzleUnitOfWork } from './DrizzleUnitOfWork'

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
let unitOfWork: UnitOfWork<PostgresSession>

const credentialsOfNobody = sql`SELECT password_hash FROM players WHERE email = 'nobody@example.com'`
const createProbeTable = (name: string): SQL =>
  sql`CREATE TABLE ${sql.identifier(name)} (id integer)`

beforeAll(() => {
  connection = connectPostgres(databaseUrl())
  unitOfWork = new DrizzleUnitOfWork(connection.database, (transaction) => transaction)
})

afterAll(async () => {
  await connection.close()
})

const credentialsLookup = (): Promise<Result<unknown, never>> =>
  unitOfWork.transact(async (session) => ok((await session.execute(credentialsOfNobody)).rows[0]))

const probeTableOutside = async (name: string): Promise<unknown> =>
  (await connection.database.execute(sql`SELECT to_regclass(${name}) AS probe`)).rows[0]?.probe

describe('DrizzleUnitOfWork', () => {
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

  it('keeps nothing a refused work wrote', async () => {
    const refused = await unitOfWork.transact(async (session) => {
      await session.execute(createProbeTable('refused_work_probe'))
      return err({ kind: 'MalformedRequest' })
    })

    expect([refused, await probeTableOutside('refused_work_probe')]).toEqual([
      err({ kind: 'MalformedRequest' }),
      null,
    ])
  })

  it('keeps nothing a work that threw wrote', async () => {
    const thrown = await unitOfWork
      .transact(async (session) => {
        await session.execute(createProbeTable('thrown_work_probe'))
        throw new RangeError('work failed')
      })
      .then(
        () => 'returned',
        (failure: unknown) => causeOf(failure),
      )

    expect([thrown, await probeTableOutside('thrown_work_probe')]).toEqual(['RangeError', null])
  })
})
