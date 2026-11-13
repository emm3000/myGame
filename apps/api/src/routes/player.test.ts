import { fileURLToPath } from 'node:url'
import { PlayerSchema } from '@mygame/contracts'
import { Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const rowsOf = async (
  statement: string,
  parameters: ReadonlyArray<unknown> = [],
): Promise<ReadonlyArray<unknown>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    return (await client.query(statement, [...parameters])).rows
  } finally {
    await client.end()
  }
}

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

const fixedClock = {
  now: (): Instant => Instant.fromEpochMilliseconds(Date.parse('2026-11-12T08:00:00Z')),
}

describe('the player routes', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await rowsOf(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
    )
    app = createApp({ ...server, clock: fixedClock })
  })

  const signUpInSpanish = async (): Promise<{ readonly cookie: string; readonly id: string }> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', password: 'hierro-y-lana', scaffold: 'es' }),
    })
    return { cookie: sessionCookieOf(response), id: PlayerSchema.parse(await response.json()).id }
  }

  const changeScaffold = async (cookie: string, body: unknown): Promise<Response> =>
    await app.request('/player/scaffold', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('answers the player with the scaffold language it changed to', async () => {
    const ana = await signUpInSpanish()

    const response = await changeScaffold(ana.cookie, { scaffold: 'none' })

    expect(response.status).toBe(200)
    expect(PlayerSchema.parse(await response.json()).scaffold).toBe('none')
  })

  it('keeps the changed scaffold language for the next session read', async () => {
    const ana = await signUpInSpanish()
    await changeScaffold(ana.cookie, { scaffold: 'none' })

    const session = await app.request('/auth/session', { headers: { cookie: ana.cookie } })

    expect(PlayerSchema.parse(await session.json()).scaffold).toBe('none')
  })

  it('changes the scaffold language without touching a card', async () => {
    const ana = await signUpInSpanish()
    await rowsOf(
      `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
       VALUES ($1, 'lesson-1-1', 'review', NULL, 9.5, 4.2, '2026-11-11T08:00:00Z', 'good', '2026-11-10T08:00:00Z'),
              ($1, 'lesson-1-2', 'learning', 0, NULL, NULL, NULL, NULL, '2026-11-10T08:00:00Z')`,
      [ana.id],
    )
    const cardsBefore = await rowsOf('SELECT * FROM cards ORDER BY word_id')

    expect((await changeScaffold(ana.cookie, { scaffold: 'none' })).status).toBe(200)
    expect(await rowsOf('SELECT * FROM cards ORDER BY word_id')).toEqual(cardsBefore)
  })

  it('refuses a scaffold language Townword does not offer with an empty body', async () => {
    const ana = await signUpInSpanish()

    const response = await changeScaffold(ana.cookie, { scaffold: 'fr' })

    expect({ status: response.status, body: await response.text() }).toEqual({
      status: 400,
      body: '',
    })
  })

  it('keeps the stored scaffold language when a change is refused', async () => {
    const ana = await signUpInSpanish()
    await changeScaffold(ana.cookie, { scaffold: 'fr' })

    expect(await rowsOf('SELECT scaffold FROM players')).toEqual([{ scaffold: 'es' }])
  })
})
