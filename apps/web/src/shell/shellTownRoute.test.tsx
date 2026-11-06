import {
  reportReviewsDue,
  reportStartReviews,
  reviewCheck,
  schoolLessonReadWords,
  schoolSlotStopOf,
  shellLessonFinishClose,
  shellLessonFinishLine,
  shellNavigationReport,
  shellNavigationTown,
  shellSignOut,
  townNextLessonReadyIn,
} from '@mygame/catalog'
import type { Reviews } from '@mygame/contracts'
import type { TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, assert, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFiefPath,
  knownPlayer,
  knownTown,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'

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

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const lessonOf = (number: number): TownOverview['lessons'][number] => ({
  id: `lesson-${number}`,
  theme: 'A day in town',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: false,
  words: [{ wordId: `word-${number}`, standing: 'notStarted', reading: null }],
})

const lessons = [lessonOf(1), lessonOf(2)]

const lessonTwoRunning: TownOverview = {
  ...knownTown,
  lessons,
  lessonSlot: {
    lessonId: 'lesson-2',
    startedAt: instantAfter(-60),
    finishesAt: instantAfter(240),
  },
  nextStep: { kind: 'lessonRunning', producer: null },
}

const lessonTwoFinished = (readFirst: ReadonlyArray<string>): TownOverview => ({
  ...knownTown,
  lessons: [lessonOf(1), { ...lessonOf(2), isStudied: true }],
  nextStep: { kind: 'reviews', count: 1, readFirst: [...readFirst] },
  readAt: instantAfter(240),
})

const signedInClient = (overrides: Partial<ApiClient>): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides })

const servingTown = (town: TownOverview): Pick<ApiClient, 'town'> => ({
  town: async () => ({ ok: true, value: town }),
})

const finishingClient = (finished: TownOverview): ApiClient =>
  signedInClient({
    town: async () => ({
      ok: true,
      value: Date.now() < readAt + 240_000 ? lessonTwoRunning : finished,
    }),
  })

const dueTown = (count: number): TownOverview => ({
  ...knownTown,
  nextStep: { kind: 'reviews', count, readFirst: [] },
})

const screensNavigation = (): HTMLElement =>
  screen.getByRole('navigation', { name: (accessibleName) => accessibleName === '' })

const finishNotice = (number: number): HTMLElement =>
  screen.getByRole('region', { name: shellLessonFinishLine({ number }) })

const queryFinishNotice = (number: number): HTMLElement | null =>
  screen.queryByRole('region', { name: shellLessonFinishLine({ number }) })

const shellLiveRegion = (): Element => {
  const region = document.querySelector('body > div [aria-live="polite"]')
  assert(region !== null)
  return region
}

const shellTimers = (): ReadonlyArray<HTMLElement> =>
  screen
    .queryAllByRole('timer')
    .filter((timer) => timer.textContent?.startsWith(townNextLessonReadyIn({ number: 2 })))

it("shows a running lesson's time on every signed-in screen", async () => {
  const router = renderAppAt('/', signedInClient(servingTown(lessonTwoRunning)))
  await passSeconds(0)

  for (const path of ['/report', '/reviews', '/school', '/school/lesson-2', knownFiefPath, '/']) {
    await act(() => router.navigate({ href: path }))
    await passSeconds(0)

    const shellTimer = screen
      .getAllByRole('timer')
      .find((timer) => timer.textContent === `${townNextLessonReadyIn({ number: 2 })}4 min`)
    expect(shellTimer, path).toBeDefined()
  }
})

it('reads the town once for the layout and the screen', async () => {
  const town = vi.fn<ApiClient['town']>(async () => ({ ok: true, value: lessonTwoRunning }))
  const router = renderAppAt('/', signedInClient({ town }))
  await passSeconds(0)

  await act(() => router.navigate({ href: '/school' }))
  await passSeconds(0)
  await act(() => router.navigate({ href: '/school/lesson-2' }))
  await passSeconds(0)

  expect(town).toHaveBeenCalledTimes(1)
})

it("counts a running lesson down on the server's clock", async () => {
  vi.setSystemTime(readAt + 3_600_000)
  renderAppAt('/report', signedInClient(servingTown(lessonTwoRunning)))
  await passSeconds(0)

  expect(shellTimers()[0]?.textContent).toBe(`${townNextLessonReadyIn({ number: 2 })}4 min`)
})

it('shows the due count on Report', async () => {
  renderAppAt('/report', signedInClient(servingTown(dueTown(5))))
  await passSeconds(0)

  const report = within(screensNavigation()).getByRole('link', {
    name: `${shellNavigationReport()} ${reportReviewsDue({ count: '5' })}`,
  })
  expect(report.getAttribute('href')).toBe('/report')
})

