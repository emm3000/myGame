import {
  refusalUnexpected,
  reportLoading,
  reportNewsClose,
  reportNewsClosed,
  reportNewsNone,
  reportNewsTitle,
  reportNoReviewsDue,
  reportReviewsDue,
  reportStartReviews,
  reportTitle,
  reviewNextReview,
  reviewTitle,
  schoolLessonReadWords,
  shellNavigationReport,
  shellNavigationTown,
  townTryAgain,
} from '@mygame/catalog'
import type { DueReview } from '@mygame/contracts'
import type { Report, TownNewsItem } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

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

const minutesAgo = (minutes: number): string => new Date(readAt - minutes * 60_000).toISOString()

const homesFinished: TownNewsItem = {
  kind: 'buildingWorkFinished',
  params: { building: 'homes', level: 2 },
  occurredAt: minutesAgo(30),
}

const farmFinished: TownNewsItem = {
  kind: 'buildingWorkFinished',
  params: { building: 'farm', level: 3 },
  occurredAt: minutesAgo(5),
}

const homesLine = 'Hogares: ahora en nivel 2.'
const farmLine = 'Granja: ahora en nivel 3.'

const homeRecognition: DueReview = {
  wordId: 'lesson-1-1',
  lessonId: 'lesson-1',
  dueAt: minutesAgo(2),
  mode: 'recognition',
  word: 'home',
  frame: 'We have a new home in this town.',
  choices: [
    { choiceId: 'choice-a', gloss: 'escuela' },
    { choiceId: 'choice-b', gloss: 'hogar' },
  ],
}

const reportOf = (overrides: Partial<Report>): Report => ({
  dueCount: 0,
  readFirst: [],
  nextDueAt: null,
  due: [],
  news: [],
  ...overrides,
})

const reviewsDue = reportOf({ dueCount: 3, due: [homeRecognition] })
const newsSinceClose = reportOf({ news: [farmFinished, homesFinished] })

const readingInTurn = (...reports: ReadonlyArray<Report>): ApiClient['report'] => {
  const report = vi.fn<ApiClient['report']>()
  for (const answer of reports) {
    report.mockResolvedValueOnce({ ok: true, value: answer })
  }
  return report.mockResolvedValue({ ok: true, value: reports.at(-1) ?? reportOf({}) })
}

const showReport = async (
  report: Report | ApiClient['report'],
  overrides: Partial<ApiClient> = {},
): Promise<ReturnType<typeof renderAppAt>> => {
  const rendered = renderAppAt(
    '/report',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      report: typeof report === 'function' ? report : readingInTurn(report),
      reviews: async () => ({
        ok: true,
        value: { due: [homeRecognition], nextDueAt: null, readAt: knownTown.readAt },
      }),
      ...overrides,
    }),
  )
  await passSeconds(0)
  return rendered
}

const reportRegion = (): HTMLElement => screen.getByRole('region', { name: reportTitle() })

const newsRegion = (): HTMLElement => screen.getByRole('region', { name: reportNewsTitle() })

const closeButton = (): HTMLElement => screen.getByRole('button', { name: reportNewsClose() })

it('reads the Report while it is on its way', async () => {
  await showReport(() => new Promise(() => undefined))

  expect(screen.getByRole('status').textContent).toBe(reportLoading())
})

it('reads a failed Report by its refusal with a way to read it again', async () => {
  const report = vi
    .fn<ApiClient['report']>()
    .mockResolvedValueOnce({ ok: false, refusal: 'Unexpected' })
    .mockResolvedValue({ ok: true, value: reviewsDue })
  await showReport(report)

  expect(screen.getByText(refusalUnexpected())).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByText(reportReviewsDue({ count: 3 }))).toBeDefined()
})

it('counts the reviews due with a way into them', async () => {
  await showReport(reviewsDue)

  expect(within(reportRegion()).getByText(reportReviewsDue({ count: 3 }))).toBeDefined()
  expect(
    within(reportRegion()).getByRole('link', { name: reportStartReviews() }).getAttribute('href'),
  ).toBe('/reviews')
})

it('offers no way into the reviews when none is due', async () => {
  await showReport(reportOf({}))

  expect(within(reportRegion()).getByText(reportNoReviewsDue())).toBeDefined()
  expect(within(reportRegion()).queryByRole('link', { name: reportStartReviews() })).toBeNull()
})

