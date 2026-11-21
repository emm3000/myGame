import {
  CleanUpQuoteSchema,
  JobQuoteSchema,
  RegionMapSchema,
  type SendCleanUp,
} from '@mygame/contracts'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  jsonRequest,
  type MovableClock,
  movableClock,
  overviewOf,
  pausingFirstTransaction,
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

  const { signUp, signUpWithTown, readTown } = townRequests(() => app)

  describe('the jobs', () => {
    const keepWorkers = (count: number): Promise<void> =>
      runSql(`UPDATE town_hires SET count = ${count} WHERE hire = 'worker'`)

    const sendJob = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/jobs', jsonRequest('POST', cookie, body)))

    const quoteJob = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/jobs/quote', jsonRequest('POST', cookie, body)))

    const callJobBack = (cookie: string, sentAt: string): Promise<Response> =>
      Promise.resolve(
        app.request(`/town/jobs/${encodeURIComponent(sentAt)}/call-back`, {
          method: 'POST',
          headers: { cookie },
        }),
      )

    const twoWorkersForTwoHours = (area: number, site: number): unknown => ({
      site: { area, site },
      team: { worker: 2, truck: 0 },
      hours: 2,
    })

    it('sends a job to a free site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(response.status).toBe(200)
      expect((await overviewOf(response)).job).toEqual({
        kind: 'job',
        site: { region: 1, area: 1, site: 3 },
        team: { worker: 2, truck: 0 },
        hours: 2,
        pay: { money: 0, food: 12, power: 0, material: 12 },
        phase: 'outbound',
        sentAt: '2026-11-05T08:00:00.000Z',
        arrivesAt: '2026-11-05T08:02:00.000Z',
        leavesAt: '2026-11-05T10:02:00.000Z',
        returnsAt: '2026-11-05T10:04:00.000Z',
        calledBackAt: null,
      })
    })

    it('keeps the job out for the next read', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      clock.advanceMinutes(5)

      const job = (await overviewOf(await readTown(ana))).job

      expect([job?.site, job?.phase]).toEqual([{ region: 1, area: 1, site: 3 }, 'working'])
    })

    it('credits the pay on the read after the return', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      const materialBefore = (await overviewOf(await readTown(ana))).stocks.material.amount
      clock.advanceMinutes(124)

      const overview = await overviewOf(await readTown(ana))

      expect([overview.job, overview.stocks.material.amount - materialBefore]).toEqual([null, 12])
    })

    it('refuses a job to a held site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await signUpWithTown('bea@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 2))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'SiteHeld' })
    })

    it('refuses a job to the town’s own site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 1))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'JobToOwnSite' })
    })

    it('refuses a job past the last browsable area', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, twoWorkersForTwoHours(3, 1))

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({ kind: 'JobSiteOutOfBounds' })
    })

    it('refuses a team larger than the hires at home with the count at home', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(1)

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughHiresAtHome',
        params: { hire: 'worker', count: 2, atHome: 1 },
      })
    })

    it('refuses a team of no hires', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await sendJob(ana, {
        site: { area: 1, site: 3 },
        team: { worker: 0, truck: 0 },
        hours: 2,
      })

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({ kind: 'InvalidTeam' })
    })

    it('refuses more hours than the content allows with the most allowed', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const response = await sendJob(ana, { ...(twoWorkersForTwoHours(1, 3) as object), hours: 9 })

      expect(response.status).toBe(400)
      expect(await refusalOf(response)).toEqual({
        kind: 'JobHoursOutOfRange',
        params: { hours: 9, maxHours: 8 },
      })
    })

    it('refuses a second team while one is out', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(4)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 4))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'TeamAlreadyOut' })
    })

    it('answers a body of no hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await sendJob(ana, { ...(twoWorkersForTwoHours(1, 3) as object), hours: 0 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('refuses a job for a player with no town as TownNotFound', async () => {
      const ana = await signUp('ana@example.com')

      const response = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(response.status).toBe(404)
      expect(await refusalOf(response)).toEqual({ kind: 'TownNotFound' })
    })

    it('answers the pay a job would bring before it is sent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)

      const quoted = await quoteJob(ana, twoWorkersForTwoHours(1, 3))
      const sent = await sendJob(ana, twoWorkersForTwoHours(1, 3))

      expect(quoted.status).toBe(200)
      const quote = JobQuoteSchema.parse(await quoted.json())
      expect([quote.pay, (await overviewOf(sent)).job?.pay]).toEqual([
        { money: 0, food: 12, power: 0, material: 12 },
        { money: 0, food: 12, power: 0, material: 12 },
      ])
    })

    it('sends no team when it quotes a job', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await quoteJob(ana, twoWorkersForTwoHours(1, 3))

      const overview = await overviewOf(await readTown(ana))

      expect([overview.job, overview.hiring.hires.worker]).toEqual([null, 2])
    })

    it('refuses a quote the send would refuse', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await signUpWithTown('bea@example.com')
      await keepWorkers(2)

      const response = await quoteJob(ana, twoWorkersForTwoHours(1, 2))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'SiteHeld' })
    })

    it('answers a quote of no hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await quoteJob(ana, { ...(twoWorkersForTwoHours(1, 3) as object), hours: 0 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('calls a job back', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      clock.advanceMinutes(62)

      const response = await callJobBack(ana, '2026-11-05T08:00:00.000Z')

      expect(response.status).toBe(200)
      const job = (await overviewOf(response)).job
      expect([job?.pay, job?.phase, job?.calledBackAt, job?.leavesAt, job?.returnsAt]).toEqual([
        { money: 0, food: 6, power: 0, material: 6 },
        'returning',
        '2026-11-05T09:02:00.000Z',
        '2026-11-05T09:02:00.000Z',
        '2026-11-05T09:04:00.000Z',
      ])
    })

    it('refuses a call back naming another job', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))

      const response = await callJobBack(ana, '2026-11-05T07:00:00.000Z')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'JobNotFound' })
    })

    it('refuses a second call back of a returning job', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(2)
      await sendJob(ana, twoWorkersForTwoHours(1, 3))
      clock.advanceMinutes(30)
      await callJobBack(ana, '2026-11-05T08:00:00.000Z')

      const response = await callJobBack(ana, '2026-11-05T08:00:00.000Z')

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'JobAlreadyReturning' })
    })

    it('answers a send that is not an instant with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await callJobBack(ana, 'yesterday')

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent sends', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(4)
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const send = (site: number): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/jobs', jsonRequest('POST', ana, twoWorkersForTwoHours(1, site))),
        )

      const first = send(3)
      await firstHasRead.promise
      const second = send(4).then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([statuses, overview.job?.site.site]).toEqual([[200, 409], 3])
    })
  })

  describe('the clean-ups', () => {
    const keepWorkers = (count: number): Promise<void> =>
      runSql(`UPDATE town_hires SET count = ${count} WHERE hire = 'worker'`)

    const sendCleanUp = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/clean-ups', jsonRequest('POST', cookie, body)))

    const sixWorkersTo = (area: number, site: number): SendCleanUp => ({
      site: { area, site },
      team: { worker: 6, truck: 0 },
    })

    const quoteCleanUp = (cookie: string, body: unknown): Promise<Response> =>
      Promise.resolve(app.request('/town/clean-ups/quote', jsonRequest('POST', cookie, body)))

    it('sends a clean-up to a waste site', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await sendCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(200)
      expect((await overviewOf(response)).job).toEqual({
        kind: 'cleanUp',
        site: { region: 1, area: 1, site: 12 },
        team: { worker: 6, truck: 0 },
        size: 1,
        waste: 6,
        pay: { money: 12, food: 0, power: 0, material: 18 },
        phase: 'outbound',
        sentAt: '2026-11-05T08:00:00.000Z',
        arrivesAt: '2026-11-05T08:11:00.000Z',
        leavesAt: '2026-11-05T08:11:00.000Z',
        returnsAt: '2026-11-05T08:22:00.000Z',
        calledBackAt: null,
      })
    })

    it('reads the site’s waste as 0 on the map once the team arrives', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await sendCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(11)

      const map = RegionMapSchema.parse(
        await (await app.request('/town/map', { headers: { cookie: ana } })).json(),
      )

      expect(map.sites.find(({ site }) => site === 12)?.waste).toEqual({ size: 1, waste: 0 })
    })

    it('refuses a clean-up to a site with no waste', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await sendCleanUp(ana, sixWorkersTo(1, 3))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NotAWasteSite' })
    })

    it('refuses a clean-up to a site whose waste has not grown back yet', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await sendCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(30)

      const response = await sendCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NoWasteYet' })
    })

    it('answers the strength, the waste and the pay a clean-up would bring before it is sent', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const quoted = await quoteCleanUp(ana, sixWorkersTo(1, 12))

      expect(quoted.status).toBe(200)
      expect(CleanUpQuoteSchema.parse(await quoted.json())).toEqual({
        strength: 6,
        waste: 6,
        pay: { money: 12, food: 0, power: 0, material: 18 },
        covers: true,
      })
    })

    it('answers that a team whose strength falls short of the waste does not cover it', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(5)

      const quoted = await quoteCleanUp(ana, {
        site: { area: 1, site: 12 },
        team: { worker: 5, truck: 0 },
      })

      const quote = CleanUpQuoteSchema.parse(await quoted.json())
      expect([quote.strength, quote.waste, quote.covers]).toEqual([5, 6, false])
    })

    it('quotes the waste and the pay the send then fixes', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const quote = CleanUpQuoteSchema.parse(
        await (await quoteCleanUp(ana, sixWorkersTo(1, 12))).json(),
      )
      const job = (await overviewOf(await sendCleanUp(ana, sixWorkersTo(1, 12)))).job

      expect([quote.waste, quote.pay]).toEqual([
        job?.kind === 'cleanUp' ? job.waste : undefined,
        job?.pay,
      ])
    })

    it('sends no team when it quotes a clean-up', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await quoteCleanUp(ana, sixWorkersTo(1, 12))

      const overview = await overviewOf(await readTown(ana))

      expect([overview.job, overview.hiring.hires.worker]).toEqual([null, 6])
    })

    it('leaves the site’s waste as it was when it quotes a clean-up', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)
      await quoteCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(11)

      const map = RegionMapSchema.parse(
        await (await app.request('/town/map', { headers: { cookie: ana } })).json(),
      )

      expect(map.sites.find(({ site }) => site === 12)?.waste).toEqual({ size: 1, waste: 6 })
    })

    it('refuses a quote to a site with no waste', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await quoteCleanUp(ana, sixWorkersTo(1, 3))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NotAWasteSite' })
    })

    it('refuses a quote to a site whose waste has not grown back yet', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(12)
      await sendCleanUp(ana, sixWorkersTo(1, 12))
      clock.advanceMinutes(30)

      const response = await quoteCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({ kind: 'NoWasteYet' })
    })

    it('refuses a quote for a team larger than the hires at home', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(5)

      const response = await quoteCleanUp(ana, sixWorkersTo(1, 12))

      expect(response.status).toBe(409)
      expect(await refusalOf(response)).toEqual({
        kind: 'NotEnoughHiresAtHome',
        params: { hire: 'worker', count: 6, atHome: 5 },
      })
    })

    it('answers a quote given hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')

      const response = await quoteCleanUp(ana, { ...sixWorkersTo(1, 12), hours: 2 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('answers a clean-up given hours with an empty 400', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(6)

      const response = await sendCleanUp(ana, { ...sixWorkersTo(1, 12), hours: 2 })

      expect([response.status, await response.text()]).toEqual([400, ''])
    })

    it('serializes two concurrent sends', async () => {
      const ana = await signUpWithTown('ana@example.com')
      await keepWorkers(12)
      const firstHasRead = signal()
      const secondHasRead = signal()
      const secondIsBlockedOrHasRead = untilPlayerBlockedOrRead(secondHasRead.promise)
      const racingApp = createApp({
        ...server,
        clock,
        inTransaction: pausingFirstTransaction(server.inTransaction, async () => {
          firstHasRead.resolve()
          await secondIsBlockedOrHasRead
        }),
      })
      const send = (site: number): Promise<Response> =>
        Promise.resolve(
          racingApp.request('/town/clean-ups', jsonRequest('POST', ana, sixWorkersTo(1, site))),
        )

      const first = send(12)
      await firstHasRead.promise
      const second = send(9).then((response) => {
        secondHasRead.resolve()
        return response
      })
      const statuses = (await Promise.all([first, second])).map(({ status }) => status)

      const overview = await overviewOf(await readTown(ana))
      expect([statuses, overview.job?.site.site]).toEqual([[200, 409], 12])
    })
  })
})
