import { HoldoutChecksSchema } from '@mygame/contracts'
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import {
  type MovableClock,
  millisecondsPerMinute,
  movableClock,
  overviewOf,
  runSql,
  type TownApp,
  townRequests,
  townServer,
} from '#town/infrastructure/http/townRoutes.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

describe('the town read', () => {
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

  describe('the holdout on the town', () => {
    const millisecondsPerWeek = 7 * 24 * 60 * millisecondsPerMinute

    const weeksBefore = (weeks: number): string =>
      new Date(clock.now().epochMilliseconds - weeks * millisecondsPerWeek).toISOString()

    const wordOfLesson22 = (index: number): { readonly id: string; readonly headword: string } => {
      const word = server.lessons.lessonOf('lesson-22')?.words[index]
      assert(word !== undefined)
      return { id: word.id, headword: word.acceptedForms[0] }
    }

    const heldOut = (): ReturnType<typeof wordOfLesson22> => wordOfLesson22(0)

    const practised = (): ReturnType<typeof wordOfLesson22> => wordOfLesson22(1)

    const bandOneStarted = async (
      weeksAgo: number,
      releasingCheck: 'none' | 'begun' | 'skipped',
    ): Promise<void> => {
      await runSql(
        `INSERT INTO band_starts (player_id, band, started_at) SELECT id, 1, '${weeksBefore(weeksAgo)}' FROM players`,
      )
      await runSql(
        `INSERT INTO held_out_words (player_id, band, headword) SELECT id, 1, '${heldOut().headword}' FROM players`,
      )
      await runSql(
        `INSERT INTO cards (player_id, word_id, state, stability, difficulty, last_review_at, last_rating, entered_at) SELECT id, '${practised().id}', 'review', 365, 5, '${weeksBefore(1)}', 'good', '${weeksBefore(weeksAgo)}' FROM players WHERE email = 'ana@example.com'`,
      )
      if (releasingCheck === 'begun') {
        await runSql(
          `INSERT INTO holdout_checks (player_id, band, week, kind, begun_at) SELECT id, 1, 24, 'begun', '${weeksBefore(1)}' FROM players`,
        )
      }
      if (releasingCheck === 'skipped') {
        await runSql(
          `INSERT INTO holdout_checks (player_id, band, week, kind, closed_at) SELECT id, 1, 24, 'skipped', '${weeksBefore(1)}' FROM players`,
        )
      }
    }

    const dueChecksOf = async (cookie: string): Promise<unknown> => {
      const response = await app.request('/holdout-checks', { headers: { cookie } })
      expect(response.status).toBe(200)
      return HoldoutChecksSchema.parse(await response.json()).checks.map(({ band, week }) => ({
        band,
        week,
      }))
    }

    it('says a band has started before its first check is due', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await bandOneStarted(7, 'none')

      const overview = await overviewOf(await readTown(cookie))

      expect(overview.dueHoldoutChecks).toEqual([])
      expect(overview.hasBandStarted).toBe(true)
    })

    it('answers 0 of 875 for band 1 when it starts', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await runSql(
        `INSERT INTO band_starts (player_id, band, started_at) SELECT id, 1, '${weeksBefore(0)}' FROM players`,
      )

      const overview = await overviewOf(await readTown(cookie))

      expect(overview.bandLines).toEqual([{ band: 1, count: 0, total: 875 }])
    })

    it('names a due check as the next step 8 weeks after the band’s start', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await bandOneStarted(8, 'none')

      const overview = await overviewOf(await readTown(cookie))

      expect(overview.nextStep).toEqual({ kind: 'holdoutCheck', band: 1, week: 8 })
      expect(overview.dueHoldoutChecks).toEqual([{ band: 1, week: 8 }])
    })

    it('answers the due checks the holdout checks read answers at the same instant', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await bandOneStarted(24, 'begun')

      const overview = await overviewOf(await readTown(cookie))

      expect(overview.dueHoldoutChecks).toEqual(await dueChecksOf(cookie))
      expect(overview.dueHoldoutChecks).toEqual([{ band: 1, week: 24 }])
    })

    it('answers no due check before 8 weeks have passed', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await bandOneStarted(7, 'none')

      const overview = await overviewOf(await readTown(cookie))

      expect([overview.dueHoldoutChecks, overview.nextStep]).toEqual([
        [],
        { kind: 'lessonToStudy', lessonId: 'lesson-1' },
      ])
    })

    it('holds the released lesson back while the 24-week check is open', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await bandOneStarted(25, 'begun')

      const overview = await overviewOf(await readTown(cookie))

      expect([overview.releasedLessons, overview.nextStep]).toEqual([
        [],
        { kind: 'holdoutCheck', band: 1, week: 24 },
      ])
    })

    it('names the released lesson once the 24-week check is skipped', async () => {
      const cookie = await signUpWithTown('ana@example.com')
      await bandOneStarted(25, 'skipped')

      const overview = await overviewOf(await readTown(cookie))
      const shelved = overview.lessons.find(({ id }) => id === 'lesson-22')

      expect(overview.nextStep).toEqual({
        kind: 'releasedLesson',
        lessonId: 'released-1-1',
        band: 1,
        position: 1,
      })
      expect(overview.releasedLessons).toEqual([
        {
          id: 'released-1-1',
          band: 1,
          position: 1,
          durationSeconds: shelved?.durationSeconds,
          requiredSchoolLevel: 1,
          isStudied: false,
          words: [shelved?.words.find(({ wordId }) => wordId === heldOut().id)],
          enteringWordCount: 1,
        },
      ])
    })
  })
})