it('leaves the count off Town', async () => {
  renderAppAt('/report', signedInClient(servingTown(dueTown(5))))
  await passSeconds(0)

  expect(
    within(screensNavigation()).getByRole('link', { name: shellNavigationTown() }).textContent,
  ).toBe(shellNavigationTown())
})

it('shows a due count of 1 on Report', async () => {
  renderAppAt('/', signedInClient(servingTown(dueTown(1))))
  await passSeconds(0)

  expect(
    within(screensNavigation()).getByRole('link', {
      name: `${shellNavigationReport()} ${reportReviewsDue({ count: '1' })}`,
    }),
  ).toBeDefined()
})

it('shows no count with nothing due', async () => {
  renderAppAt('/', signedInClient(servingTown(knownTown)))
  await passSeconds(0)

  expect(
    within(screensNavigation()).getByRole('link', { name: shellNavigationReport() }).textContent,
  ).toBe(shellNavigationReport())
})

it('lowers the due count once a review is answered', async () => {
  const dueReview: Reviews['due'][number] = {
    wordId: 'word-2',
    lessonId: 'lesson-2',
    dueAt: instantAfter(-60),
    mode: 'recall',
    gloss: 'río',
    gappedFrame: 'The ____ is cold.',
  }
  let answers = 0
  const client = signedInClient({
    town: async () => ({ ok: true, value: dueTown(2 - answers) }),
    reviews: async () => ({
      ok: true,
      value: { due: [dueReview], nextDueAt: null, readAt: knownTown.readAt },
    }),
    answerReview: async () => {
      answers += 1
      return { ok: true, value: { verdict: { kind: 'nearMiss' } } }
    },
  })
  renderAppAt('/reviews', client)
  await passSeconds(0)

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'lake' } })
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)

  expect(
    within(screensNavigation()).getByRole('link', {
      name: `${shellNavigationReport()} ${reportReviewsDue({ count: '1' })}`,
    }),
  ).toBeDefined()
})

it('opens the unread lesson from the finish notice', async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  const link = within(finishNotice(2)).getByRole('link', { name: schoolLessonReadWords() })
  expect(link.getAttribute('href')).toBe('/school/lesson-2')
})

it('opens the reviews from the finish notice when no word is unread', async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished([])))
  await passSeconds(0)

  await passSeconds(240)

  const link = within(finishNotice(2)).getByRole('link', { name: reportStartReviews() })
  expect(link.getAttribute('href')).toBe('/reviews')
})

it("announces a lesson's finish once", async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])), { isStrict: true })
  await passSeconds(0)
  expect(shellLiveRegion().textContent).toBe('')

  await passSeconds(240)
  const announced = shellLiveRegion().firstElementChild
  expect(announced?.textContent).toBe(shellLessonFinishLine({ number: 2 }))

  await passSeconds(120)
  expect(shellLiveRegion().firstElementChild).toBe(announced)
})

it('shows a closed notice no more', async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  fireEvent.click(within(finishNotice(2)).getByRole('button', { name: shellLessonFinishClose() }))
  await passSeconds(120)

  expect(queryFinishNotice(2)).toBeNull()
  expect(shellLiveRegion().textContent).toBe('')
})

