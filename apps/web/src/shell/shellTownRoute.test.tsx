import {
  reportReviewsDue,
  reportStartReviews,
  reviewCheck,
  schoolLessonReadWords,
  schoolSlotStopOf,
  shellLessonFinishClose,
  shellLessonFinishLine,
  shellNavigationReport,
  shellSignOut,
  townNextLessonReadyIn,
} from '@mygame/catalog'
import type { Reviews, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, assert, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
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

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const lessonOf = (number: number): TownOverview['lessons'][number] => ({
  id: `lesson-${number}`,
  theme: 'A day in town',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: false,
  words: [
    {
      wordId: `word-${number}`,
      standing: 'notStarted',
      reading: null,
      support: { shown: 'beside', text: 'gloss', language: 'es' },
    },
  ],
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

const reportDoor = (count: number): HTMLElement =>
  within(screen.getByRole('main')).getByRole('link', {
    name: `${shellNavigationReport()} ${reportReviewsDue({ count: String(count) })}`,
  })

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

  for (const path of ['/report', '/reviews', '/school', '/school/lesson-2', '/']) {
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

it.each([
  ['ahead of', 3_600_000],
  ['behind', -3_600_000],
])(
  "counts a running lesson down on the server's clock with the device %s it",
  async (_, skewMs) => {
    vi.setSystemTime(readAt + skewMs)
    renderAppAt('/report', signedInClient(servingTown(lessonTwoRunning)))
    await passSeconds(0)

    expect(shellTimers()[0]?.textContent).toBe(`${townNextLessonReadyIn({ number: 2 })}4 min`)
  },
)

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
      value: { due: [dueReview], readFirst: [], nextDueAt: null, readAt: knownTown.readAt },
    }),
    answerReview: async () => {
      answers += 1
      return { ok: true, value: { verdict: { kind: 'nearMiss' } } }
    },
  })
  const router = renderAppAt('/reviews', client)
  await passSeconds(0)

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'lake' } })
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)
  await act(() => router.navigate({ href: '/' }))
  await passSeconds(0)

  expect(reportDoor(1)).toBeDefined()
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
})

it('empties the live region once the notice closes', async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)
  await passSeconds(240)

  fireEvent.click(within(finishNotice(2)).getByRole('button', { name: shellLessonFinishClose() }))
  await passSeconds(0)

  expect(shellLiveRegion().textContent).toBe('')
})

