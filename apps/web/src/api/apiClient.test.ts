import { afterEach, expect, it, vi } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { createApiClient } from './apiClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

const answeringFetch = (status: number, body: unknown) => {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => Response.json(body, { status }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

it('answers a refusal that still carries a message as unexpected', async () => {
  answeringFetch(409, { kind: 'TownNotFound', message: 'No town here.' })

  const outcome = await createApiClient('/api').startBuildingWork('farm')

  expect(outcome).toEqual({ ok: false, refusal: 'Unexpected' })
})

it('answers a refused close as unexpected when the body names no kind', async () => {
  answeringFetch(401, { error: 'unauthorized' })

  expect(await createApiClient('/api').closeReport()).toBe('Unexpected')
})

it('answers a refused close by its kind', async () => {
  answeringFetch(404, { kind: 'TownNotFound' })

  expect(await createApiClient('/api').closeReport()).toBe('TownNotFound')
})

it("reads the due reviews from the player's reviews", async () => {
  const reviews = {
    due: [],
    readFirst: [],
    nextDueAt: '2026-09-22T12:09:00.000Z',
    readAt: '2026-09-22T12:00:00.000Z',
  }
  const fetch = answeringFetch(200, reviews)

  const outcome = await createApiClient('/api').reviews()

  expect(outcome).toEqual({ ok: true, value: reviews })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/reviews')
  expect(init?.method).toBe('GET')
})

it("asks the hint of a word on the player's reviews", async () => {
  const fetch = answeringFetch(200, { firstLetter: 's', letterCount: 6 })

  const outcome = await createApiClient('/api').reviewHint('lesson-1-2')

  expect(outcome).toEqual({ ok: true, value: { firstLetter: 's', letterCount: 6 } })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/reviews/lesson-1-2/hint')
  expect(init?.method).toBe('POST')
})

it("posts the answer to the player's reviews exactly as typed, spaces and case kept", async () => {
  const fetch = answeringFetch(200, { verdict: { kind: 'nearMiss' } })

  const outcome = await createApiClient('/api').answerReview({
    wordId: 'lesson-1-2',
    answer: ' Scool ',
  })

  expect(outcome).toEqual({ ok: true, value: { verdict: { kind: 'nearMiss' } } })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/reviews/lesson-1-2/answer')
  expect(init?.method).toBe('POST')
  expect(init?.body).toBe('{"answer":" Scool "}')
})

it('posts the town name to the town route', async () => {
  const fetch = answeringFetch(200, knownTown)

  const outcome = await createApiClient('/api').foundTown('Cedar Creek')

  expect(outcome).toEqual({ ok: true, value: knownTown })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town')
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual({ name: 'Cedar Creek' })
})

it('posts the place to the building work route of the town', async () => {
  const fetch = answeringFetch(200, knownTown)

  await createApiClient('/api').startBuildingWork('powerStation')

  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/work')
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual({ building: 'powerStation' })
})

it('deletes the stopped work by its place and level', async () => {
  const fetch = answeringFetch(200, knownTown)

  await createApiClient('/api').stopBuildingWork({ building: 'homes', level: 2 })

  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/work/homes/2')
  expect(init?.method).toBe('DELETE')
})

it('posts the hiring order to the town hiring', async () => {
  const fetch = answeringFetch(200, knownTown)

  await createApiClient('/api').placeHiringOrder({ hire: 'truck', count: 3 })

  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/hiring')
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual({ hire: 'truck', count: 3 })
})

it('deletes the stopped hiring order by its kind and start', async () => {
  const fetch = answeringFetch(200, knownTown)

  await createApiClient('/api').stopHiringOrder({
    hire: 'worker',
    startedAt: '2026-11-10T09:00:00.000Z',
  })

  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/hiring/worker/2026-11-10T09%3A00%3A00.000Z')
  expect(init?.method).toBe('DELETE')
})

const areaThree = {
  region: 1,
  area: 3,
  lastArea: 4,
  terrain: 'hills',
  sites: [
    { site: 1, town: null, waste: null },
    { site: 2, town: { name: 'Cedar Creek', isOwn: false }, waste: null },
  ],
}

it("reads the map of the town's own area", async () => {
  const fetch = answeringFetch(200, areaThree)

  const outcome = await createApiClient('/api').regionMap()

  expect(outcome).toEqual({ ok: true, value: areaThree })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/map')
  expect(init?.method).toBe('GET')
})

it('reads the map of an area by its number', async () => {
  const fetch = answeringFetch(200, areaThree)

  await createApiClient('/api').regionMap(3)

  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/map/3')
  expect(init?.method).toBe('GET')
})

it('answers an area past the last one by its refusal', async () => {
  answeringFetch(404, { kind: 'AreaNotFound' })

  const outcome = await createApiClient('/api').regionMap(9)

  expect(outcome).toEqual({
    ok: false,
    refusal: 'AreaNotFound',
    error: { kind: 'AreaNotFound' },
  })
})

it('posts the job to the town jobs', async () => {
  const fetch = answeringFetch(200, knownTown)
  const job = { site: { area: 3, site: 1 }, team: { worker: 2, truck: 1 }, hours: 4 }

  const outcome = await createApiClient('/api').sendJob(job)

  expect(outcome).toEqual({ ok: true, value: knownTown })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/jobs')
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual(job)
})

it('posts the job to the town jobs quote and answers its pay', async () => {
  const quote = { pay: { money: 0, food: 12, power: 0, material: 12 } }
  const fetch = answeringFetch(200, quote)
  const job = { site: { area: 3, site: 1 }, team: { worker: 2, truck: 1 }, hours: 4 }

  const outcome = await createApiClient('/api').quoteJob(job)

  expect(outcome).toEqual({ ok: true, value: quote })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/jobs/quote')
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual(job)
})

it('calls the job back by the instant it was sent', async () => {
  const fetch = answeringFetch(200, knownTown)

  const outcome = await createApiClient('/api').callJobBack({
    sentAt: '2026-11-10T09:00:00.000Z',
  })

  expect(outcome).toEqual({ ok: true, value: knownTown })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/jobs/2026-11-10T09%3A00%3A00.000Z/call-back')
  expect(init?.method).toBe('POST')
})

it('answers a town refusal with its params', async () => {
  answeringFetch(409, { kind: 'WaitingListFull', params: { cap: 2 } })

  const outcome = await createApiClient('/api').startBuildingWork('farm')

  expect(outcome).toEqual({
    ok: false,
    refusal: 'WaitingListFull',
    error: { kind: 'WaitingListFull', params: { cap: 2 } },
  })
})

const reportWithNews = {
  nextDueAt: null,
  dueCount: 0,
  due: [],
  readFirst: [],
  news: [
    {
      kind: 'buildingWorkFinished',
      params: { building: 'homes', level: 2 },
      occurredAt: '2026-11-10T08:50:00.000Z',
    },
  ],
}

it('reads the Report through its schema', async () => {
  const fetch = answeringFetch(200, reportWithNews)

  const outcome = await createApiClient('/api').report()

  expect(outcome).toEqual({ ok: true, value: reportWithNews })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/report')
  expect(init?.method).toBe('GET')
})

it('reads a Report the schema refuses as unexpected', async () => {
  answeringFetch(200, { ...reportWithNews, dueCount: -1 })

  expect(await createApiClient('/api').report()).toEqual({ ok: false, refusal: 'Unexpected' })
})

it("reads the town's news through its schema", async () => {
  const feed = { items: reportWithNews.news }
  const fetch = answeringFetch(200, feed)

  const outcome = await createApiClient('/api').townNews()

  expect(outcome).toEqual({ ok: true, value: feed })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/town/news')
  expect(init?.method).toBe('GET')
})

it('reads a news feed the schema refuses as unexpected', async () => {
  answeringFetch(200, { items: [{ kind: 'townFounded' }] })

  expect(await createApiClient('/api').townNews()).toEqual({ ok: false, refusal: 'Unexpected' })
})

it('reads the news of a player with no town as its refusal', async () => {
  answeringFetch(404, { kind: 'TownNotFound' })

  expect(await createApiClient('/api').townNews()).toMatchObject({
    ok: false,
    refusal: 'TownNotFound',
  })
})

it('posts the close of the Report', async () => {
  const fetch = vi.fn(
    async (_url: string, _init: RequestInit) => new Response(null, { status: 204 }),
  )
  vi.stubGlobal('fetch', fetch)

  expect(await createApiClient('/api').closeReport()).toBeUndefined()
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/report/close')
  expect(init?.method).toBe('POST')
})