it('shows the instant of the next review when none is due', async () => {
  await showReport(reportOf({ nextDueAt: '2026-11-10T09:40:00.000Z' }))

  expect(within(reportRegion()).getByText(reviewNextReview())).toBeDefined()
  expect(within(reportRegion()).getByText('10:40')).toBeDefined()
})

it('shows no next review with no review ahead', async () => {
  await showReport(reportOf({}))

  expect(within(reportRegion()).queryByText(reviewNextReview())).toBeNull()
})

it('shows no next review beside the reviews due', async () => {
  await showReport({ ...reviewsDue, nextDueAt: '2026-11-10T09:40:00.000Z' })

  expect(within(reportRegion()).queryByText(reviewNextReview())).toBeNull()
})

const secondsAfterRead = (seconds: number): string =>
  new Date(readAt + seconds * 1000).toISOString()

const reportReads = (report: Report): ReturnType<typeof vi.fn<ApiClient['report']>> =>
  vi.fn<ApiClient['report']>().mockResolvedValue({ ok: true, value: report })

it('re-reads at the next review', async () => {
  const report = reportReads(reportOf({ nextDueAt: secondsAfterRead(30) }))
  await showReport(report)
  await passSeconds(29)
  const readsBefore = report.mock.calls.length

  await passSeconds(1)

  expect([readsBefore, report.mock.calls.length]).toEqual([1, 2])
})

it('draws the reviews the read at the next review answers', async () => {
  const report = reportReads(reportOf({ nextDueAt: secondsAfterRead(30) }))
  report.mockResolvedValueOnce({ ok: true, value: reportOf({ nextDueAt: secondsAfterRead(30) }) })
  report.mockResolvedValue({ ok: true, value: reviewsDue })
  await showReport(report)

  await passSeconds(30)

  expect(within(reportRegion()).getByText(reportReviewsDue({ count: '3' }))).toBeDefined()
})

it('reads once with reviews due', async () => {
  const report = reportReads({ ...reviewsDue, nextDueAt: secondsAfterRead(30) })
  await showReport(report)

  await passSeconds(60)

  expect(report).toHaveBeenCalledTimes(1)
})

it('reads once with no review ahead', async () => {
  const report = reportReads(reportOf({}))
  await showReport(report)

  await passSeconds(60)

  expect(report).toHaveBeenCalledTimes(1)
})

it('reads once when the next review already passed on this device', async () => {
  const report = reportReads(reportOf({ nextDueAt: secondsAfterRead(-30) }))
  await showReport(report)

  await passSeconds(60)

  expect(report).toHaveBeenCalledTimes(1)
})

it('waits for a next review past the longest timer', async () => {
  const report = reportReads(reportOf({ nextDueAt: secondsAfterRead(30 * 24 * 3600) }))
  await showReport(report)

  await passSeconds(60)

  expect(report).toHaveBeenCalledTimes(1)
})

it('opens the unread lesson from the Report', async () => {
  await showReport({ ...reviewsDue, readFirst: ['lesson-2', 'lesson-3'] })

  const link = screen.getByRole('link', { name: schoolLessonReadWords() })

  expect(link.getAttribute('href')).toBe('/school/lesson-2')
  expect(screen.queryByRole('link', { name: reportStartReviews() })).toBeNull()
})

it('opens the reviews from the Report', async () => {
  await showReport(reviewsDue)

  fireEvent.click(screen.getByRole('link', { name: reportStartReviews() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: reviewTitle() })).toBeDefined()
  expect(screen.getByText('home')).toBeDefined()
})

