import { afterEach, expect, it, vi } from 'vitest'
import { knownFief, knownTown } from '../auth/stubApiClient.testSupport'
import { createApiClient } from './apiClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

const answeringFetch = (status: number, body: unknown) => {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => Response.json(body, { status }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

it('posts the founding to the founding route of the fief', async () => {
  const fetch = answeringFetch(201, knownFief)

  const outcome = await createApiClient('/api').dispatchFounding(knownFief.id, {
    province: 2,
    plot: 7,
    name: 'Sotoverde del Páramo',
  })

  expect(outcome).toEqual({ ok: true, value: knownFief })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe(`/api/fiefs/${knownFief.id}/marches/found`)
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual({
    province: 2,
    plot: 7,
    name: 'Sotoverde del Páramo',
  })
})

it('posts the transport to the transport route of the fief', async () => {
  const fetch = answeringFetch(201, knownFief)
  const transport = {
    toFiefId: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
    units: { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
    cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  }

  const outcome = await createApiClient('/api').dispatchTransport(knownFief.id, transport)

  expect(outcome).toEqual({ ok: true, value: knownFief })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe(`/api/fiefs/${knownFief.id}/marches/transport`)
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual(transport)
})

it('answers a refusal with the params the server sent', async () => {
  answeringFetch(409, { kind: 'FiefCapReached', params: { cap: 2 } })

  const outcome = await createApiClient('/api').dispatchFounding(knownFief.id, {
    province: 2,
    plot: 7,
    name: 'Sotoverde del Páramo',
  })

  expect(outcome).toEqual({
    ok: false,
    refusal: 'FiefCapReached',
    error: { kind: 'FiefCapReached', params: { cap: 2 } },
  })
})

it('answers a refusal that still carries a message as unexpected', async () => {
  answeringFetch(409, { kind: 'PlotHeld', message: 'Esa parcela ya tiene feudo. Elige una libre.' })

  const outcome = await createApiClient('/api').dispatchFounding(knownFief.id, {
    province: 2,
    plot: 7,
    name: 'Sotoverde del Páramo',
  })

  expect(outcome).toEqual({ ok: false, refusal: 'Unexpected' })
})

const dueDigest = {
  acknowledgedAt: '2026-09-22T08:00:00.000Z',
  isDue: true,
  fiefs: [
    {
      id: knownFief.id,
      name: knownFief.name,
      events: [],
      stores: [{ resource: 'stone', fullSince: '2026-09-22T10:00:00.000Z' }],
    },
  ],
}

it('reads the digest through its schema', async () => {
  const fetch = answeringFetch(200, dueDigest)

  const outcome = await createApiClient('/api').digest()

  expect(outcome).toEqual({ ok: true, value: dueDigest })
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/digest')
  expect(init?.method).toBe('GET')
})

it('reads a digest the schema refuses as unexpected', async () => {
  answeringFetch(200, { ...dueDigest, isDue: 'yes' })

  expect(await createApiClient('/api').digest()).toEqual({ ok: false, refusal: 'Unexpected' })
})

it('posts the acknowledgement of the digest', async () => {
  const fetch = vi.fn(
    async (_url: string, _init: RequestInit) => new Response(null, { status: 204 }),
  )
  vi.stubGlobal('fetch', fetch)

  expect(await createApiClient('/api').acknowledgeDigest()).toBeUndefined()
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/digest/acknowledgement')
  expect(init?.method).toBe('POST')
})

it('posts the dismissal of the guidance to the fief', async () => {
  const fetch = vi.fn(
    async (_url: string, _init: RequestInit) => new Response(null, { status: 204 }),
  )
  vi.stubGlobal('fetch', fetch)

  expect(await createApiClient('/api').dismissGuidance(knownFief.id)).toBeUndefined()
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe(`/api/fiefs/${knownFief.id}/guidance/dismissal`)
  expect(init?.method).toBe('POST')
})

it('posts the hint the player has seen', async () => {
  const fetch = vi.fn(
    async (_url: string, _init: RequestInit) => new Response(null, { status: 204 }),
  )
  vi.stubGlobal('fetch', fetch)

  expect(await createApiClient('/api').markHintSeen('peasants')).toBeUndefined()
  const [url, init] = fetch.mock.calls[0] ?? []
  expect(url).toBe('/api/hints/peasants')
  expect(init?.method).toBe('POST')
})

it('answers a refused hint as unexpected when the body names no kind', async () => {
  answeringFetch(401, { error: 'unauthorized' })

  expect(await createApiClient('/api').markHintSeen('queue')).toBe('Unexpected')
})

it('answers a refused dismissal by its kind', async () => {
  answeringFetch(404, { kind: 'FiefNotFound' })

  expect(await createApiClient('/api').dismissGuidance(knownFief.id)).toBe('FiefNotFound')
})

it("reads the due reviews from the player's reviews", async () => {
  const reviews = {
    due: [],
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
  dueCount: 0,
  due: [],
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
