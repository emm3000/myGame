import { ApiErrorSchema, type TownOverview, TownOverviewSchema } from '@mygame/contracts'
import { afterAll, beforeAll, beforeEach, expect } from 'vitest'
import { createApp } from '#app'
import type { ComposedServer } from '#composeServer'
import { type SettableClock, settableClock } from '#settableClock.testSupport'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'
import {
  runSql,
  sessionCookieOf,
  townServer,
} from '../../../infrastructure/http/townRoutes.testSupport'

export type Player = {
  readonly cookie: string
}

export const wordIds = ['lesson-1-1', 'lesson-1-2', 'lesson-1-3', 'lesson-1-4', 'lesson-1-5']

export const lessonStartsAt = '2026-11-10T08:55:00.000Z'

export const lessonFinishesAt = '2026-11-10T09:00:00.000Z'

export const overviewOf = async (response: Response): Promise<TownOverview> => {
  expect(response.status).toBe(200)
  return TownOverviewSchema.parse(await response.json())
}

export const refusalOf = async (response: Response): Promise<unknown> => ({
  status: response.status,
  body: ApiErrorSchema.parse(await response.json()),
})

type App = ReturnType<typeof createApp>

export type SchoolWorld = {
  readonly clock: SettableClock
  readonly send: (player: Player, method: string, path: string, body?: unknown) => Promise<Response>
  readonly signUp: () => Promise<Player>
  readonly signUpWithATown: () => Promise<Player>
  readonly readTown: (player: Player) => Promise<TownOverview>
  readonly startLesson: (player: Player, lessonId?: string) => Promise<Response>
  readonly stopLesson: (player: Player, lessonId?: string) => Promise<Response>
  readonly studyLessonOne: () => Promise<Player>
}

export function schoolWorld(): SchoolWorld {
  let server: ComposedServer
  let clock: SettableClock
  let app: App

  beforeAll(() => {
    server = townServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await runSql(truncatePlayerTables)
    clock = settableClock('2026-11-10T08:00:00Z')
    app = createApp({ ...server, clock })
  })

  const send = async (
    player: Player,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> =>
    await app.request(path, {
      method,
      headers: {
        cookie: player.cookie,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })

  const signUp = async (): Promise<Player> => {
    const response = await app.request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@example.com',
        password: 'hierro-y-lana',
        scaffold: 'es',
      }),
    })
    return { cookie: sessionCookieOf(response) }
  }

  const signUpWithATown = async (): Promise<Player> => {
    const player = await signUp()
    const founded = await send(player, 'POST', '/town', { name: 'Maple Falls' })
    expect(founded.status).toBe(200)
    return player
  }

  const readTown = async (player: Player): Promise<TownOverview> =>
    overviewOf(await send(player, 'GET', '/town'))

  const startLesson = (player: Player, lessonId = 'lesson-1'): Promise<Response> =>
    send(player, 'POST', '/town/lessons', { lessonId })

  const stopLesson = (player: Player, lessonId = 'lesson-1'): Promise<Response> =>
    send(player, 'DELETE', `/town/lessons/${lessonId}`)

  const studyLessonOne = async (): Promise<Player> => {
    const player = await signUpWithATown()
    clock.setTo(lessonStartsAt)
    expect((await startLesson(player)).status).toBe(200)
    return player
  }

  return {
    get clock(): SettableClock {
      return clock
    },
    send,
    signUp,
    signUpWithATown,
    readTown,
    startLesson,
    stopLesson,
    studyLessonOne,
  }
}
