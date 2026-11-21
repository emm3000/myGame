import { once } from 'node:events'
import { createServer, type Server, type Socket } from 'node:net'
import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { connectPostgres } from './connectPostgres'

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
})
