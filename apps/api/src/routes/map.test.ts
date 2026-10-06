import { fileURLToPath } from 'node:url'
import {
  ApiErrorSchema,
  FiefListSchema,
  type ProvinceMap,
  ProvinceMapSchema,
} from '@mygame/contracts'
import { type Clock, type FiefId, Instant, ok } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const plotsPerProvince = 15

const millisecondsPerMinute = 60_000

const signedUpAt = Date.parse('2026-09-22T08:00:00Z')

type MovableClock = Clock & { readonly advanceMinutes: (minutes: number) => void }

const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  return {
    now: () => current,
    advanceMinutes: (minutes) => {
      current = Instant.fromEpochMilliseconds(
        current.epochMilliseconds + minutes * millisecondsPerMinute,
      )
    },
  }
}

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

type Lord = {
  readonly cookie: string
  readonly fiefId: FiefId
}

const unknownFiefId = '6d1f0c3a-2b4e-4c5d-9e8f-7a6b5c4d3e2f'

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

describe('the map route', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>
  let clock: MovableClock

  beforeAll(() => {
    server = composeServer(
      { API_PORT: '3195', DATABASE_URL: databaseUrl(), ...mailEnvironment },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, player_seen_hints, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  const signUp = async (email: string, fiefName: string): Promise<Lord> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana', fiefName }),
    })
    expect(response.status).toBe(201)
    const cookie = sessionCookieOf(response)
    const fiefs = await app.request('/fiefs', { headers: { cookie } })
    const [fief] = FiefListSchema.parse(await fiefs.json()).fiefs
    assert(fief !== undefined)
    return { cookie, fiefId: fief.id }
  }

  const mapOf = async (lord: Lord, path = ''): Promise<Response> =>
    app.request(`/fiefs/${lord.fiefId}/map${path}`, { headers: { cookie: lord.cookie } })

  const provinceTwoOf = async (lord: Lord): Promise<ProvinceMap> =>
    ProvinceMapSchema.parse(await (await mapOf(lord, '/2')).json())

  const signUpWithASettler = async (email: string, fiefName: string): Promise<Lord> => {
    const lord = await signUp(email, fiefName)
    await runSql(
      `INSERT INTO fief_units (fief_id, kind, count) VALUES ('${lord.fiefId}', 'settler', 1)`,
    )
    return lord
  }

  const sendFounding = async (lord: Lord, plot: number): Promise<void> => {
    const response = await app.request(`/fiefs/${lord.fiefId}/marches/found`, {
      method: 'POST',
      headers: { cookie: lord.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ province: 2, plot, name: 'Sotoverde del Páramo' }),
    })
    expect(response.status).toBe(200)
  }

  const freePlotWithoutCampOf = async (lord: Lord): Promise<number> => {
    const free = (await provinceTwoOf(lord)).plots.find(
      ({ fief, camp }) => fief === null && camp === null,
    )
    assert(free !== undefined)
    return free.plot
  }

  it('opens the map on the province of the fief named in the path', async () => {
    await signUp('bruno@example.com', 'Robledal')
    for (let plot = 2; plot <= plotsPerProvince; plot += 1) {
      await signUp(`vecino-${plot}@example.com`, `Vecino ${plot}`)
    }
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(ana)

    expect(response.status).toBe(200)
    const map = ProvinceMapSchema.parse(await response.json())
    expect({
      kingdom: map.kingdom,
      province: map.province,
      lastProvince: map.lastProvince,
    }).toEqual({ kingdom: 1, province: 2, lastProvince: 3 })
    expect(map.plots[0]).toEqual({
      plot: 1,
      fief: { name: 'Valdehierro', isOwn: true },
      camp: null,
      reservation: null,
    })
  })

  it('marks only the signed-in fief as own', async () => {
    await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await mapOf(bruno, '/1')

    const map = ProvinceMapSchema.parse(await response.json())
    expect(map.plots.slice(0, 3)).toEqual([
      { plot: 1, fief: { name: 'Valdehierro', isOwn: false }, camp: null, reservation: null },
      { plot: 2, fief: { name: 'Robledal', isOwn: true }, camp: null, reservation: null },
      { plot: 3, fief: null, camp: null, reservation: null },
    ])
  })

  it('answers every plot of the province with its terrain', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(ana)

    const map = ProvinceMapSchema.parse(await response.json())
    expect(map.terrain).toBe('lowlands')
    expect(map.plots.map(({ plot }) => plot)).toEqual(
      Array.from({ length: plotsPerProvince }, (_, index) => index + 1),
    )
  })

  it('answers the province past the last held one with every plot free', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(ana, '/2')

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
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(ana, '/3')

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json())).toEqual({
      kind: 'ProvinceNotFound',
      message: 'Esa provincia no está en el mapa. Vuelve a la tuya.',
    })
  })

  it('answers 400 for a province that is not a number', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const responses = await Promise.all(['/tres', '/0', '/1.5'].map((path) => mapOf(ana, path)))

    expect(responses.map(({ status }) => status)).toEqual([400, 400, 400])
  })

  it('answers 404 with FiefNotFound for the fief of another player', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')

    const response = await mapOf({ cookie: bruno.cookie, fiefId: ana.fiefId })

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json()).kind).toBe('FiefNotFound')
  })

  it('answers the camps of a province', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')

    const response = await mapOf(ana, '/1')

    const map = ProvinceMapSchema.parse(await response.json())
    expect(map.plots.filter(({ camp }) => camp !== null)).toEqual([
      { plot: 9, fief: null, camp: { tier: 3, strength: 40 }, reservation: null },
      { plot: 12, fief: null, camp: { tier: 1, strength: 6 }, reservation: null },
    ])
  })

  it('answers a camp recorded beaten regrown an hour later', async () => {
    const ana = await signUp('ana@example.com', 'Valdehierro')
    const beatenTierOneCamp = {
      kingdom: 1,
      province: 1,
      plot: 12,
      strength: 0,
      foughtAt: clock.now(),
    }
    expect(await server.inTransaction(({ camps }) => camps.record(beatenTierOneCamp))).toEqual(
      ok(undefined),
    )
    clock.advanceMinutes(60)

    const response = await mapOf(ana, '/1')

    const map = ProvinceMapSchema.parse(await response.json())
    expect(map.plots[11]).toEqual({
      plot: 12,
      fief: null,
      camp: { tier: 1, strength: 1 },
      reservation: null,
    })
  })

  it('shows the plot of a founding in flight as reserved to another lord', async () => {
    const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')
    const plot = await freePlotWithoutCampOf(ana)
    await sendFounding(ana, plot)

    const map = await provinceTwoOf(bruno)

    expect(map.plots[plot - 1]).toEqual({
      plot,
      fief: null,
      camp: null,
      reservation: { isOwn: false },
    })
  })

  it('shows the plot free again after a recall', async () => {
    const ana = await signUpWithASettler('ana@example.com', 'Valdehierro')
    const bruno = await signUp('bruno@example.com', 'Robledal')
    const plot = await freePlotWithoutCampOf(ana)
    await sendFounding(ana, plot)
    clock.advanceMinutes(5)
    const recall = await app.request(
      `/fiefs/${ana.fiefId}/marches/${encodeURIComponent('2026-09-22T08:00:00.000Z')}/recall`,
      { method: 'POST', headers: { cookie: ana.cookie } },
    )
    expect(recall.status).toBe(200)

    const map = await provinceTwoOf(bruno)

    expect(map.plots[plot - 1]).toEqual({ plot, fief: null, camp: null, reservation: null })
  })

  it('answers 401 without a session', async () => {
    const responses = await Promise.all(
      ['', '/1'].map((path) => app.request(`/fiefs/${unknownFiefId}/map${path}`)),
    )

    expect(responses.map(({ status }) => status)).toEqual([401, 401])
  })
})
