import { en, es } from '@mygame/catalog'
import type { RegionMap, ResourceAmounts, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownAreaMap,
  knownPlayer,
  knownTown,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import type { CopyLanguage } from '../copy/playerCopyOf'
import { shownLinesDrawnAlone } from '../town/lineDrawnAlone.testSupport'

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

const readAt = Date.parse(knownTown.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const showIn = async (
  path: string,
  language: CopyLanguage,
  town: Partial<TownOverview> = {},
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    path,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: { ...knownTown, ...language, ...town } }),
      regionMap: async () => ({ ok: true, value: knownAreaMap }),
      ...overrides,
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const both = (english: string, spanish: string): string => `${english} ${spanish}`

const languagesIn = (
  scope: HTMLElement,
  english: string,
  spanish: string,
): ReadonlyArray<string | null> => [
  within(scope).getByText(english).getAttribute('lang'),
  within(scope).getByText(spanish).getAttribute('lang'),
]

const englishOverSpanish = ['en', 'es']

const teamAtHome: Partial<TownOverview> = {
  hiring: { ...knownTown.hiring, hires: { worker: 3, truck: 1 } },
}

const jobWorking: Partial<TownOverview> = {
  job: {
    kind: 'job',
    site: { region: 1, area: 1, site: 2 },
    team: { worker: 2, truck: 0 },
    hours: 1,
    pay: { money: 0, food: 40, power: 0, material: 20 },
    phase: 'working',
    sentAt: instantAfter(-600),
    arrivesAt: instantAfter(-300),
    leavesAt: instantAfter(3300),
    returnsAt: instantAfter(3900),
    calledBackAt: null,
  },
}

const mapTitle = (name: string): HTMLElement => screen.getByRole('heading', { level: 1, name })

const areaHeading = (name: string): HTMLElement => screen.getByRole('heading', { level: 2, name })

it('titles the map and its area in Spanish alone in the Spanish phase', async () => {
  await showIn('/map', spanishPhase)

  expect(mapTitle(es.mapTitle())).toBeDefined()
  expect(areaHeading(es.mapArea({ area: 1 }))).toBeDefined()
})

it('titles the map and its area in English over Spanish in the both phase', async () => {
  await showIn('/map', bothPhase)

  const title = mapTitle(both(en.mapTitle(), es.mapTitle()))
  const area = areaHeading(both(en.mapArea({ area: 1 }), es.mapArea({ area: 1 })))

  expect(languagesIn(title, en.mapTitle(), es.mapTitle())).toEqual(englishOverSpanish)
  expect(languagesIn(area, en.mapArea({ area: 1 }), es.mapArea({ area: 1 }))).toEqual(
    englishOverSpanish,
  )
})

it('titles the map and its area in English alone in the English phase', async () => {
  await showIn('/map', englishPhase)

  expect(mapTitle(en.mapTitle())).toBeDefined()
  expect(areaHeading(en.mapArea({ area: 1 }))).toBeDefined()
})

it('titles the map and its area in English under none', async () => {
  await showIn('/map', noScaffold)

  expect(mapTitle(en.mapTitle())).toBeDefined()
  expect(areaHeading(en.mapArea({ area: 1 }))).toBeDefined()
})

it('names a free site and its send button in English over Spanish in the both phase', async () => {
  await showIn('/map', bothPhase)

  const row = screen.getByRole('listitem', {
    name: both(en.mapSite({ site: 2 }), es.mapSite({ site: 2 })),
  })
  const send = within(row).getByRole('button', {
    name: both(en.mapSendTeamTo({ site: 2 }), es.mapSendTeamTo({ site: 2 })),
  })

  expect(languagesIn(row, en.mapSite({ site: 2 }), es.mapSite({ site: 2 }))).toEqual(
    englishOverSpanish,
  )
  expect(languagesIn(send, en.mapSendTeam(), es.mapSendTeam())).toEqual(englishOverSpanish)
})

it('names a free site and its send button in English under none', async () => {
  await showIn('/map', noScaffold)

  const row = screen.getByRole('listitem', { name: en.mapSite({ site: 2 }) })

  expect(within(row).getByRole('button', { name: en.mapSendTeamTo({ site: 2 }) })).toBeDefined()
})

it('marks the terrain as Spanish in the Spanish phase', async () => {
  await showIn('/map', spanishPhase)

  expect(screen.getByText(es.namesTerrainsFields()).getAttribute('lang')).toBe('es')
})

it('marks the terrain as English under none', async () => {
  await showIn('/map', noScaffold)

  expect(screen.getByText(en.namesTerrainsFields()).getAttribute('lang')).toBe('en')
})

it('labels the job fields and the send action in English over Spanish in the both phase', async () => {
  await showIn('/map', bothPhase, teamAtHome)

  fireEvent.click(
    screen.getByRole('button', {
      name: both(en.mapSendTeamTo({ site: 2 }), es.mapSendTeamTo({ site: 2 })),
    }),
  )
  const form = screen.getByRole('region', {
    name: both(en.mapJobTitle({ site: 2 }), es.mapJobTitle({ site: 2 })),
  })

  const send = within(form).getByRole('button', { name: both(en.mapJobSend(), es.mapJobSend()) })

  expect(within(form).getByLabelText(both(en.mapJobWorkers(), es.mapJobWorkers()))).toBeDefined()
  expect(within(form).getByLabelText(both(en.mapJobHours(), es.mapJobHours()))).toBeDefined()
  expect(languagesIn(form, en.mapJobWorkers(), es.mapJobWorkers())).toEqual(englishOverSpanish)
  expect(languagesIn(form, en.mapJobHours(), es.mapJobHours())).toEqual(englishOverSpanish)
  expect(languagesIn(send, en.mapJobSend(), es.mapJobSend())).toEqual(englishOverSpanish)
})

it('counts a working job down in English words in the English phase', async () => {
  await showIn('/map', englishPhase, jobWorking)

  const jobOut = screen.getByRole('region', { name: en.mapJobOutTitle() })

  expect(within(jobOut).getByRole('timer').textContent).toContain(en.mapJobOutWorking())
  expect(within(jobOut).getByRole('button', { name: en.mapJobOutCallBack() })).toBeDefined()
})

it('writes a refused map read in English under none', async () => {
  await showIn(
    '/map/9',
    noScaffold,
    {},
    {
      regionMap: async () => ({
        ok: false,
        refusal: 'AreaNotFound',
        error: { kind: 'AreaNotFound' },
      }),
    },
  )

  expect(screen.getByRole('alert').textContent).toBe(en.refusalAreaNotFound())
})

it('keeps a refused map read in Spanish in the English phase', async () => {
  await showIn(
    '/map/9',
    englishPhase,
    {},
    {
      regionMap: async () => ({
        ok: false,
        refusal: 'AreaNotFound',
        error: { kind: 'AreaNotFound' },
      }),
    },
  )

  expect(screen.getByRole('alert').textContent).toBe(es.refusalAreaNotFound())
})

it('names the way back from a missing area in English over Spanish in the both phase', async () => {
  await showIn('/map/zero', bothPhase)

  const back = screen.getByRole('link', {
    name: both(en.mapBackToOwnArea(), es.mapBackToOwnArea()),
  })

  expect(languagesIn(back, en.mapBackToOwnArea(), es.mapBackToOwnArea())).toEqual(
    englishOverSpanish,
  )
})

it('names the way back from a missing area in English under none', async () => {
  await showIn('/map/zero', noScaffold)

  expect(screen.getByRole('link', { name: en.mapBackToOwnArea() })).toBeDefined()
})

it('keeps the loading line of the map in English over Spanish in the both phase', async () => {
  await showIn('/map', bothPhase, {}, { regionMap: () => new Promise(() => undefined) })

  const loading = screen.getByRole('status')

  expect(loading.textContent).toBe(both(en.mapLoading(), es.mapLoading()))
  expect(languagesIn(loading, en.mapLoading(), es.mapLoading())).toEqual(englishOverSpanish)
})

it('offers the map on the town home in English over Spanish in the both phase', async () => {
  await showIn('/', bothPhase)

  const heading = screen.getByRole('heading', {
    level: 3,
    name: both(en.mapTitle(), es.mapTitle()),
  })
  const link = screen.getByRole('link', { name: both(en.mapRowLink(), es.mapRowLink()) })

  expect(languagesIn(heading, en.mapTitle(), es.mapTitle())).toEqual(englishOverSpanish)
  expect(languagesIn(link, en.mapRowLink(), es.mapRowLink())).toEqual(englishOverSpanish)
})

const foodPay: ResourceAmounts = { money: 0, food: 40, power: 0, material: 0 }

const englishFoodPay = en.mapJobPay({
  amounts: en.townAmount({ amount: '40', resource: en.namesTownResourcesFood() }),
})

const spanishFoodPay = es.mapJobPay({
  amounts: es.townAmount({ amount: '40', resource: es.namesTownResourcesFood() }),
})

it('writes the pay of a job in English over Spanish in the both phase', async () => {
  await showIn('/map', bothPhase, teamAtHome, {
    quoteJob: async () => ({ ok: true, value: { pay: foodPay } }),
  })

  fireEvent.click(
    screen.getByRole('button', {
      name: both(en.mapSendTeamTo({ site: 2 }), es.mapSendTeamTo({ site: 2 })),
    }),
  )
  const form = screen.getByRole('region', {
    name: both(en.mapJobTitle({ site: 2 }), es.mapJobTitle({ site: 2 })),
  })
  fireEvent.change(within(form).getByLabelText(both(en.mapJobWorkers(), es.mapJobWorkers())), {
    target: { value: '2' },
  })
  await act(() => vi.advanceTimersByTimeAsync(0))

  expect(languagesIn(form, englishFoodPay, spanishFoodPay)).toEqual(englishOverSpanish)
})

const wasteMap: RegionMap = {
  ...knownAreaMap,
  sites: [...knownAreaMap.sites, { site: 4, town: null, waste: { size: 1, waste: 5 } }],
}

const servingWasteQuote: Partial<ApiClient> = {
  regionMap: async () => ({ ok: true, value: wasteMap }),
  quoteCleanUp: async () => ({
    ok: true,
    value: { strength: 2, waste: 5, pay: foodPay, covers: false },
  }),
}

it('writes the clean-up form in English over Spanish in the both phase', async () => {
  await showIn('/map', bothPhase, teamAtHome, servingWasteQuote)

  fireEvent.click(
    screen.getByRole('button', {
      name: both(en.mapCleanUpActionTo({ site: 4 }), es.mapCleanUpActionTo({ site: 4 })),
    }),
  )
  const form = screen.getByRole('region', {
    name: both(en.mapCleanUpTitle({ site: 4 }), es.mapCleanUpTitle({ site: 4 })),
  })
  fireEvent.change(within(form).getByLabelText(both(en.mapJobWorkers(), es.mapJobWorkers())), {
    target: { value: '2' },
  })
  await act(() => vi.advanceTimersByTimeAsync(0))

  for (const [english, spanish] of [
    [en.mapCleanUpTitle({ site: 4 }), es.mapCleanUpTitle({ site: 4 })],
    [en.mapJobWorkers(), es.mapJobWorkers()],
    [en.mapJobTrucks(), es.mapJobTrucks()],
    [en.mapWasteAmount({ waste: 5 }), es.mapWasteAmount({ waste: 5 })],
    [en.mapCleanUpTeam({ strength: 2 }), es.mapCleanUpTeam({ strength: 2 })],
    [englishFoodPay, spanishFoodPay],
    [en.mapCleanUpShort(), es.mapCleanUpShort()],
    [en.mapJobSend(), es.mapJobSend()],
  ] as const) {
    expect(languagesIn(form, english, spanish), english).toEqual(englishOverSpanish)
  }
})

it('writes the clean-up form in English under none', async () => {
  await showIn('/map', noScaffold, teamAtHome, servingWasteQuote)

  fireEvent.click(screen.getByRole('button', { name: en.mapCleanUpActionTo({ site: 4 }) }))
  const form = screen.getByRole('region', { name: en.mapCleanUpTitle({ site: 4 }) })
  fireEvent.change(within(form).getByLabelText(en.mapJobWorkers()), { target: { value: '2' } })
  await act(() => vi.advanceTimersByTimeAsync(0))

  for (const line of [
    en.mapCleanUpTitle({ site: 4 }),
    en.mapJobWorkers(),
    en.mapJobTrucks(),
    en.mapWasteAmount({ waste: 5 }),
    en.mapCleanUpTeam({ strength: 2 }),
    englishFoodPay,
    en.mapCleanUpShort(),
    en.mapJobSend(),
  ]) {
    expect(
      shownLinesDrawnAlone(line, 'en').filter((shown) => form.contains(shown)),
      line,
    ).toHaveLength(1)
  }
})
