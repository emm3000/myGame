import { en, es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { screen, within } from '@testing-library/react'
import { assert, expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

const servingTownIn = (language: CopyLanguage, town: Partial<TownOverview> = {}): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: { ...knownTown, ...language, ...town } }),
  })

const shellHeader = async (): Promise<HTMLElement> => {
  const [header] = await screen.findAllByRole('banner')
  assert(header !== undefined)
  return header
}

const backLinkNamed = async (name: string): Promise<HTMLElement> =>
  within(await shellHeader()).findByRole('link', { name })

const townHeading = (): Promise<HTMLElement> =>
  screen.findByRole('heading', { level: 1, name: new RegExp(knownTown.name) })

const ringNamed = (name: string): Promise<HTMLElement> => screen.findByRole('img', { name })

const holdingThreeOfFive: Partial<TownOverview> = {
  learning: { ...knownTown.learning, retainedWords: { count: 3, total: 5 } },
}

it('names the way back to the town in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/report', servingTownIn(spanishPhase))

  expect(await backLinkNamed(es.shellNavigationTown())).toBeDefined()
})

it('names the way back to the town in English over Spanish in the both phase', async () => {
  renderAppAt('/report', servingTownIn(bothPhase))

  expect(
    await backLinkNamed(`${en.shellNavigationTown()} ${es.shellNavigationTown()}`),
  ).toBeDefined()
})

it('names the way back to the town in English alone in the English phase', async () => {
  renderAppAt('/report', servingTownIn(englishPhase))

  expect(await backLinkNamed(en.shellNavigationTown())).toBeDefined()
})

it('names the way back to the town in English under none', async () => {
  renderAppAt('/report', servingTownIn(noScaffold))

  expect(await backLinkNamed(en.shellNavigationTown())).toBeDefined()
})

it('labels a city in English over Spanish in the header in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase, { label: 'city' }))

  expect((await townHeading()).textContent).toBe(
    `${knownTown.name} · ${en.townLabelCity()} ${es.townLabelCity()}`,
  )
})

it('labels the town in English alone in the header under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect((await townHeading()).textContent).toBe(`${knownTown.name} · ${en.townLabelTown()}`)
})

it('names the retained words in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase, holdingThreeOfFive))

  expect(await ringNamed(es.shellRetainedWords({ count: 3, total: 5 }))).toBeDefined()
})

it('names the retained words in English and in Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase, holdingThreeOfFive))

  const english = en.shellRetainedWords({ count: 3, total: 5 })
  const spanish = es.shellRetainedWords({ count: 3, total: 5 })

  expect(await ringNamed(`${english} ${spanish}`)).toBeDefined()
})

it('names the retained words in English alone in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase, holdingThreeOfFive))

  expect(await ringNamed(en.shellRetainedWords({ count: 3, total: 5 }))).toBeDefined()
})

it('names the retained words in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold, holdingThreeOfFive))

  expect(await ringNamed(en.shellRetainedWords({ count: 3, total: 5 }))).toBeDefined()
})

it('marks the retained words as Spanish in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase, holdingThreeOfFive))

  const ring = await ringNamed(es.shellRetainedWords({ count: 3, total: 5 }))

  expect(ring.getAttribute('lang')).toBe('es')
})

it('marks the retained words as English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold, holdingThreeOfFive))

  const ring = await ringNamed(en.shellRetainedWords({ count: 3, total: 5 }))

  expect(ring.getAttribute('lang')).toBe('en')
})

it('draws the phase the player signed in with while the town is still loading', async () => {
  renderAppAt(
    '/report',
    stubApiClient({
      currentPlayer: async () => ({ ...knownPlayer, ...englishPhase }),
      town: () => new Promise(() => {}),
    }),
  )

  expect(await backLinkNamed(en.shellNavigationTown())).toBeDefined()
})
