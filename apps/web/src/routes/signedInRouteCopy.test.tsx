import { en, es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
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

const neverAnswering = <Answer,>(): Promise<Answer> => new Promise(() => undefined)

const servingTownIn = (language: CopyLanguage, overrides: Partial<ApiClient> = {}): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...language } }),
    ...overrides,
  })

const signedInWhileTownLoads = (language: CopyLanguage): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: neverAnswering,
  })

const loadingLine = async (): Promise<string | null> =>
  (await screen.findByRole('status')).textContent

it('reads the town in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', signedInWhileTownLoads(spanishPhase))

  expect(await loadingLine()).toBe(es.townLoading())
})

it('reads the town in English under none', async () => {
  renderAppAt('/', signedInWhileTownLoads(noScaffold))

  expect(await loadingLine()).toBe(en.townLoading())
})

it('reads the school in English over Spanish in the both phase', async () => {
  renderAppAt('/school', signedInWhileTownLoads(bothPhase))

  expect(await loadingLine()).toBe(`${en.townLoading()} ${es.townLoading()}`)
})

it('reads a lesson in English under none', async () => {
  renderAppAt('/school/lesson-1', signedInWhileTownLoads(noScaffold))

  expect(await loadingLine()).toBe(en.townLoading())
})

it('reads a text in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/school/texts/text-1', servingTownIn(spanishPhase, { text: neverAnswering }))

  expect(await loadingLine()).toBe(es.townLoading())
})

it('reads the news in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/news', servingTownIn(spanishPhase, { townNews: neverAnswering }))

  expect(await loadingLine()).toBe(es.newsLoading())
})

it('reads the news in English under none', async () => {
  renderAppAt('/news', servingTownIn(noScaffold, { townNews: neverAnswering }))

  expect(await loadingLine()).toBe(en.newsLoading())
})

it('reads the Report in English alone in the English phase', async () => {
  renderAppAt('/report', servingTownIn(englishPhase, { report: neverAnswering }))

  expect(await loadingLine()).toBe(en.reportLoading())
})

it('reads the Report in English under none', async () => {
  renderAppAt('/report', servingTownIn(noScaffold, { report: neverAnswering }))

  expect(await loadingLine()).toBe(en.reportLoading())
})

it('keeps the way to the settings in Spanish in the English phase', async () => {
  renderAppAt('/report', servingTownIn(englishPhase, { report: neverAnswering }))

  expect(await screen.findByRole('link', { name: es.settingsTitle() })).toBeDefined()
})

it('names the way to the settings in English under none', async () => {
  renderAppAt('/report', servingTownIn(noScaffold, { report: neverAnswering }))

  expect(await screen.findByRole('link', { name: en.settingsTitle() })).toBeDefined()
})

it('keeps the placement loading line in Spanish in the English phase', async () => {
  renderAppAt('/placement', servingTownIn(englishPhase, { placement: neverAnswering }))

  expect(await loadingLine()).toBe(es.placementLoading())
})

it('reads the placement in English under none', async () => {
  renderAppAt('/placement', servingTownIn(noScaffold, { placement: neverAnswering }))

  expect(await loadingLine()).toBe(en.placementLoading())
})

it('keeps the check loading line in Spanish in the English phase', async () => {
  renderAppAt('/school/check/1/8', servingTownIn(englishPhase, { holdoutChecks: neverAnswering }))

  expect(await loadingLine()).toBe(es.holdoutCheckLoading())
})

it('reads the check in English under none', async () => {
  renderAppAt('/school/check/1/8', servingTownIn(noScaffold, { holdoutChecks: neverAnswering }))

  expect(await loadingLine()).toBe(en.holdoutCheckLoading())
})
