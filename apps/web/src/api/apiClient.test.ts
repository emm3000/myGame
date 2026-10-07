import { afterEach, expect, it, vi } from 'vitest'
import { knownFief } from '../auth/stubApiClient.testSupport'
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

it('answers a refusal with the line the server wrote', async () => {
  answeringFetch(409, {
    kind: 'FiefCapReached',
    message: 'Solo puedes tener 2 feudos. Deja al colono en casa.',
  })

  const outcome = await createApiClient('/api').dispatchFounding(knownFief.id, {
    province: 2,
    plot: 7,
    name: 'Sotoverde del Páramo',
  })

  expect(outcome).toEqual({
    ok: false,
    refusal: 'FiefCapReached',
    message: 'Solo puedes tener 2 feudos. Deja al colono en casa.',
  })
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
  answeringFetch(404, { kind: 'FiefNotFound', message: 'No encontramos tus tierras.' })

  expect(await createApiClient('/api').dismissGuidance(knownFief.id)).toBe('FiefNotFound')
})