it('moves focus to the shell header when the notice closes', async () => {
  renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)
  await passSeconds(240)

  fireEvent.click(within(finishNotice(2)).getByRole('button', { name: shellLessonFinishClose() }))

  expect(document.activeElement).toBe(screen.getByRole('banner'))
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

it("reads the Report no more at a lesson's start", async () => {
  const report = vi.fn<ApiClient['report']>(async () => ({
    ok: true,
    value: { dueCount: 0, due: [], readFirst: [], nextDueAt: null, news: [] },
  }))
  renderAppAt(
    '/report',
    signedInClient({
      report,
      town: async () => ({
        ok: true,
        value: Date.now() < readAt + 60_000 ? knownTown : lessonTwoRunning,
      }),
    }),
  )
  await passSeconds(0)

  await passSeconds(60)

  expect(shellTimers()).toHaveLength(1)
  expect(report).toHaveBeenCalledTimes(1)
})

it('keeps the notice on the next screen', async () => {
  const router = renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  await act(() => router.navigate({ href: '/' }))
  await passSeconds(0)

  expect(finishNotice(2)).toBeDefined()
})

it('leaves the strong link to the next step on the town home', async () => {
  renderAppAt('/', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  const tones = screen
    .getAllByRole('link', { name: schoolLessonReadWords() })
    .map((link) => link.dataset.tone)
  expect(tones.sort()).toEqual(['primary', 'quiet'])
})

it('keeps the notice on the school', async () => {
  const router = renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)
  await passSeconds(240)

  await act(() => router.navigate({ href: '/school' }))
  await passSeconds(0)

  expect(finishNotice(2)).toBeDefined()
})

it('drops the notice for good on the reviews', async () => {
  const router = renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)
  await passSeconds(240)

  await act(() => router.navigate({ href: '/reviews' }))
  await passSeconds(0)
  await act(() => router.navigate({ href: '/report' }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it('drops the notice for good on the words it opens', async () => {
  const router = renderAppAt('/report', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)
  await passSeconds(240)

  await act(() => router.navigate({ href: '/school/lesson-2' }))
  await passSeconds(0)
  await act(() => router.navigate({ href: '/report' }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it('draws no notice for a lesson finishing on the words it would open', async () => {
  renderAppAt('/school/lesson-2', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  expect(queryFinishNotice(2)).toBeNull()
})

it('draws no notice after a finish on the words it would open', async () => {
  const router = renderAppAt('/school/lesson-2', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)
  await passSeconds(240)

  await act(() => router.navigate({ href: '/report' }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it('draws no notice after a finish during the reviews', async () => {
  const router = renderAppAt('/reviews', finishingClient(lessonTwoFinished([])))
  await passSeconds(0)
  await passSeconds(240)

  await act(() => router.navigate({ href: '/report' }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it('draws no notice when a review comes due after a finish on the words', async () => {
  const finished = lessonTwoFinished(['lesson-2'])
  const townAt = (elapsedMs: number): TownOverview => {
    if (elapsedMs < 240_000) {
      return lessonTwoRunning
    }
    if (elapsedMs < 300_000) {
      return finished
    }
    return elapsedMs < 360_000
      ? { ...finished, nextStep: { kind: 'caughtUp', goal: null }, readAt: instantAfter(300) }
      : { ...finished, readAt: instantAfter(360) }
  }
  const router = renderAppAt(
    '/school/lesson-2',
    signedInClient({ town: async () => ({ ok: true, value: townAt(Date.now() - readAt) }) }),
  )
  await passSeconds(0)
  await passSeconds(240)
  await passSeconds(60)
  await act(() => router.navigate({ href: '/reviews' }))
  await passSeconds(0)
  await act(() => router.navigate({ href: '/report' }))

  await passSeconds(60)

  expect(queryFinishNotice(2)).toBeNull()
})

it('draws no notice for a finish with no review due', async () => {
  renderAppAt(
    '/report',
    finishingClient({ ...lessonTwoFinished([]), nextStep: { kind: 'caughtUp', goal: null } }),
  )
  await passSeconds(0)

  await passSeconds(240)

  expect(queryFinishNotice(2)).toBeNull()
})

it('still announces a finish with no review due', async () => {
  renderAppAt(
    '/report',
    finishingClient({ ...lessonTwoFinished([]), nextStep: { kind: 'caughtUp', goal: null } }),
  )
  await passSeconds(0)

  await passSeconds(240)

  expect(shellLiveRegion().textContent).toBe(shellLessonFinishLine({ number: 2 }))
})

it('still announces a lesson finishing on the words it would open', async () => {
  renderAppAt('/school/lesson-2', finishingClient(lessonTwoFinished(['lesson-2'])))
  await passSeconds(0)

  await passSeconds(240)

  expect(shellLiveRegion().textContent).toBe(shellLessonFinishLine({ number: 2 }))
})

it('drops the notice for good once no review is due', async () => {
  const finished = lessonTwoFinished([])
  const caughtUp: TownOverview = {
    ...finished,
    nextStep: { kind: 'caughtUp', goal: null },
    readAt: instantAfter(300),
  }
  const townAt = (elapsedMs: number): TownOverview => {
    if (elapsedMs < 240_000) {
      return lessonTwoRunning
    }
    if (elapsedMs < 300_000) {
      return finished
    }
    return elapsedMs < 360_000 ? caughtUp : { ...finished, readAt: instantAfter(360) }
  }
  renderAppAt(
    '/report',
    signedInClient({ town: async () => ({ ok: true, value: townAt(Date.now() - readAt) }) }),
  )
  await passSeconds(0)
  await passSeconds(240)
  expect(finishNotice(2)).toBeDefined()

  await passSeconds(60)
  await passSeconds(60)

  expect(queryFinishNotice(2)).toBeNull()
})

const twoFinishesClient = (): ApiClient => {
  const lessonOneRunning: TownOverview = {
    ...lessonTwoFinished([]),
    lessonSlot: {
      lessonId: 'lesson-1',
      startedAt: instantAfter(300),
      finishesAt: instantAfter(540),
    },
    readAt: instantAfter(300),
  }
  const lessonOneFinished: TownOverview = {
    ...lessonTwoFinished(['lesson-1']),
    lessons: lessons.map((lesson) => ({ ...lesson, isStudied: true })),
    readAt: instantAfter(540),
  }
  const townAt = (elapsedMs: number): TownOverview => {
    if (elapsedMs < 240_000) {
      return lessonTwoRunning
    }
    if (elapsedMs < 300_000) {
      return lessonTwoFinished([])
    }
    return elapsedMs < 540_000 ? lessonOneRunning : lessonOneFinished
  }
  return signedInClient({ town: async () => ({ ok: true, value: townAt(Date.now() - readAt) }) })
}

it('reopens the notice for a second finish after a Close', async () => {
  renderAppAt('/report', twoFinishesClient())
  await passSeconds(0)
  await passSeconds(240)
  fireEvent.click(within(finishNotice(2)).getByRole('button', { name: shellLessonFinishClose() }))

  await passSeconds(60)
  await passSeconds(240)

  expect(finishNotice(1)).toBeDefined()
})

it('reopens the notice for a second finish after a drop', async () => {
  const router = renderAppAt('/report', twoFinishesClient())
  await passSeconds(0)
  await passSeconds(240)
  await act(() => router.navigate({ href: '/reviews' }))
  await passSeconds(0)
  await act(() => router.navigate({ href: '/report' }))

  await passSeconds(60)
  await passSeconds(240)

  expect(finishNotice(1)).toBeDefined()
})

it('tells a second finish on the same page', async () => {
  renderAppAt('/report', twoFinishesClient())
  await passSeconds(0)
  await passSeconds(240)
  const firstAnnouncement = shellLiveRegion().firstElementChild

  await passSeconds(60)
  await passSeconds(240)

  expect(finishNotice(1)).toBeDefined()
  expect(shellLiveRegion().firstElementChild).not.toBe(firstAnnouncement)
})

it('tells no finish of a studied lesson when another lesson stops', async () => {
  const lessonOneStudied = { ...lessonOf(1), isStudied: true }
  renderAppAt(
    '/report',
    finishingClient({
      ...lessonTwoFinished([]),
      lessons: [lessonOneStudied, lessonOf(2)],
    }),
  )
  await passSeconds(0)

  await passSeconds(240)

  expect(queryFinishNotice(1)).toBeNull()
})

it('shows no notice for a lesson the player stops', async () => {
  const client = signedInClient({
    town: async () => ({ ok: true, value: lessonTwoRunning }),
    stopLesson: async () => ({
      ok: true,
      value: { ...lessonTwoFinished(['lesson-1']), lessons, readAt: instantAfter(10) },
    }),
  })
  renderAppAt('/school', client)
  await passSeconds(0)
  await passSeconds(10)

  fireEvent.click(screen.getByRole('button', { name: schoolSlotStopOf({ number: 2 }) }))
  await passSeconds(0)

  expect(queryFinishNotice(2)).toBeNull()
})

it('shows no notice for a lesson stopped in another tab', async () => {
  renderAppAt('/report', finishingClient({ ...lessonTwoFinished(['lesson-1']), lessons }))
  await passSeconds(0)

  await passSeconds(240)

  expect(queryFinishNotice(2)).toBeNull()
})

it('announces nothing for a lesson stopped in another tab', async () => {
  renderAppAt('/report', finishingClient({ ...lessonTwoFinished(['lesson-1']), lessons }))
  await passSeconds(0)

  await passSeconds(240)

  expect(shellLiveRegion().textContent).toBe('')
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
    '/report',
    signedInClient({
      town: async () => ({ ok: false, refusal: 'TownNotFound', error: undefined }),
    }),
  )
  await passSeconds(0)

  expect(shellTimers()).toEqual([])
  expect(shellLiveRegion().textContent).toBe('')
})

it('shows nothing when the first read fails', async () => {
  renderAppAt(
    '/report',
    signedInClient({ town: async () => ({ ok: false, refusal: 'Unexpected', error: undefined }) }),
  )
  await passSeconds(0)

  expect(shellTimers()).toEqual([])
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
