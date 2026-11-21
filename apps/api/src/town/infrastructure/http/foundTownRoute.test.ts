import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../../app'
import type { ComposedServer } from '../../../composeServer'
import { truncatePlayerTables } from '../../../truncatePlayerTables.testSupport'
import {
  movableClock,
  overviewOf,
  refusalOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
} from './townRoutes.testSupport'

describe('the town route', () => {
  let server: ComposedServer
  let app: TownApp

  beforeAll(() => {
    server = townServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
    app = createApp({ ...server, clock: movableClock() })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const { signUp, foundTown, signUpWithTown } = townRequests(() => app)

  describe('the founding', () => {
    it('founds a town at the lowest free site', async () => {
      await signUpWithTown('ana@example.com')
      const bea = await signUp('bea@example.com')

      const response = await foundTown(bea, { name: 'Cedar Point' })

      expect(response.status).toBe(200)
      expect((await overviewOf(response)).site).toEqual({ region: 1, area: 1, site: 2 })
    })

    it('keeps the town name as written, trimmed', async () => {
      const ana = await signUp('ana@example.com')

      const response = await foundTown(ana, { name: '  McAllen Heights ' })

      expect((await overviewOf(response)).name).toBe('McAllen Heights')
    })

    it('refuses a second town', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await foundTown(ana, { name: 'Cedar Point' })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'PlayerAlreadyHoldsTown' })
    })

    it('refuses a name of spaces as a blank town name', async () => {
      const ana = await signUp('ana@example.com')

      const response = await foundTown(ana, { name: '   ' })

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({ kind: 'BlankTownName' })
    })

    it('answers a malformed body with an empty 400', async () => {
      const ana = await signUp('ana@example.com')

      const response = await foundTown(ana, { title: 'Maple Falls' })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })
  })
})