it('lists the reviews due before the news', async () => {
  await showReport(reportOf({ dueCount: 3, due: [homeRecognition], news: [homesFinished] }))

  const count = screen.getByText(reportReviewsDue({ count: 3 }))
  const news = newsRegion()

  expect(count.compareDocumentPosition(news) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('writes each news item with its instant, newest first as answered', async () => {
  await showReport(newsSinceClose)

  const rows = within(newsRegion()).getAllByRole('listitem')

  expect(rows.map((row) => row.textContent)).toEqual([
    `Hoy, 09:55${farmLine}`,
    `Hoy, 09:30${homesLine}`,
  ])
})

it('says there is no news when nothing happened since the last close', async () => {
  await showReport(reportOf({}))

  expect(within(newsRegion()).getByText(reportNewsNone())).toBeDefined()
  expect(screen.queryByRole('button', { name: reportNewsClose() })).toBeNull()
})

it('hides the news once closed', async () => {
  await showReport(newsSinceClose)

  fireEvent.click(closeButton())
  await passSeconds(0)

  expect(within(newsRegion()).getByText(reportNewsClosed())).toBeDefined()
  expect(within(newsRegion()).queryByText(homesLine)).toBeNull()
})

it('moves focus to the news title once closed', async () => {
  await showReport(newsSinceClose)

  fireEvent.click(closeButton())
  await passSeconds(0)

  expect(document.activeElement).toBe(
    within(newsRegion()).getByRole('heading', { name: reportNewsTitle() }),
  )
})

it('shows only the news since the last close', async () => {
  const router = await showReport(readingInTurn(newsSinceClose, reportOf({ news: [farmFinished] })))

  fireEvent.click(closeButton())
  await passSeconds(0)
  fireEvent.click(screen.getByRole('link', { name: shellNavigationTown() }))
  await passSeconds(0)
  await act(() => router.navigate({ to: '/report' }))
  await passSeconds(0)

  expect(within(newsRegion()).getByText(farmLine)).toBeDefined()
  expect(within(newsRegion()).queryByText(homesLine)).toBeNull()
})

it('closes once on a double click', async () => {
  let answer: (refusal: ApiRefusal | undefined) => void = () => undefined
  const closeReport = vi.fn(
    () =>
      new Promise<ApiRefusal | undefined>((resolve) => {
        answer = resolve
      }),
  )
  await showReport(newsSinceClose, { closeReport })

  act(() => {
    fireEvent.click(closeButton())
    fireEvent.click(closeButton())
  })
  await act(async () => answer(undefined))

  expect(closeReport).toHaveBeenCalledTimes(1)
})

it('keeps the news with the refusal when the close is refused', async () => {
  await showReport(newsSinceClose, { closeReport: async () => 'Unexpected' })

  closeButton().focus()
  fireEvent.click(closeButton())
  await passSeconds(0)

  expect(within(newsRegion()).getByText(homesLine)).toBeDefined()
  expect(within(newsRegion()).getByText(refusalUnexpected())).toBeDefined()
  expect(document.activeElement).toBe(closeButton())
})

it('marks the Report as the current screen in the navigation', async () => {
  await showReport(reportOf({}))

  const report = screen.getByRole('link', { name: shellNavigationReport() })
  const town = screen.getByRole('link', { name: shellNavigationTown() })

  expect(report.getAttribute('aria-current')).toBe('page')
  expect(town.getAttribute('aria-current')).toBeNull()
})

const heldClose = (): {
  readonly closeReport: ApiClient['closeReport']
  readonly answer: (refusal: ApiRefusal | undefined) => void
} => {
  let resolveClose: (refusal: ApiRefusal | undefined) => void = () => undefined
  return {
    closeReport: () =>
      new Promise<ApiRefusal | undefined>((resolve) => {
        resolveClose = resolve
      }),
    answer: (refusal) => resolveClose(refusal),
  }
}

it('waits on the close while it is on its way', async () => {
  const { closeReport } = heldClose()
  await showReport(newsSinceClose, { closeReport })

  fireEvent.click(closeButton())
  await passSeconds(0)

  expect(closeButton().getAttribute('aria-busy')).toBe('true')
})

it('closes on a second click after a refused close, dropping the refusal while it waits', async () => {
  const held = heldClose()
  const closeReport = vi
    .fn<ApiClient['closeReport']>()
    .mockResolvedValueOnce('Unexpected')
    .mockImplementationOnce(held.closeReport)
  await showReport(newsSinceClose, { closeReport })

  fireEvent.click(closeButton())
  await passSeconds(0)
  expect(within(newsRegion()).getByText(refusalUnexpected())).toBeDefined()

  fireEvent.click(closeButton())
  await passSeconds(0)
  expect(within(newsRegion()).queryByText(refusalUnexpected())).toBeNull()

  await act(async () => held.answer(undefined))
  expect(within(newsRegion()).getByText(reportNewsClosed())).toBeDefined()
})

it("draws a job's pay under its line", async () => {
  await showReport(
    reportOf({
      news: [
        {
          kind: 'jobBack',
          params: {
            site: { region: 1, area: 3, site: 12 },
            pay: { money: 0, food: 40, power: 0, material: 0 },
          },
          occurredAt: minutesAgo(1),
        },
      ],
    }),
  )

  expect(within(newsRegion()).getByText('Pago: 40 de comida')).toBeDefined()
})

it('groups the thousands of the reviews due', async () => {
  await showReport(reportOf({ dueCount: 1200, due: [homeRecognition] }))

  expect(within(reportRegion()).getByText('Repasos pendientes: 1 200')).toBeDefined()
})
