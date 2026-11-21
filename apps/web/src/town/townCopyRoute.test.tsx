import { en, es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { capitalize } from '../design-system/capitalize'
import { linesDrawnAlone } from './lineDrawnAlone.testSupport'

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

const both = (english: string, spanish: string): string => `${english} ${spanish}`

const headingNamed = (name: string): Promise<HTMLElement> => screen.findByRole('heading', { name })

const paragraphReading = (text: string): Promise<HTMLElement> =>
  screen.findByText((_, element) => element?.tagName === 'P' && element.textContent === text)

it('titles a tip in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase, { tip: 'people' }))

  expect(await headingNamed(es.townTipTitle())).toBeDefined()
})

it('titles a tip in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase, { tip: 'people' }))

  expect(await headingNamed(both(en.townTipTitle(), es.townTipTitle()))).toBeDefined()
})

it('writes a tip in English alone in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase, { tip: 'people' }))

  expect(await linesDrawnAlone(en.townTipPeople(), 'en')).toHaveLength(1)
})

it('closes a tip by an English button under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold, { tip: 'people' }))

  expect(await screen.findByRole('button', { name: en.townTipClose() })).toBeDefined()
})

const caughtUpWith = (next: Partial<Extract<TownOverview['nextStep'], { kind: 'caughtUp' }>>) => ({
  nextStep: {
    kind: 'caughtUp' as const,
    reason: 'lessonsDone' as const,
    goal: null,
    text: null,
    ...next,
  },
})

const farmUnderway = {
  goal: { position: 1, count: 9, building: 'farm' as const, level: 1, state: 'underway' as const },
}

const newestText = { text: { id: 'text-31', title: 'The New Shop' } }

it('titles the next step in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  expect(
    await screen.findByRole('region', { name: both(en.townNextTitle(), es.townNextTitle()) }),
  ).toBeDefined()
})

it('closes the goal by an English button in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase, caughtUpWith(farmUnderway)))

  expect(await screen.findByRole('button', { name: en.townGoalClose() })).toBeDefined()
})

it('links the newest text in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase, caughtUpWith(newestText)))

  expect(
    await screen.findByRole('link', { name: es.townNextText({ title: 'The New Shop' }) }),
  ).toBeDefined()
})

it('links the newest text in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold, caughtUpWith(newestText)))

  expect(
    await screen.findByRole('link', { name: en.townNextText({ title: 'The New Shop' }) }),
  ).toBeDefined()
})

it('opens the report by an English door under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect(await screen.findByRole('link', { name: en.shellNavigationReport() })).toBeDefined()
})

it('counts the due reviews on the report door in English over Spanish in the both phase', async () => {
  renderAppAt(
    '/',
    servingTownIn(bothPhase, { nextStep: { kind: 'reviews', count: 3, readFirst: [] } }),
  )

  const report = both(en.shellNavigationReport(), es.shellNavigationReport())
  const due = both(en.reportReviewsDue({ count: '3' }), es.reportReviewsDue({ count: '3' }))

  expect(await screen.findByRole('link', { name: `${report} ${due}` })).toBeDefined()
})

it('names the skyline in English and in Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  const english = en.townSkylineBuilt({ built: 2, total: 7 })
  const spanish = es.townSkylineBuilt({ built: 2, total: 7 })

  expect(await screen.findByRole('img', { name: both(english, spanish) })).toBeDefined()
})

it('marks the skyline as English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  const skyline = await screen.findByRole('img', {
    name: en.townSkylineBuilt({ built: 2, total: 7 }),
  })

  expect(skyline.getAttribute('lang')).toBe('en')
})

it('titles the stocks in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase))

  expect(await headingNamed(es.townStocks())).toBeDefined()
})

it('counts the people in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  const people = { free: knownTown.people.free, atWork: knownTown.people.atWork }

  expect(await paragraphReading(both(en.townPeople(people), es.townPeople(people)))).toBeDefined()
})

it('counts the reviewed and learned words in English in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase, { stableWordCount: 4, retainedWordCount: 6 }))

  expect(await screen.findByText(en.townWordsReviewed({ count: 4 }))).toBeDefined()
  expect(await screen.findByText(en.townWordsLearned({ count: 6 }))).toBeDefined()
})

it('writes the room left in a store in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect(await screen.findAllByText(en.townStockOf({ capacity: '5 000' }))).toHaveLength(4)
})

it('titles the places of a city in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase, { label: 'city' }))

  expect(await headingNamed(both(en.townPlacesTitleCity(), es.townPlacesTitleCity()))).toBeDefined()
})

it('links the school from its place in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect(await screen.findByRole('link', { name: en.townGoToSchool() })).toBeDefined()
})

it('titles the office in English alone in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase))

  expect(
    await screen.findByRole('heading', { level: 3, name: en.namesPlacesOffice() }),
  ).toBeDefined()
})

it('names a hire and its team in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  const truck = both(en.namesHiresTruck(), es.namesHiresTruck())

  expect(await headingNamed(truck)).toBeDefined()
  expect(
    await paragraphReading(
      both(en.townOfficeTeamTruck({ count: 0 }), es.townOfficeTeamTruck({ count: 0 })),
    ),
  ).toBeDefined()
})

it('writes the office level a hire needs in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect(await screen.findByText(en.townOfficeNeedsLevel({ level: 3 }))).toBeDefined()
})

const withNoTownIn = (language: CopyLanguage): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: false, refusal: 'TownNotFound' }),
  })

it('asks to name the town in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', withNoTownIn(spanishPhase))

  expect(await headingNamed(es.townNamingTitle())).toBeDefined()
})

