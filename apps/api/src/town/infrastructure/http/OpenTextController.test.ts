import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  type MovableClock,
  movableClock,
  refusalOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
} from './townRoutes.testSupport'

describe('the town route', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: TownApp

  beforeAll(() => {
    server = townServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const { signUp } = townRequests(() => app)

  describe('the texts', () => {
    const readText = (cookie: string, textId: string): Promise<Response> =>
      Promise.resolve(app.request(`/town/texts/${textId}`, { headers: { cookie } }))

    it('refuses a text to a player with no town', async () => {
      const cookie = await signUp('ana@example.com')

      const response = await readText(cookie, 'text-1')

      expect([response.status, await refusalOf(response)]).toMatchObject([
        404,
        { kind: 'TownNotFound' },
      ])
    })
  })
})
