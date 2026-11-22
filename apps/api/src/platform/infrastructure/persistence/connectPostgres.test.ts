import { once } from 'node:events'
import { createServer, type Server, type Socket } from 'node:net'
import { thrownCauseOf } from '@mygame/domain'
import { sql } from 'drizzle-orm'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { connectPostgres } from './connectPostgres'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const causeOf = (failure: unknown): string =>
  failure instanceof Error ? thrownCauseOf(failure) : typeof failure

let silentServer: Server
const heldSockets = new Set<Socket>()

const portOf = (server: Server): number => {
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('the silent server has no TCP port')
  }
  return address.port
}

beforeAll(async () => {
  silentServer = createServer((socket) => heldSockets.add(socket))
  silentServer.listen(0, '127.0.0.1')
  await once(silentServer, 'listening')
})

afterAll(async () => {
  for (const socket of heldSockets) {
    socket.destroy()
  }
  silentServer.close()
  await once(silentServer, 'close')
})

describe('connectPostgres', () => {
  it('gives up on a database that never answers the connection', async () => {
    const connection = connectPostgres(
      `postgres://postgres:mygame@127.0.0.1:${portOf(silentServer)}/silent`,
    )
    try {
      await expect(connection.database.execute(sql`SELECT 1`)).rejects.toMatchObject({
        cause: { message: 'Connection terminated due to connection timeout' },
      })
    } finally {
      await connection.close()
    }
  })

  it('cancels a plain-pool statement past the statement timeout, leaving the pool able to answer', async () => {
    const connection = connectPostgres(databaseUrl())
    const lockHolder = new Client({ connectionString: databaseUrl() })
    await lockHolder.connect()
    try {
      await lockHolder.query('BEGIN')
      await lockHolder.query('LOCK TABLE sessions IN ACCESS EXCLUSIVE MODE')
      const stuck = await connection.database.execute(sql`SELECT count(*) FROM sessions`).then(
        () => 'returned',
        (failure: unknown) => causeOf(failure),
      )
      expect(stuck).toBe('DrizzleQueryError 57014')
    } finally {
      await lockHolder.query('ROLLBACK')
      await lockHolder.end()
    }
    try {
      const answer = await connection.database.execute(sql`SELECT 1 AS answer`)
      expect(answer.rows).toEqual([{ answer: 1 }])
    } finally {
      await connection.close()
    }
  })
})
