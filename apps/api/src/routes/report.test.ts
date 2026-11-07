import { fileURLToPath } from 'node:url'
import { PlayerSchema } from '@mygame/contracts'
import {
  type Report,
  ReportSchema,
  type TownOverview,
  TownOverviewSchema,
} from '@mygame/contracts/town'
import { type Clock, Instant, type PlayerId } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

type SettableClock = Clock & { readonly setTo: (iso: string) => void }

const settableClock = (iso: string): SettableClock => {
  let current = Instant.fromEpochMilliseconds(Date.parse(iso))
  return {
    now: () => current,
    setTo: (next) => {
      current = Instant.fromEpochMilliseconds(Date.parse(next))
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

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

type SignedUpPlayer = {
  readonly cookie: string
  readonly playerId: PlayerId
}

const signedUpAt = '2026-11-10T08:00:00.000Z'

const firstWorkDoneAt = '2026-11-10T08:30:00.000Z'

const secondWorkDoneAt = '2026-11-10T09:00:00.000Z'

const lessonStartsAt = '2026-11-10T08:55:00.000Z'

const lessonFinishesAt = '2026-11-10T09:00:00.000Z'

describe('the Report routes', () => {
  let server: ComposedServer
  let clock: SettableClock
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, player_seen_hints, player_skills, earned_skills, band_starts, held_out_words, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    clock = settableClock(signedUpAt)
    app = createApp({ ...server, clock })
  })

  const send = async (
    cookie: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> =>
    await app.request(path, {
      method,
      headers: {
        cookie,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })

  const signUpWithATown = async (): Promise<SignedUpPlayer> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
      }),
    })
    const player = PlayerSchema.parse(await response.json())
    const cookie = sessionCookieOf(response)
    expect((await send(cookie, 'POST', '/town', { name: 'Maple Falls' })).status).toBe(200)
    return { cookie, playerId: player.id }
  }

  const workFinishOf = async ({ cookie }: SignedUpPlayer, building: string): Promise<string> => {
    const response = await send(cookie, 'POST', '/town/work', { building })
    expect(response.status).toBe(200)
    const overview: TownOverview = TownOverviewSchema.parse(await response.json())
    const slot = overview.work.slot
    assert(slot !== null)
    return slot.finishesAt
  }

  const readReport = async ({ cookie }: SignedUpPlayer): Promise<Report> => {
    const response = await send(cookie, 'GET', '/report')
    expect(response.status).toBe(200)
    return ReportSchema.parse(await response.json())
  }

  const closeReport = ({ cookie }: SignedUpPlayer): Promise<Response> =>
    send(cookie, 'POST', '/report/close')

  it('answers readFirst on the Report', async () => {
    const ana = await signUpWithATown()
    clock.setTo(lessonStartsAt)
    await send(ana.cookie, 'POST', '/town/lessons', { lessonId: 'lesson-1' })

    const running = await readReport(ana)
    clock.setTo(lessonFinishesAt)
    const finished = await readReport(ana)

    expect([running.readFirst, finished.readFirst]).toEqual([[], ['lesson-1']])
  })

  it('answers no next review before a card enters', async () => {
    const ana = await signUpWithATown()

    expect((await readReport(ana)).nextDueAt).toBeNull()
  })

  it('answers the instant of a review not yet due', async () => {
    const ana = await signUpWithATown()
    clock.setTo(lessonStartsAt)
    await send(ana.cookie, 'POST', '/town/lessons', { lessonId: 'lesson-1' })

    clock.setTo(lessonFinishesAt)
    const dueNow = await readReport(ana)
    const [card] = dueNow.due
    assert(card?.mode === 'recognition')
    const [choice] = card.choices
    assert(choice !== undefined)
    await send(ana.cookie, 'POST', `/reviews/${card.wordId}/answer`, { answer: choice.choiceId })

    const answered = await readReport(ana)

    expect([dueNow.nextDueAt, answered.nextDueAt === null]).toEqual([null, false])
  })

  it('answers the news since the player last closed the Report', async () => {
    const ana = await signUpWithATown()
    await workFinishOf(ana, 'farm')
    clock.setTo(firstWorkDoneAt)
    await send(ana.cookie, 'GET', '/town')
    await closeReport(ana)
    const homesDoneAt = await workFinishOf(ana, 'homes')
    clock.setTo(secondWorkDoneAt)

    const report = await readReport(ana)

    expect(report.news).toEqual([
      {
        kind: 'buildingWorkFinished',
        params: { building: 'homes', level: 2 },
        occurredAt: homesDoneAt,
      },
    ])
  })

  it('answers the reviews due and their count', async () => {
    const ana = await signUpWithATown()
    clock.setTo(lessonStartsAt)
    expect((await send(ana.cookie, 'POST', '/town/lessons', { lessonId: 'lesson-1' })).status).toBe(
      200,
    )
    clock.setTo(lessonFinishesAt)

    const report = await readReport(ana)

    expect([report.dueCount, report.due.map(({ wordId }) => wordId)]).toEqual([
      5,
      ['lesson-1-1', 'lesson-1-2', 'lesson-1-3', 'lesson-1-4', 'lesson-1-5'],
    ])
  })

  it('answers the reviews due to a player with no town', async () => {
    const ana = await signUpWithATown()
    clock.setTo(lessonStartsAt)
    expect((await send(ana.cookie, 'POST', '/town/lessons', { lessonId: 'lesson-1' })).status).toBe(
      200,
    )
    clock.setTo(lessonFinishesAt)
    await readReport(ana)
    await runSql('DELETE FROM towns')

    const report = await readReport(ana)

    expect([report.dueCount, report.due.length, report.news]).toEqual([5, 5, []])
  })

  it('stores the close instant', async () => {
    const ana = await signUpWithATown()
    clock.setTo(firstWorkDoneAt)

    const response = await closeReport(ana)

    expect([response.status, await response.text()]).toEqual([204, ''])
    expect(await server.reportClosings.closedAt(ana.playerId)).toEqual(
      Instant.fromEpochMilliseconds(Date.parse(firstWorkDoneAt)),
    )
  })
})
