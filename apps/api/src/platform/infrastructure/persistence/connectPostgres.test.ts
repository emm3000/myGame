import { once } from 'node:events'
import { connect, createServer, type Server, type Socket } from 'node:net'
import { performance } from 'node:perf_hooks'
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

const slowWakeMilliseconds = 4_000

let silentServer: Server
let slowRelay: Server
const heldSockets = new Set<Socket>()
const relayedSockets = new Set<Socket>()
const pendingWakes = new Set<NodeJS.Timeout>()

const portOf = (server: Server): number => {
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('the server has no TCP port')
  }
  return address.port
}

const relayToDatabaseAfterSlowWake = (client: Socket): void => {
  relayedSockets.add(client)
  const database = new URL(databaseUrl())
  const wake = setTimeout(() => {
    pendingWakes.delete(wake)
    const upstream = connect(Number(database.port), database.hostname)
    relayedSockets.add(upstream)
    client.pipe(upstream)
    upstream.pipe(client)
    client.on('error', () => upstream.destroy())
    upstream.on('error', () => client.destroy())
  }, slowWakeMilliseconds)
  pendingWakes.add(wake)
}

const throughSlowRelay = (url: string): string => {
  const relayed = new URL(url)
  relayed.hostname = '127.0.0.1'
  relayed.port = String(portOf(slowRelay))
  return relayed.toString()
}

beforeAll(async () => {
  silentServer = createServer((socket) => heldSockets.add(socket))
  silentServer.listen(0, '127.0.0.1')
  slowRelay = createServer(relayToDatabaseAfterSlowWake)
  slowRelay.listen(0, '127.0.0.1')
  await Promise.all([once(silentServer, 'listening'), once(slowRelay, 'listening')])
})

afterAll(async () => {
  for (const wake of pendingWakes) {
    clearTimeout(wake)
  }
  for (const socket of [...heldSockets, ...relayedSockets]) {
    socket.destroy()
  }
  silentServer.close()
  slowRelay.close()
  await Promise.all([once(silentServer, 'close'), once(slowRelay, 'close')])
})

describe('connectPostgres', () => {
  it('waits through a database that takes longer than 3 s to answer the connection', {
    timeout: 10_000,
  }, async () => {
    const connection = connectPostgres(throughSlowRelay(databaseUrl()))
    try {
      const answer = await connection.database.execute(sql`SELECT 1 AS answer`)
      expect(answer.rows).toEqual([{ answer: 1 }])
    } finally {
      await connection.close()
    }
  })

  it('gives up on a database that never answers the connection', { timeout: 12_000 }, async () => {
    const connection = connectPostgres(
      `postgres://postgres:mygame@127.0.0.1:${portOf(silentServer)}/silent`,
    )
    const startedAt = performance.now()
    try {
      await expect(connection.database.execute(sql`SELECT 1`)).rejects.toMatchObject({
        cause: { message: 'Connection terminated due to connection timeout' },
      })
      expect(performance.now() - startedAt).toBeGreaterThanOrEqual(8_000)
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
