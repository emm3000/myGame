import {
  newsLoading,
  newsNone,
  newsTitle,
  refusalUnexpected,
  reportNewsAll,
  townTryAgain,
} from '@mygame/catalog'
import type { TownNewsFeed, TownNewsItem } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { neverAnswering, refusedRead } from '../design-system/loadingSkeleton.testSupport'

const readAt = Date.parse(knownTown.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const at = (time: string): string => `2026-11-10T${time}:00.000Z`

const site = { region: 1, area: 3, site: 12 }
const pay = { money: 0, food: 40, power: 0, material: 0 }

const everyKind: ReadonlyArray<TownNewsItem> = [
  { kind: 'becameCity', occurredAt: at('08:59') },
  { kind: 'cleanUpFailed', params: { site }, occurredAt: at('08:58') },
  { kind: 'cleanUpDone', params: { site, reward: pay }, occurredAt: at('08:57') },
  { kind: 'jobCalledBack', params: { site, pay }, occurredAt: at('08:56') },
  { kind: 'jobBack', params: { site, pay }, occurredAt: at('08:55') },
  {
    kind: 'hiringStopped',
    params: { hire: 'worker', delivered: 2, stopped: 3, refund: pay },
    occurredAt: at('08:54'),
  },
  { kind: 'hiringDelivered', params: { hire: 'truck', count: 3 }, occurredAt: at('08:53') },
  {
    kind: 'skillEarned',
    params: { lessonId: 'lesson-1', resource: 'food', ratePercent: 5 },
    occurredAt: at('08:52'),
  },
  { kind: 'lessonStopped', params: { lessonId: 'lesson-2' }, occurredAt: at('08:51') },
  { kind: 'lessonStudied', params: { lessonId: 'lesson-1' }, occurredAt: at('08:50') },
  {
    kind: 'buildingWorkStopped',
    params: { building: 'homes', level: 3, refund: pay },
    occurredAt: at('08:49'),
  },
  {
    kind: 'buildingWorkFinished',
    params: { building: 'farm', level: 2 },
    occurredAt: at('08:48'),
  },
]

const farmFinished: TownNewsItem = {
  kind: 'buildingWorkFinished',
  params: { building: 'farm', level: 3 },
  occurredAt: at('08:30'),
}

const homesFinished: TownNewsItem = {
  kind: 'buildingWorkFinished',
  params: { building: 'homes', level: 2 },
  occurredAt: at('08:45'),
}

const feedOf = (items: ReadonlyArray<TownNewsItem>): TownNewsFeed => ({ items: [...items] })

const answering = (feed: TownNewsFeed): ApiClient['townNews'] =>
  vi.fn<ApiClient['townNews']>().mockResolvedValue({ ok: true, value: feed })

const showNews = async (
  townNews: ApiClient['townNews'],
  overrides: Partial<ApiClient> = {},
): Promise<ReturnType<typeof renderAppAt>> => {
  const rendered = renderAppAt(
    '/news',
    stubApiClient({ currentPlayer: async () => knownPlayer, townNews, ...overrides }),
  )
  await passSeconds(0)
  return rendered
}

const newsRegion = (): HTMLElement => screen.getByRole('region', { name: newsTitle() })

const rowTexts = (): ReadonlyArray<string | null> =>
  within(newsRegion())
    .getAllByRole('listitem')
    .map((row) => row.textContent)

it('writes one line per event kind with its instant', async () => {
  await showNews(answering(feedOf(everyKind)))

  expect(rowTexts()).toEqual([
    'Hoy, 09:59Tu pueblo ahora es una ciudad.',
    'Hoy, 09:58Tu equipo no pudo limpiar los residuos de la región 1, zona 3, sitio 12.',
    'Hoy, 09:57Tu equipo limpió los residuos de la región 1, zona 3, sitio 12.Pago: 40 de comida',
    'Hoy, 09:56Llamaste de vuelta a tu equipo de la región 1, zona 3, sitio 12.Pago: 40 de comida',
    'Hoy, 09:55Tu equipo volvió de la región 1, zona 3, sitio 12.Pago: 40 de comida',
    'Hoy, 09:54Paraste la contratación de trabajadores: llegaron 2 de 5.',
    'Hoy, 09:53Contrataste 3 camiones.',
    'Hoy, 09:52Ganaste una habilidad de comida: +5 % de comida.',
    'Hoy, 09:51Paraste el estudio de una lección.',
    'Hoy, 09:50Estudiaste una lección.',
    'Hoy, 09:49Paraste la obra: Hogares, nivel 3.',
    'Hoy, 09:48Granja: ahora en nivel 2.',
  ])
})

it('lists the newest first, in the order the server answers', async () => {
  await showNews(answering(feedOf([homesFinished, farmFinished])))

  expect(rowTexts()).toEqual([
    'Hoy, 09:45Hogares: ahora en nivel 2.',
    'Hoy, 09:30Granja: ahora en nivel 3.',
  ])
})

it('opens the news from its row on the Report', async () => {
  const router = renderAppAt(
    '/report',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      townNews: answering(feedOf([homesFinished])),
    }),
  )
  await passSeconds(0)

  fireEvent.click(screen.getByRole('link', { name: reportNewsAll() }))
  await passSeconds(0)

  expect(router.state.location.pathname).toBe('/news')
  expect(screen.getByRole('heading', { level: 1, name: newsTitle() })).toBeDefined()
  expect(within(newsRegion()).getByText('Hogares: ahora en nivel 2.')).toBeDefined()
})

it('says there is no news when the town has none', async () => {
  await showNews(answering(feedOf([])))

  expect(within(newsRegion()).getByText(newsNone())).toBeDefined()
  expect(within(newsRegion()).queryByRole('list')).toBeNull()
})

it('keeps the loading line in a status region while the news reads', async () => {
  await showNews(neverAnswering)

  expect(screen.getByRole('status').textContent).toBe(newsLoading())
})

it('reads the refusal of a failed read', async () => {
  await showNews(refusedRead)

  expect(within(newsRegion()).getByText(refusalUnexpected())).toBeDefined()
})

it('reads the news again on a retry after a failed read', async () => {
  const townNews = vi
    .fn<ApiClient['townNews']>()
    .mockResolvedValueOnce({ ok: false, refusal: 'Unexpected' })
    .mockResolvedValue({ ok: true, value: feedOf([homesFinished]) })
  await showNews(townNews)

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(within(newsRegion()).getByText('Hogares: ahora en nivel 2.')).toBeDefined()
})

it('sends a player with no town to the town home', async () => {
  const router = await showNews(async () => ({ ok: false, refusal: 'TownNotFound' }), {
    town: async () => ({ ok: false, refusal: 'TownNotFound' }),
  })

  expect(router.state.location.pathname).toBe('/')
})
