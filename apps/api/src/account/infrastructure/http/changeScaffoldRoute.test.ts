import { type ChromePhase, type Player, PlayerSchema } from '@mygame/contracts'
import { Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

const contentDirectory = apiPackagePath('content/')

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
    await rowsOf(truncatePlayerTables)
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

  const sessionOf = async (cookie: string): Promise<Player> =>
    PlayerSchema.parse(await (await app.request('/auth/session', { headers: { cookie } })).json())

  it('answers a later scaffold version on a change than on the session read before it', async () => {
    const ana = await signUpInSpanish()
    const before = await sessionOf(ana.cookie)

    const changed = PlayerSchema.parse(
      await (await changeScaffold(ana.cookie, { scaffold: 'none' })).json(),
    )

    expect(changed.scaffoldVersion).toBeGreaterThan(before.scaffoldVersion)
  })

  it('answers each change a later scaffold version than the change before it', async () => {
    const ana = await signUpInSpanish()
    const first = PlayerSchema.parse(
      await (await changeScaffold(ana.cookie, { scaffold: 'none' })).json(),
    )

    const second = PlayerSchema.parse(
      await (await changeScaffold(ana.cookie, { scaffold: 'es' })).json(),
    )

    expect(second.scaffoldVersion).toBeGreaterThan(first.scaffoldVersion)
  })

  it('answers the next session read the scaffold version of the last change', async () => {
    const ana = await signUpInSpanish()
    const changed = PlayerSchema.parse(
      await (await changeScaffold(ana.cookie, { scaffold: 'none' })).json(),
    )

    const session = await sessionOf(ana.cookie)

    expect([session.scaffold, session.scaffoldVersion]).toEqual(['none', changed.scaffoldVersion])
  })

  it('keeps the scaffold version when a change is refused', async () => {
    const ana = await signUpInSpanish()
    const before = await sessionOf(ana.cookie)

    await changeScaffold(ana.cookie, { scaffold: 'fr' })

    expect((await sessionOf(ana.cookie)).scaffoldVersion).toBe(before.scaffoldVersion)
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

  it('answers a player whose account is gone as signed out', async () => {
    const ana = await signUpInSpanish()
    await rowsOf('DELETE FROM players WHERE id = $1', [ana.id])

    const response = await changeScaffold(ana.cookie, { scaffold: 'none' })

    expect({ status: response.status, body: await response.text() }).toEqual({
      status: 401,
      body: '',
    })
  })

  const chromePhaseOfSession = async (cookie: string): Promise<ChromePhase> => {
    const session = await app.request('/auth/session', { headers: { cookie } })
    expect(session.status).toBe(200)
    return PlayerSchema.parse(await session.json()).chromePhase
  }

  it('answers the chrome Spanish on the session of a new player under es', async () => {
    const ana = await signUpInSpanish()

    expect(await chromePhaseOfSession(ana.cookie)).toBe('scaffold')
  })

  it('answers the chrome English on the session once the player changes to none', async () => {
    const ana = await signUpInSpanish()
    await changeScaffold(ana.cookie, { scaffold: 'none' })

    expect(await chromePhaseOfSession(ana.cookie)).toBe('english')
  })

  it('answers the chrome English on the session of a player with no town who earned every chrome skill', async () => {
    const ana = await signUpInSpanish()
    const chromeLessons = server.lessons.chromeLessons()
    await rowsOf(
      `INSERT INTO cards (player_id, word_id, state, step, stability, difficulty, last_review_at, last_rating, entered_at)
       SELECT $1, word_id, 'review', NULL, 9.5, 4.2, '2026-11-11T08:00:00Z', 'good', '2026-11-10T08:00:00Z'
       FROM unnest($2::text[]) AS word_id`,
      [ana.id, chromeLessons.flatMap(({ words }) => words.slice(0, 1).map(({ id }) => id))],
    )
    await rowsOf(
      `INSERT INTO earned_skills (player_id, lesson_id, resource, rate_percent, earned_at)
       SELECT $1, lesson_id, 'food', 5, '2026-11-11T08:00:00Z' FROM unnest($2::text[]) AS lesson_id`,
      [ana.id, chromeLessons.map(({ id }) => id)],
    )

    expect(await chromePhaseOfSession(ana.cookie)).toBe('english')
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