it('closes the notice once its link is followed', async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  fireEvent.click(within(finishNotice(2)).getByRole('link', { name: schoolLessonReadWords() }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it("reads the Report again at a lesson's finish", async () => {
  const client = {
    ...finishingClient(lessonTwoFinished(['lesson-2'])),
    report: async () => ({
      ok: true as const,
      value: {
        dueCount: Date.now() < readAt + 240_000 ? 0 : 3,
        due: [],
        readFirst: [],
        nextDueAt: null,
        news: [],
      },
    }),
  }
  renderAppAt('/report', client)
  await passSeconds(0)

  await passSeconds(240)

  expect(within(screen.getByRole('main')).getByText(reportReviewsDue({ count: '3' }))).toBeDefined()
})

it('keeps the notice on the next screen', async () => {
  const router = renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  await act(() => router.navigate({ href: '/' }))
  await passSeconds(0)

  expect(finishNotice(2)).toBeDefined()
})

it('shows no notice for a lesson the player stops', async () => {
  const client = signedInClient({
    town: async () => ({ ok: true, value: lessonTwoRunning }),
    stopLesson: async () => ({
      ok: true,
      value: { ...knownTown, lessons, readAt: instantAfter(10) },
    }),
  })
  renderAppAt('/school', client)
  await passSeconds(10)

  fireEvent.click(screen.getByRole('button', { name: schoolSlotStopOf({ number: 2 }) }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it('shows no notice for a lesson stopped in another tab', async () => {
  renderAppAt('/report', finishingClient({ ...knownTown, lessons, readAt: instantAfter(240) }))
  await passSeconds(0)

  await passSeconds(240)

  expect(queryFinishNotice(2)).toBeNull()
})

it('shows no notice for a lesson that finished with the tab closed', async () => {
  renderAppAt('/', signedInClient(servingTown(lessonTwoFinished(['lesson-2']))))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
  expect(shellLiveRegion().textContent).toBe('')
})

it('shows no notice on a re-read with no lesson running', async () => {
  renderAppAt(
    '/report',
    signedInClient({
      town: async () => ({ ok: true, value: lessonTwoFinished(['lesson-2']) }),
    }),
  )
  await passSeconds(0)

  await passSeconds(60)

  expect(queryFinishNotice(2)).toBeNull()
})

it('shows nothing with no town', async () => {
  renderAppAt(
    knownFiefPath,
    signedInClient({
      town: async () => ({ ok: false, refusal: 'TownNotFound', error: undefined }),
    }),
  )
  await passSeconds(0)

  expect(shellTimers()).toEqual([])
  expect(
    within(screensNavigation()).getByRole('link', { name: shellNavigationReport() }).textContent,
  ).toBe(shellNavigationReport())
  expect(shellLiveRegion().textContent).toBe('')
})

it('shows nothing when the first read fails', async () => {
  renderAppAt(
    '/report',
    signedInClient({ town: async () => ({ ok: false, refusal: 'Unexpected', error: undefined }) }),
  )
  await passSeconds(0)

  expect(shellTimers()).toEqual([])
  expect(
    within(screensNavigation()).getByRole('link', { name: shellNavigationReport() }).textContent,
  ).toBe(shellNavigationReport())
})

it('leaves the shell as it is when a later read fails', async () => {
  let reads = 0
  renderAppAt(
    '/report',
    signedInClient({
      town: async () => {
        reads += 1
        return reads === 1
          ? { ok: true, value: lessonTwoRunning }
          : { ok: false, refusal: 'Unexpected', error: undefined }
      },
    }),
  )
  await passSeconds(0)

  await passSeconds(60)

  expect(shellTimers()).toHaveLength(1)
})

it('announces the finish a failed read held back', async () => {
  const finished = lessonTwoFinished(['lesson-2'])
  let isFailing = false
  renderAppAt(
    '/report',
    signedInClient({
      town: async () => {
        if (Date.now() < readAt + 240_000) {
          return { ok: true, value: lessonTwoRunning }
        }
        return isFailing
          ? { ok: false, refusal: 'Unexpected', error: undefined }
          : { ok: true, value: finished }
      },
    }),
  )
  await passSeconds(0)
  isFailing = true
  await passSeconds(240)
  expect(queryFinishNotice(2)).toBeNull()

  isFailing = false
  await passSeconds(2)
  act(() => {
    window.dispatchEvent(new Event('focus'))
  })
  await passSeconds(0)

  expect(finishNotice(2)).toBeDefined()
})

it('leaves no timer behind once the player signs out', async () => {
  let isSignedIn = true
  const town = vi.fn<ApiClient['town']>(async () => ({ ok: true, value: lessonTwoRunning }))
  renderAppAt(
    '/report',
    stubApiClient({
      currentPlayer: async () => (isSignedIn ? knownPlayer : undefined),
      signOut: async () => {
        isSignedIn = false
        return { ok: true, value: undefined }
      },
      town,
    }),
  )
  await passSeconds(0)

  fireEvent.click(screen.getByRole('button', { name: shellSignOut() }))
  await passSeconds(0)
  town.mockClear()

  expect(vi.getTimerCount()).toBe(0)
  await passSeconds(600)
  expect(town).not.toHaveBeenCalled()
})

it('reads the town on no focus once the player signs out', async () => {
  let isSignedIn = true
  const town = vi.fn<ApiClient['town']>(async () => ({ ok: true, value: lessonTwoRunning }))
  renderAppAt(
    '/report',
    stubApiClient({
      currentPlayer: async () => (isSignedIn ? knownPlayer : undefined),
      signOut: async () => {
        isSignedIn = false
        return { ok: true, value: undefined }
      },
      town,
    }),
  )
  await passSeconds(2)
  fireEvent.click(screen.getByRole('button', { name: shellSignOut() }))
  await passSeconds(2)
  town.mockClear()

  window.dispatchEvent(new Event('focus'))

  expect(town).not.toHaveBeenCalled()
})
