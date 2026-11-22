import {
  ApiErrorSchema,
  PlayerSchema,
  type TownOverview,
  TownOverviewSchema,
} from '@mygame/contracts'
import { type Clock, Instant, type LessonLibrary, type UnitOfWork } from '@mygame/domain'
import { Client } from 'pg'
import { assert, expect } from 'vitest'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import type { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import type { ComposedStores } from '#composeStores'
import { isWaitingOnALock, lockedPlayerReadQuery, lockProbeLimit } from '#lockWaitProbe.testSupport'

export const contentDirectory = apiPackagePath('content/')

export const millisecondsPerMinute = 60_000

export const signedUpAt = Date.parse('2026-11-05T08:00:00Z')

export const minutesFromSignUpTo = (instant: string): number =>
  (Date.parse(instant) - signedUpAt) / millisecondsPerMinute

export const minutesToSummer = minutesFromSignUpTo('2026-11-09T00:00:00Z')

export const minutesToWinter = minutesFromSignUpTo('2026-11-23T00:00:00Z')

export const minutesToADayBeforeEpoch = minutesFromSignUpTo('2026-10-04T00:00:00Z')

export type MovableClock = Clock & { readonly advanceMinutes: (minutes: number) => void }

export const movableClock = (): MovableClock => {
  let current = Instant.fromEpochMilliseconds(signedUpAt)
  return {
    now: () => current,
    advanceMinutes: (minutes) => {
      current = Instant.fromEpochMilliseconds(
        current.epochMilliseconds + minutes * millisecondsPerMinute,
      )
    },
  }
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

export const runSql = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(statement)
  } finally {
    await client.end()
  }
}

