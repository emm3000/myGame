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
