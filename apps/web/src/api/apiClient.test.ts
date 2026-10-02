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