export const rowCountOf = async (table: string): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const counted = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM ${table}`,
    )
    return counted.rows[0]?.count ?? 0
  } finally {
    await client.end()
  }
}

export const statementTextOf = (query: unknown): string => {
  if (typeof query === 'string') {
    return query
  }
  if (typeof query === 'object' && query !== null && 'text' in query) {
    return String(query.text)
  }
  return ''
}

export const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

export const jsonRequest = (method: string, cookie: string, body: unknown): RequestInit => ({
  method,
  headers: { cookie, 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

export const delegatingTo = (lessons: LessonLibrary): LessonLibrary => ({
  lessonOf: (lessonId) => lessons.lessonOf(lessonId),
  lessonOfWord: (wordId) => lessons.lessonOfWord(wordId),
  isHeadword: (word) => lessons.isHeadword(word),
  bandOfLesson: (lessonId) => lessons.bandOfLesson(lessonId),
  wordsOfBand: (band) => lessons.wordsOfBand(band),
  hasLessons: (band) => lessons.hasLessons(band),
  placementWordsOf: (band) => lessons.placementWordsOf(band),
  lessons: () => lessons.lessons(),
  chromeLessons: () => lessons.chromeLessons(),
  frameTokensOf: (wordId, frame) => lessons.frameTokensOf(wordId, frame),
  answerFormsOf: (wordId) => lessons.answerFormsOf(wordId),
  texts: () => lessons.texts(),
  textTokensOf: (textId, passage) => lessons.textTokensOf(textId, passage),
})

export const withNoLessons = (lessons: LessonLibrary): LessonLibrary => ({
  ...delegatingTo(lessons),
  lessons: () => [],
  chromeLessons: () => [],
})

export const withCopiesOfFirstText = (lessons: LessonLibrary, count: number): LessonLibrary => {
  const [first] = lessons.texts()
  assert(first !== undefined)
  return {
    ...delegatingTo(lessons),
    texts: () =>
      Array.from({ length: count }, (_, index) => ({ ...first, id: `text-${index + 1}` })),
    textTokensOf: (_, passage) => lessons.textTokensOf(first.id, passage),
  }
}

export const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

export const pausingFirstRead = (
  towns: ComposedStores['towns'],
  afterRead: () => Promise<void>,
): ComposedStores['towns'] => {
  let hasRead = false
  return {
    holdsTown: (playerId) => towns.holdsTown(playerId),
    occupiedSites: () => towns.occupiedSites(),
    save: (town) => towns.save(town),
    townOf: async (playerId) => {
      const read = await towns.townOf(playerId)
      if (!hasRead) {
        hasRead = true
        await afterRead()
      }
      return read
    },
  }
}

export const pausingFirstUnitOfWork = (
  unitOfWork: UnitOfWork<ComposedStores>,
  afterFirstRead: () => Promise<void>,
): UnitOfWork<ComposedStores> => {
  let transactions = 0
  return {
    transact: (work) => {
      transactions += 1
      const isFirst = transactions === 1
      return unitOfWork.transact((stores) =>
        work(
          isFirst ? { ...stores, towns: pausingFirstRead(stores.towns, afterFirstRead) } : stores,
        ),
      )
    },
  }
}

export const untilPlayerBlockedOrRead = async (secondRead: Promise<unknown>): Promise<void> => {
  let hasRead = false
  void secondRead.then(() => {
    hasRead = true
  })
  const observer = new Client({ connectionString: databaseUrl() })
  await observer.connect()
  try {
    for (let probes = 0; probes < lockProbeLimit; probes += 1) {
      if (hasRead || (await isWaitingOnALock(observer, [lockedPlayerReadQuery]))) {
        return
      }
    }
    throw new Error('The second start neither waited on the player lock nor finished')
  } finally {
    await observer.end()
  }
}

export type TownApp = ReturnType<typeof createApp>

export const townServer = (): ComposedServer =>
  composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)

export const overviewOf = async (response: Response): Promise<TownOverview> =>
  TownOverviewSchema.parse(await response.json())

export const refusalOf = async (response: Response): Promise<unknown> =>
  ApiErrorSchema.parse(await response.json())

export const amountsOf = (overview: TownOverview): Record<string, number> => ({
  money: overview.stocks.money.amount,
  food: overview.stocks.food.amount,
  power: overview.stocks.power.amount,
  material: overview.stocks.material.amount,
})

export const fillStocks = (): Promise<void> =>
  runSql('UPDATE towns SET money = 100000, food = 100000, power = 100000, material = 100000')

export type TownRequests = {
  readonly signUp: (email: string) => Promise<string>
  readonly foundTown: (cookie: string, body: unknown) => Promise<Response>
  readonly signUpWithTown: (email: string) => Promise<string>
  readonly readTown: (cookie: string) => Promise<Response>
  readonly startWork: (cookie: string, building: string) => Promise<Response>
  readonly stopWork: (cookie: string, building: string, level: number | string) => Promise<Response>
  readonly startLesson: (cookie: string, lessonId: string) => Promise<Response>
  readonly stopLesson: (cookie: string, lessonId: string) => Promise<Response>
}

export const townRequests = (appOf: () => TownApp): TownRequests => {
  const signUp = async (email: string): Promise<string> => {
    const response = await appOf().request('/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'hierro-y-lana', scaffold: 'es' }),
    })
    PlayerSchema.parse(await response.json())
    return sessionCookieOf(response)
  }

  const foundTown = (cookie: string, body: unknown): Promise<Response> =>
    Promise.resolve(appOf().request('/town', jsonRequest('POST', cookie, body)))

  const signUpWithTown = async (email: string): Promise<string> => {
    const cookie = await signUp(email)
    expect((await foundTown(cookie, { name: 'Maple Falls' })).status).toBe(200)
    return cookie
  }

  const readTown = (cookie: string): Promise<Response> =>
    Promise.resolve(appOf().request('/town', { headers: { cookie } }))

  const startWork = (cookie: string, building: string): Promise<Response> =>
    Promise.resolve(appOf().request('/town/work', jsonRequest('POST', cookie, { building })))

  const stopWork = (cookie: string, building: string, level: number | string): Promise<Response> =>
    Promise.resolve(
      appOf().request(`/town/work/${building}/${level}`, { method: 'DELETE', headers: { cookie } }),
    )

  const startLesson = (cookie: string, lessonId: string): Promise<Response> =>
    Promise.resolve(appOf().request('/town/lessons', jsonRequest('POST', cookie, { lessonId })))

  const stopLesson = (cookie: string, lessonId: string): Promise<Response> =>
    Promise.resolve(
      appOf().request(`/town/lessons/${lessonId}`, { method: 'DELETE', headers: { cookie } }),
    )
  return {
    signUp,
    foundTown,
    signUpWithTown,
    readTown,
    startWork,
    stopWork,
    startLesson,
    stopLesson,
  }
}
