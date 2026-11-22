import { PlayerSchema } from '@mygame/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  accountRequests,
  contentDirectory,
  databaseUrl,
  rowsOf,
  sessionCookieOf,
} from '#account/infrastructure/http/accountRoutes.testSupport'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { fixedClock } from '#fixedClock.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

describe('the scaffold and the chrome over held cards', () => {
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
    app = createApp({ ...server, clock: fixedClock('2026-11-12T08:00:00Z') })
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

  const { chromePhaseOfSession } = accountRequests(() => app)

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
})
