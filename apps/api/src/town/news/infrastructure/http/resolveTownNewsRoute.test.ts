import { type TownNewsItems, TownNewsItemsSchema } from '@mygame/contracts'
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
} from '../../../infrastructure/http/townRoutes.testSupport'

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

  const { signUp, signUpWithTown, readTown, startWork, stopWork } = townRequests(() => app)

  describe('the news', () => {
    const readNews = (cookie: string): Promise<Response> =>
      Promise.resolve(app.request('/town/news', { headers: { cookie } }))

    const newsOf = async (response: Response): Promise<TownNewsItems> => {
      expect(response.status).toBe(200)
      return TownNewsItemsSchema.parse(await response.json())
    }

    it('answers the news newest first, each with its kind, its params and its instant', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      clock.advanceMinutes(3)
      await readTown(ana)
      await startWork(ana, 'homes')
      clock.advanceMinutes(1)
      await stopWork(ana, 'homes', 2)

      const news = await newsOf(await readNews(ana))

      expect(news.items).toEqual([
        {
          kind: 'buildingWorkStopped',
          params: {
            building: 'homes',
            level: 2,
            refund: { money: 90, food: 60, power: 0, material: 120 },
          },
          occurredAt: '2026-11-05T08:04:00.000Z',
        },
        {
          kind: 'buildingWorkFinished',
          params: { building: 'farm', level: 1 },
          occurredAt: '2026-11-05T08:02:00.000Z',
        },
      ])
    })

    it('tells finished work that no read has applied yet', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await startWork(ana, 'farm')
      clock.advanceMinutes(3)

      const news = await newsOf(await readNews(ana))

      expect(news.items.map(({ kind }) => kind)).toEqual(['buildingWorkFinished'])
    })

    it('refuses a player with no town as TownNotFound', async () => {
      const ana = await signUp('ana@example.com')

      const response = await readNews(ana)

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })
  })
})
