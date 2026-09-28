import { fileURLToPath } from 'node:url'
import { ApiErrorSchema, ProvinceMapSchema } from '@mygame/contracts'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const plotsPerProvince = 15

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

describe('the map route', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ API_PORT: '3195', DATABASE_URL: databaseUrl() }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, sessions, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events',
    )
    app = createApp(server)
  })

  const signUp = async (email: string, fiefName: string): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana', fiefName }),
    })
    expect(response.status).toBe(201)
    return sessionCookieOf(response)
  }

  const mapOf = async (cookie: string, path = '/map'): Promise<Response> =>
    app.request(path, { headers: { cookie } })

  it('opens the province of the signed-in fief', async () => {
    const cookie = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(cookie)

    expect(response.status).toBe(200)
    const map = ProvinceMapSchema.parse(await response.json())
    expect({
      kingdom: map.kingdom,
      province: map.province,
      lastProvince: map.lastProvince,
    }).toEqual({ kingdom: 1, province: 1, lastProvince: 2 })
    expect(map.plots[0]).toEqual({ plot: 1, fief: { name: 'Valdehierro', isOwn: true } })
  })

  it('marks only the signed-in fief as own', async () => {
    await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await mapOf(bruno, '/map/1')

    const map = ProvinceMapSchema.parse(await response.json())
    expect(map.plots.slice(0, 3)).toEqual([
      { plot: 1, fief: { name: 'Valdehierro', isOwn: false } },
      { plot: 2, fief: { name: 'Robledal', isOwn: true } },
      { plot: 3, fief: null },
    ])
  })

  it('answers every plot of the province with its terrain', async () => {
    const cookie = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(cookie)

    const map = ProvinceMapSchema.parse(await response.json())
    expect(map.terrain).toBe('lowlands')
    expect(map.plots.map(({ plot }) => plot)).toEqual(
      Array.from({ length: plotsPerProvince }, (_, index) => index + 1),
    )
  })

  it('answers the province past the last held one with every plot free', async () => {
    const cookie = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(cookie, '/map/2')

    expect(response.status).toBe(200)
    const map = ProvinceMapSchema.parse(await response.json())
    expect({ province: map.province, terrain: map.terrain }).toEqual({
      province: 2,
      terrain: 'uplands',
    })
    expect(map.plots).toHaveLength(plotsPerProvince)
    expect(map.plots.every(({ fief }) => fief === null)).toBe(true)
  })

  it('answers 404 for a province beyond the map', async () => {
    const cookie = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(cookie, '/map/3')

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json())).toEqual({
      kind: 'ProvinceNotFound',
      message: 'Esa provincia no está en el mapa. Vuelve a la tuya.',
    })
  })

  it('answers 400 for a province that is not a number', async () => {
    const cookie = await signUp('ana@example.com', 'Valdehierro')

    const responses = await Promise.all(
      ['/map/tres', '/map/0', '/map/1.5'].map((path) => mapOf(cookie, path)),
    )

    expect(responses.map(({ status }) => status)).toEqual([400, 400, 400])
  })

  it('answers 404 with FiefNotFound when the player holds no fief', async () => {
    const cookie = await signUp('ana@example.com', 'Valdehierro')
    await runSql('TRUNCATE fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events')

    const response = await mapOf(cookie)

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
  })

  it('answers 401 without a session', async () => {
    const responses = await Promise.all(['/map', '/map/1'].map((path) => app.request(path)))

    expect(responses.map(({ status }) => status)).toEqual([401, 401])
  })
})
