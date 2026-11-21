import { en, es } from '@mygame/catalog'
import type { TownNewsItem, TownOverview } from '@mygame/contracts'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { linesDrawnAlone } from '../town/lineDrawnAlone.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

const servingNewsIn = (
  language: CopyLanguage,
  items: ReadonlyArray<TownNewsItem> = [],
): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: { ...knownTown, ...language } }),
    townNews: async () => ({ ok: true, value: { items: [...items] } }),
  })

const linesReading = (text: string): Promise<ReadonlyArray<HTMLElement>> =>
  screen.findAllByText((_, element) => element?.textContent === text)

const farmFinished: TownNewsItem = {
  kind: 'buildingWorkFinished',
  params: { building: 'farm', level: 3 },
  occurredAt: knownTown.readAt,
}

const site = { region: 1, area: 3, site: 12 }

const jobBack: TownNewsItem = {
  kind: 'jobBack',
  params: { site, pay: { money: 0, food: 40, power: 0, material: 0 } },
  occurredAt: knownTown.readAt,
}

const newsTitled = (name: string): Promise<HTMLElement> =>
  screen.findByRole('heading', { level: 1, name })

it('titles the news in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/news', servingNewsIn(spanishPhase))

  expect(await newsTitled(es.newsTitle())).toBeDefined()
})

it('titles the news in English over Spanish in the both phase', async () => {
  renderAppAt('/news', servingNewsIn(bothPhase))

  expect(await newsTitled(`${en.newsTitle()} ${es.newsTitle()}`)).toBeDefined()
})

it('titles the news in English alone in the English phase', async () => {
  renderAppAt('/news', servingNewsIn(englishPhase))

  expect(await newsTitled(en.newsTitle())).toBeDefined()
})

it('titles the news in English under none', async () => {
  renderAppAt('/news', servingNewsIn(noScaffold))

  expect(await newsTitled(en.newsTitle())).toBeDefined()
})

it('writes the news of a finished place in English alone in the English phase', async () => {
  renderAppAt('/news', servingNewsIn(englishPhase, [farmFinished]))

  const line = en.reportNewsBuildingWorkFinished({ place: en.namesPlacesFarm(), level: 3 })

  expect(await linesDrawnAlone(line, 'en')).toHaveLength(1)
})

it('writes the pay of a job in English over Spanish in the both phase', async () => {
  renderAppAt('/news', servingNewsIn(bothPhase, [jobBack]))

  const pay = (catalog: typeof en | typeof es): string =>
    catalog.reportNewsPay({
      amounts: catalog.townAmount({ amount: '40', resource: catalog.namesTownResourcesFood() }),
    })

  expect(await linesReading(`${pay(en)} ${pay(es)}`)).not.toHaveLength(0)
})

it('writes no news in English under none', async () => {
  renderAppAt('/news', servingNewsIn(noScaffold))

  expect(await linesReading(en.newsNone())).not.toHaveLength(0)
})

it('writes no news in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/news', servingNewsIn(spanishPhase))

  expect(await linesDrawnAlone(es.newsNone(), 'es')).toHaveLength(1)
})
