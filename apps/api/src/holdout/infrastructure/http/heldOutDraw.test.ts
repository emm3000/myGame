import { Client, type QueryResultRow } from 'pg'
import { assert, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { bandLessonFixtures } from '#learning/infrastructure/http/heldOutWords.testSupport'
import {
  databaseUrl,
  learningWorld,
  lessonStartsAt,
} from '#learning/infrastructure/http/learningRoutes.testSupport'

describe('the held-out draw', () => {
  const world = learningWorld()
  const { signUpWithATown, startLesson, stopLesson } = world
  const { libraryWithBandLesson } = bandLessonFixtures(world)

  const storedRows = async <Row extends QueryResultRow>(
    statement: string,
  ): Promise<ReadonlyArray<Row>> => {
    const client = new Client({ connectionString: databaseUrl() })
    await client.connect()
    try {
      return (await client.query<Row>(statement)).rows
    } finally {
      await client.end()
    }
  }

  const heldOutCount = async (): Promise<number> => {
    const [counted] = await storedRows<{ count: number }>(
      'SELECT count(*)::int AS count FROM held_out_words',
    )
    assert(counted !== undefined)
    return counted.count
  }

  beforeEach(() => {
    world.app = createApp({
      ...world.server,
      clock: world.clock,
      lessons: libraryWithBandLesson(),
    })
  })

  it("stores a tenth of band 1's card words outside the chrome lessons", async () => {
    const player = await signUpWithATown()

    expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(200)

    expect(await heldOutCount()).toBe(87)
  })

  it('stores the instant of the band start', async () => {
    const player = await signUpWithATown()
    world.clock.setTo(lessonStartsAt)

    await startLesson(player, 'lesson-fixture-holdout')

    expect(await storedRows('SELECT band, started_at AS "startedAt" FROM band_starts')).toEqual([
      { band: 1, startedAt: new Date(lessonStartsAt) },
    ])
  })

  it('draws nothing when a chrome lesson starts', async () => {
    const player = await signUpWithATown()

    await startLesson(player, 'lesson-1')

    expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
  })

  it('stores no draw for a start the busy slot refuses', async () => {
    const player = await signUpWithATown()
    await startLesson(player, 'lesson-1')

    expect((await startLesson(player, 'lesson-fixture-holdout')).status).toBe(409)

    expect(await storedRows('SELECT band FROM band_starts')).toEqual([])
  })

  it('keeps the draw when a stopped lesson starts again', async () => {
    const player = await signUpWithATown()
    await startLesson(player, 'lesson-fixture-holdout')
    const drawn = await storedRows('SELECT headword FROM held_out_words ORDER BY headword')
    await stopLesson(player, 'lesson-fixture-holdout')

    await startLesson(player, 'lesson-fixture-holdout')

    expect(await storedRows('SELECT headword FROM held_out_words ORDER BY headword')).toEqual(drawn)
  })
})
