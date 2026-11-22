import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  amountsOf,
  fillStocks,
  jsonRequest,
  type MovableClock,
  movableClock,
  overviewOf,
  pausingFirstUnitOfWork,
  refusalOf,
  runSql,
  signal,
  type TownApp,
  townRequests,
  townServer,
  untilPlayerBlockedOrRead,
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

  const { signUpWithTown, readTown } = townRequests(() => app)

  describe('the hiring', () => {
    const buildOffice = (level: number): Promise<void> =>
      runSql(`UPDATE town_buildings SET level = ${level} WHERE building = 'office'`)

    const placeHiring = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/hiring', jsonRequest('POST', cookie, body)))

    const stopHiring = (cookie: string, hire: string, startedAt: string): Promise<Response> =>
      Promise.resolve(
        app.request(`/town/hiring/${hire}/${encodeURIComponent(startedAt)}`, {
          method: 'DELETE',
          headers: { cookie },
        }),
      )

    it('places a hiring order and charges it', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const response = await placeHiring(ana, { hire: 'worker', count: 3 })

      expect(response.status).toBe(200)
      const overview = await overviewOf(response)
      expect([amountsOf(overview), overview.hiring.order, overview.hiring.hires]).toEqual([
        { money: 280, food: 300, power: 200, material: 500 },
        {
          hire: 'worker',
          count: 3,
          delivered: 0,
          secondsPerHire: 45,
          startedAt: '2026-11-05T08:00:00.000Z',
          endsAt: '2026-11-05T08:02:15.000Z',
        },
        { worker: 0, truck: 0 },
      ])
    })

    it('delivers each hire on the read after its time', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })
      clock.advanceMinutes(2)

      const overview = await overviewOf(await readTown(ana))

      expect([overview.hiring.order?.delivered, overview.hiring.hires]).toEqual([
        2,
        { worker: 2, truck: 0 },
      ])
    })

    it('closes the order at its last delivery', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })
      clock.advanceMinutes(3)

      const overview = await overviewOf(await readTown(ana))

      expect([overview.hiring.order, overview.hiring.hires]).toEqual([
        null,
        { worker: 3, truck: 0 },
      ])
    })

    it('answers each kind’s terms at the built office level and the spring hire percent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const overview = await overviewOf(await readTown(ana))

      expect(overview.hiring.terms).toEqual({
        worker: {
          cost: { money: 40, food: 0, power: 0, material: 0 },
          secondsPerHire: 45,
          people: 1,
          requiredOfficeLevel: 1,
        },
        truck: {
          cost: { money: 80, food: 40, power: 40, material: 60 },
          secondsPerHire: 135,
          people: 1,
          requiredOfficeLevel: 3,
        },
      })
    })

    it('refuses a second order while one is open', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 1 })

      const response = await placeHiring(ana, { hire: 'worker', count: 1 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'HiringSlotBusy',
        params: { hire: 'worker' },
      })
    })

    it('refuses trucks below office level 3', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(2)

      const response = await placeHiring(ana, { hire: 'truck', count: 1 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'OfficeTooLow',
        params: { hire: 'truck', requiredOfficeLevel: 3, officeLevel: 2 },
      })
    })

    it('refuses an order the free people cannot staff', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      const { people } = await overviewOf(await readTown(ana))
      await fillStocks()

      const response = await placeHiring(ana, { hire: 'worker', count: people.free + 1 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughPeople',
        params: { requiredPeople: people.free + 1, freePeople: people.free },
      })
    })

    it('refuses an order the stocks cannot pay with what they miss', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await runSql('UPDATE towns SET money = 50')

      const response = await placeHiring(ana, { hire: 'worker', count: 2 })

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughResources',
        params: { missing: { money: 30, food: 0, power: 0, material: 0 } },
      })
    })

    it('answers a count that is not a whole count from 1 with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const response = await placeHiring(ana, { hire: 'worker', count: 0 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('answers a hire the office lacks with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)

      const response = await placeHiring(ana, { hire: 'van', count: 1 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('stops an order keeping the delivered', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })
      clock.advanceMinutes(1)

      const response = await stopHiring(ana, 'worker', '2026-11-05T08:00:00.000Z')

      expect(response.status).toBe(200)
      const overview = await overviewOf(response)
      expect([amountsOf(overview), overview.hiring.order, overview.hiring.hires]).toEqual([
        { money: 360, food: 300, power: 200, material: 500 },
        null,
        { worker: 1, truck: 0 },
      ])
    })

    it('refuses a stop naming another order', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      await placeHiring(ana, { hire: 'worker', count: 3 })

      const response = await stopHiring(ana, 'worker', '2026-11-05T07:59:00.000Z')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'HiringOrderNotFound',
        params: { hire: 'worker', startedAt: '2026-11-05T07:59:00.000Z' },
      })
    })

    it('answers a start that is not an instant with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await stopHiring(ana, 'worker', 'yesterday')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent orders', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await buildOffice(1)
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        unitOfWork: pausingFirstUnitOfWork(server.unitOfWork, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const place = (): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/hiring', jsonRequest('POST', ana, { hire: 'worker', count: 2 })),
        )

      const first = place()
      await firstHasRead.promise
      const second = place().then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([statuses, overview.hiring.order?.count, overview.stocks.money.amount]).toEqual([
        [200, 409],
        2,
        320,
      ])
    })
  })
})
