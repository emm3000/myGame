import { TownOverviewSchema } from '@mygame/contracts'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import {
  type MovableClock,
  movableClock,
  overviewOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
  withCopiesOfFirstText,
} from '#town/infrastructure/http/townRoutes.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import { textReading } from './textStage.testSupport'

describe('the open texts', () => {
  let server: ComposedServer
  let clock: MovableClock
  let app: TownApp

  beforeAll(() => {
    server = townServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
    clock = movableClock()
    app = createApp({ ...server, clock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const { signUpWithTown, readTown } = townRequests(() => app)

  const { wordIdsUpTo, holdCards, setStability, readText, textOf, supportOf } = textReading(
    () => server,
    () => app,
  )

  it('lists each open text by its id and its title', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await holdCards('ana@example.com', wordIdsUpTo('lesson-31'), 3)

    const overview = await overviewOf(await readTown(cookie))

    expect(overview.texts).toEqual([{ id: 'text-1', title: 'A New Course' }])
  })

  it('carries no sentence of 130 open texts on a town read', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await holdCards('ana@example.com', wordIdsUpTo('lesson-31'), 3)
    const reading = createApp({
      ...server,
      clock,
      lessons: withCopiesOfFirstText(server.lessons, 130),
    })

    const response = await reading.request('/town', { headers: { cookie } })
    const body = await response.text()

    expect(TownOverviewSchema.parse(JSON.parse(body)).texts).toHaveLength(130)
    expect(body).not.toContain('sentences')
  })

  it('serves a text with each card word’s support', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await holdCards('ana@example.com', wordIdsUpTo('lesson-31'), 3)
    await setStability('word-38', 7)
    await setStability('word-22', 30)

    const text = await textOf(await readText(cookie, 'text-1'))

    expect({ id: text.id, title: text.title }).toEqual({ id: 'text-1', title: 'A New Course' })
    expect([supportOf(text, 'course'), supportOf(text, 'river'), supportOf(text, 'news')]).toEqual([
      { shown: 'beside', text: 'curso', language: 'es' },
      { shown: 'onTap', text: 'río', language: 'es' },
      {
        shown: 'onTap',
        text: 'new information about people, places and the world',
        language: 'en',
      },
    ])
  })

  it('names the newest text when the cap is full', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await runSql(
      `INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at) SELECT id, word_id, 'review', 3, 5, '2026-11-05T08:00:00Z', 'good', '2026-11-01T08:00:00Z' FROM players, unnest(ARRAY[${wordIdsUpTo(
        'lesson-31',
      )
        .map((id) => `'${id}'`)
        .join(', ')}]) word_id WHERE email = 'ana@example.com'`,
    )

    const town = await overviewOf(await readTown(cookie))

    expect(town.nextStep).toMatchObject({
      kind: 'caughtUp',
      reason: 'learningCap',
      text: { id: 'text-1', title: 'A New Course' },
    })
  })

  it('serves no text before the stage reaches lesson 31', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await holdCards('ana@example.com', wordIdsUpTo('lesson-30'), 3)

    const overview = await overviewOf(await readTown(cookie))

    expect(overview.texts).toEqual([])
  })

  it('answers an empty 404 to a text the stage has not reached', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await holdCards('ana@example.com', wordIdsUpTo('lesson-30'), 3)

    const response = await readText(cookie, 'text-1')

    expect([response.status, await response.text()]).toEqual([404, ''])
  })

  it('answers an empty 404 to a text the content lacks', async () => {
    const cookie = await signUpWithTown('ana@example.com')
    await holdCards('ana@example.com', wordIdsUpTo('lesson-31'), 3)

    const response = await readText(cookie, 'text-0')

    expect([response.status, await response.text()]).toEqual([404, ''])
  })
})