it('asks to name the town in English over Spanish in the both phase', async () => {
  renderAppAt('/', withNoTownIn(bothPhase))

  expect(await headingNamed(both(en.townNamingTitle(), es.townNamingTitle()))).toBeDefined()
})

it('greets the new mayor in English alone in the English phase', async () => {
  renderAppAt('/', withNoTownIn(englishPhase))

  expect(await paragraphReading(en.townNamingMayor())).toBeDefined()
})

it('founds the town by an English button under none', async () => {
  renderAppAt('/', withNoTownIn(noScaffold))

  expect(await screen.findByRole('button', { name: en.townNamingSubmit() })).toBeDefined()
})

const linesReading = (text: string): Promise<ReadonlyArray<HTMLElement>> =>
  screen.findAllByText((_, element) => element?.textContent === text)

const officeAt = (level: number): Partial<TownOverview> => ({
  buildings: { ...knownTown.buildings, office: { ...knownTown.buildings.office, level } },
})

it('names a place in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  expect(await headingNamed(both(en.namesPlacesFarm(), es.namesPlacesFarm()))).toBeDefined()
})

it('writes a place not built yet in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect((await screen.findAllByText(en.townNotBuilt())).length).toBeGreaterThan(0)
})

it('writes the people a place puts to work in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase))

  expect(await linesDrawnAlone(es.townPeopleAtWork({ people: 2 }), 'es')).not.toHaveLength(0)
})

it('builds the next level by an English button in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase))

  const build = `${en.townBuild({ level: 2 })} · 5:00`

  expect((await screen.findAllByRole('button', { name: build })).length).toBeGreaterThan(0)
})

it('names each cost in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  const money = (catalog: typeof en | typeof es): string =>
    catalog.townCostName({ resource: catalog.namesTownResourcesMoney() })

  expect((await linesReading(` ${both(money(en), money(es))}`)).length).toBeGreaterThan(0)
})

it('writes the resources a place is short of in English under none', async () => {
  const broke = {
    stocks: { ...knownTown.stocks, money: { ...knownTown.stocks.money, amount: 0 } },
  }
  renderAppAt('/', servingTownIn(noScaffold, broke))

  const missing = en.townAmount({ amount: '60', resource: en.namesTownResourcesMoney() })

  expect((await screen.findAllByText(en.townShortfall({ missing }))).length).toBeGreaterThan(0)
})

it('labels the count of workers to hire in English alone in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase, officeAt(1)))

  expect(await screen.findByRole('textbox', { name: en.townOfficeCountWorker() })).toBeDefined()
})

it('hires workers by an English button under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold, officeAt(1)))

  const hire = `${en.townOfficeHireWorker({ count: 1 })} · 1:00`

  expect(await screen.findByRole('button', { name: hire })).toBeDefined()
})

it('names the people a hire takes in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/', servingTownIn(spanishPhase, officeAt(1)))

  expect(await linesDrawnAlone(es.townOfficePeopleName({ count: 1 }), 'es')).not.toHaveLength(0)
})

it('writes the goal and its state in English in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase, caughtUpWith(farmUnderway)))

  const goal = en.townGoalLine({ position: 1, count: 9, place: en.namesPlacesFarm(), level: 1 })

  expect(await paragraphReading(goal)).toBeDefined()
  expect(await paragraphReading(en.townInWork())).toBeDefined()
})

it('writes a caught-up next step in English over Spanish in the both phase', async () => {
  renderAppAt('/', servingTownIn(bothPhase))

  expect(
    await paragraphReading(both(en.reportNoReviewsDue(), es.reportNoReviewsDue())),
  ).toBeDefined()
})

it('sends a caught-up player to the report in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect(await screen.findByRole('link', { name: en.townNextGoToReport() })).toBeDefined()
})

it('keeps a due holdout check in Spanish in the English phase', async () => {
  renderAppAt(
    '/',
    servingTownIn(englishPhase, { nextStep: { kind: 'holdoutCheck', band: 2, week: 8 } }),
  )

  const line = await paragraphReading(es.townNextHoldoutCheck({ band: 2 }))

  expect(line.querySelector('[lang]')?.getAttribute('lang')).toBe('es')
})

it('writes a due holdout check in English under none', async () => {
  renderAppAt(
    '/',
    servingTownIn(noScaffold, { nextStep: { kind: 'holdoutCheck', band: 2, week: 8 } }),
  )

  expect(await paragraphReading(en.townNextHoldoutCheck({ band: 2 }))).toBeDefined()
})

it('names each stock in English alone in the English phase', async () => {
  renderAppAt('/', servingTownIn(englishPhase))

  expect(
    await screen.findByRole('listitem', { name: capitalize(en.namesTownResourcesFood()) }),
  ).toBeDefined()
})

it('writes a stock rate in English under none', async () => {
  renderAppAt('/', servingTownIn(noScaffold))

  expect(await screen.findByText(en.townRate({ rate: '60' }))).toBeDefined()
})

it('names an earned skill in English over Spanish in the both phase', async () => {
  const skilled = {
    skills: [
      {
        lessonId: 'lesson-1',
        resource: 'food' as const,
        ratePercent: 5,
        earnedAt: knownTown.readAt,
      },
    ],
  }
  renderAppAt('/', servingTownIn(bothPhase, skilled))

  const skill = (catalog: typeof en | typeof es): string =>
    catalog.schoolSkillName({ resource: catalog.namesTownResourcesFood(), level: 1 })

  expect(await linesReading(both(skill(en), skill(es)))).not.toHaveLength(0)
})

it('offers to read the town again in English under none', async () => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => ({ ...knownPlayer, ...noScaffold }),
      town: async () => ({ ok: false, refusal: 'InvalidCredentials' }),
    }),
  )

  expect(await screen.findByRole('button', { name: en.townTryAgain() })).toBeDefined()
})
