import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { textReading } from '#learning/infrastructure/http/textStage.testSupport'
import {
  type MovableClock,
  movableClock,
  runSql,
  type TownApp,
  townRequests,
  townServer,
} from '#town/infrastructure/http/townRoutes.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

describe('the held-out words in a text', () => {
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

  const { signUpWithTown } = townRequests(() => app)

  const { wordIdsUpTo, holdCards, readText, textOf, supportOf } = textReading(
    () => server,
    () => app,
  )

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
})
