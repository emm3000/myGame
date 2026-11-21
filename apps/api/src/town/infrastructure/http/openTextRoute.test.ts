import { type OpenText, OpenTextSchema, TownOverviewSchema } from '@mygame/contracts'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  type MovableClock,
  movableClock,
  overviewOf,
  refusalOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
  withCopiesOfFirstText,
} from './townRoutes.testSupport'

describe('the town route', () => {
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

  const { signUp, signUpWithTown, readTown } = townRequests(() => app)

  describe('the texts', () => {
    const wordIdsUpTo = (lessonId: string): ReadonlyArray<string> => {
      const curriculum = server.lessons.lessons()
      const last = curriculum.findIndex(({ id }) => id === lessonId)
      return curriculum.slice(0, last + 1).flatMap(({ words }) => words.map(({ id }) => id))
    }

    const holdCards = (
      email: string,
      wordIds: ReadonlyArray<string>,
      stability: number,
    ): Promise<void> =>
      runSql(
        `INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at) SELECT id, word_id, 'review', ${stability}, 5, '2026-11-01T08:00:00Z', 'good', '2026-11-01T07:00:00Z' FROM players, unnest(ARRAY[${wordIds.map((id) => `'${id}'`).join(', ')}]) word_id WHERE email = '${email}'`,
      )

    const setStability = (wordId: string, stability: number): Promise<void> =>
      runSql(`UPDATE cards SET stability = ${stability} WHERE word_id = '${wordId}'`)

    const readText = (cookie: string, textId: string): Promise<Response> =>
      Promise.resolve(app.request(`/town/texts/${textId}`, { headers: { cookie } }))

    const textOf = async (response: Response): Promise<OpenText> =>
      OpenTextSchema.parse(await response.json())

    const supportOf = (text: OpenText, word: string): unknown =>
      text.sentences.flat().find((span) => span.text === word)?.support

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
      expect([
        supportOf(text, 'course'),
        supportOf(text, 'river'),
        supportOf(text, 'news'),
      ]).toEqual([
        { shown: 'beside', text: 'curso', language: 'es' },
        { shown: 'onTap', text: 'río', language: 'es' },
        {
          shown: 'onTap',
          text: 'new information about people, places and the world',
          language: 'en',
        },
      ])
    })

    it('glosses a held-out word beside it', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await holdCards(
        'ana@example.com',
        wordIdsUpTo('lesson-31').filter((id) => id !== 'word-149'),
        60,
      )
      await runSql(
        `INSERT INTO band_starts (player_id, band, started_at) SELECT id, 1, '2026-11-01T08:00:00Z' FROM players`,
      )
      await runSql(
        `INSERT INTO held_out_words (player_id, band, headword) SELECT id, 1, 'course' FROM players`,
      )

      const text = await textOf(await readText(cookie, 'text-1'))

      expect(supportOf(text, 'course')).toEqual({
        shown: 'beside',
        text: 'curso',
        language: 'es',
      })
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

    it('refuses a text to a player with no town', async () => {
      const cookie = await signUp('ana@example.com')

      const response = await readText(cookie, 'text-1')

      expect([response.status, await refusalOf(response)]).toMatchObject([
        404,
        { kind: 'TownNotFound' },
      ])
    })
  })
})
