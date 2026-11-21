import { en, es } from '@mygame/catalog'
import type { Report, TownOverview } from '@mygame/contracts'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

const reportOf = (overrides: Partial<Report>): Report => ({
  dueCount: 0,
  readFirst: [],
  nextDueAt: null,
  due: [],
  news: [],
  ...overrides,
})

const threeReviewsDue = reportOf({ dueCount: 3 })

const withNews = reportOf({
  news: [
    {
      kind: 'buildingWorkFinished',
      params: { building: 'homes', level: 2 },
      occurredAt: knownTown.readAt,
    },
  ],
})

const servingReportIn = (language: CopyLanguage, report: Report): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...language } }),
    report: async () => ({ ok: true, value: report }),
  })

const reportTitled = (name: string): Promise<HTMLElement> =>
  screen.findByRole('heading', { level: 1, name })

it('titles the Report in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/report', servingReportIn(spanishPhase, threeReviewsDue))

  expect(await reportTitled(es.reportTitle())).toBeDefined()
})

it('titles the Report in English over Spanish in the both phase', async () => {
  renderAppAt('/report', servingReportIn(bothPhase, threeReviewsDue))

  expect(await reportTitled(`${en.reportTitle()} ${es.reportTitle()}`)).toBeDefined()
})

it('titles the Report in English alone in the English phase', async () => {
  renderAppAt('/report', servingReportIn(englishPhase, threeReviewsDue))

  expect(await reportTitled(en.reportTitle())).toBeDefined()
})

it('titles the Report in English under none', async () => {
  renderAppAt('/report', servingReportIn(noScaffold, threeReviewsDue))

  expect(await reportTitled(en.reportTitle())).toBeDefined()
})

it('counts the reviews due in English over Spanish in the both phase', async () => {
  renderAppAt('/report', servingReportIn(bothPhase, threeReviewsDue))

  const english = en.reportReviewsDue({ count: 3 })
  const spanish = es.reportReviewsDue({ count: 3 })

  expect(
    await screen.findByRole('heading', { level: 2, name: `${english} ${spanish}` }),
  ).toBeDefined()
})

it('names the way into the reviews in English under none', async () => {
  renderAppAt('/report', servingReportIn(noScaffold, threeReviewsDue))

  expect(await screen.findByRole('link', { name: en.reportStartReviews() })).toBeDefined()
})

it('names the news and its close in English alone in the English phase', async () => {
  renderAppAt('/report', servingReportIn(englishPhase, withNews))

  expect(await screen.findByRole('button', { name: en.reportNewsClose() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 2, name: en.reportNewsTitle() })).toBeDefined()
  expect(screen.getByRole('link', { name: en.reportNewsAll() })).toBeDefined()
})

it('marks the Report title as English in the English phase', async () => {
  renderAppAt('/report', servingReportIn(englishPhase, threeReviewsDue))

  const title = await reportTitled(en.reportTitle())

  expect(title.querySelector('[lang="en"]')?.textContent).toBe(en.reportTitle())
})

it('says no review is due in English under none', async () => {
  renderAppAt('/report', servingReportIn(noScaffold, reportOf({})))

  expect(await screen.findByText(en.reportNoReviewsDue())).toBeDefined()
})

it('says there is no news in English over Spanish in the both phase', async () => {
  renderAppAt('/report', servingReportIn(bothPhase, reportOf({})))

  expect(await screen.findByText(en.reportNewsNone())).toBeDefined()
  expect(screen.getByText(es.reportNewsNone())).toBeDefined()
})
