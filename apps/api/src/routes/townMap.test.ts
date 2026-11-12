import { fileURLToPath } from 'node:url'
import { ApiErrorSchema, PlayerSchema, type RegionMap, RegionMapSchema } from '@mygame/contracts'
import { Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const fixedClock = { now: () => Instant.fromEpochMilliseconds(Date.parse('2026-11-05T08:00:00Z')) }

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

describe('the region map route', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    app = createApp({ ...server, clock: fixedClock })
  })

  const signUp = async (email: string): Promise<string> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana' }),
    })
    PlayerSchema.parse(await response.json())
    return sessionCookieOf(response)
  }

  const signUpWithTown = async (email: string, name: string): Promise<string> => {
    const cookie = await signUp(email)
    const founded = await app.request('/town', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    expect(founded.status).toBe(200)
    return cookie
  }

  const readMap = (cookie: string, path = '/town/map'): Promise<Response> =>
    Promise.resolve(app.request(path, { headers: { cookie } }))

  const mapOf = async (response: Response): Promise<RegionMap> =>
    RegionMapSchema.parse(await response.json())

  it('opens the map on the town’s area', async () => {
    const ana = await signUpWithTown('ana@example.com', 'Maple Falls')
    await signUpWithTown('bea@example.com', 'Cedar Point')

    const response = await readMap(ana)

    expect(response.status).toBe(200)
    const map = await mapOf(response)
    expect([map.region, map.area, map.lastArea, map.terrain, map.sites.slice(0, 3)]).toEqual([
      1,
      1,
      2,
      'fields',
      [
        { site: 1, town: { name: 'Maple Falls', isOwn: true }, waste: null },
        { site: 2, town: { name: 'Cedar Point', isOwn: false }, waste: null },
        { site: 3, town: null, waste: null },
      ],
    ])
  })

  it('answers every site of the area', async () => {
    const ana = await signUpWithTown('ana@example.com', 'Maple Falls')

    const map = await mapOf(await readMap(ana))

    expect(map.sites.map(({ site }) => site)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
  })

  it('opens the area one past the last holding a town, every site free', async () => {
    const ana = await signUpWithTown('ana@example.com', 'Maple Falls')

    const response = await readMap(ana, '/town/map/2')

    expect(response.status).toBe(200)
    const map = await mapOf(response)
    expect([map.area, map.terrain, map.sites.every(({ town }) => town === null)]).toEqual([
      2,
      'river',
      true,
    ])
  })

  it('shows a waste site’s waste at the read', async () => {
    const ana = await signUpWithTown('ana@example.com', 'Maple Falls')
    await runSql(
      "INSERT INTO site_clean_ups (town_id, sent_at, region, area, site, cleaned_at) SELECT id, '2026-11-05T04:00:00Z', 1, 1, 12, '2026-11-05T05:00:00Z' FROM towns",
    )

    const map = await mapOf(await readMap(ana))

    expect(map.sites.filter(({ waste }) => waste !== null)).toEqual([
      { site: 9, town: null, waste: { size: 3, waste: 40 } },
      { site: 12, town: null, waste: { size: 1, waste: 3 } },
    ])
  })

  it('refuses an area past the last browsable', async () => {
    const ana = await signUpWithTown('ana@example.com', 'Maple Falls')

    const response = await readMap(ana, '/town/map/3')

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json())).toEqual({ kind: 'AreaNotFound' })
  })

  it('refuses a player with no town as TownNotFound', async () => {
    const ana = await signUp('ana@example.com')

    const response = await readMap(ana)

    expect(response.status).toBe(404)
    expect(ApiErrorSchema.parse(await response.json())).toEqual({ kind: 'TownNotFound' })
  })

  it('answers an area that is not a whole count from 1 with an empty 400', async () => {
    const ana = await signUpWithTown('ana@example.com', 'Maple Falls')

    const response = await readMap(ana, '/town/map/0')

    expect([response.status, await response.text()]).toEqual([400, ''])
  })
})
