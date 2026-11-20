import { schoolLessonNothingToRead, townTryAgain } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { refusedRead } from '../design-system/loadingSkeleton.testSupport'

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

type OpenText = TownOverview['texts'][number]

const firstText: OpenText = {
  id: 'text-1',
  title: 'A New Course',
  sentences: [
    [
      { text: 'I live in a little old ', support: null },
      { text: 'house', support: { shown: 'beside', text: 'casa', language: 'es' } },
      { text: ' by the river.', support: null },
    ],
    [
      { text: 'This fall I started a ', support: null },
      { text: 'course', support: { shown: 'onTap', text: 'curso', language: 'es' } },
      { text: ' at the school.', support: null },
    ],
  ],
}

const townWith = (texts: ReadonlyArray<OpenText>): TownOverview => ({
  ...knownTown,
  texts: [...texts],
})

const showText = async (
  textId: string,
  town: TownOverview,
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    `/school/texts/${textId}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

it('shows the text under its title', async () => {
  await showText('text-1', townWith([firstText]))

  expect(screen.getByRole('heading', { level: 1, name: 'A New Course' })).toBeDefined()
  expect(screen.getByText(/by the river\./).getAttribute('lang')).toBe('en')
})

it('shows a word under 7 days with its gloss beside it', async () => {
  await showText('text-1', townWith([firstText]))

  const gloss = screen.getByText('casa')
  expect(gloss.getAttribute('lang')).toBe('es')
  expect(screen.queryByRole('button', { name: 'house' })).toBeNull()
})

it("shows a stable word's gloss on tap", async () => {
  await showText('text-1', townWith([firstText]))
  const word = screen.getByRole('button', { name: 'course' })

  expect(screen.queryByText('curso')).toBeNull()

  fireEvent.click(word)
  await passSeconds(0)

  expect(screen.getByText('curso').getAttribute('lang')).toBe('es')
  expect(word.getAttribute('aria-expanded')).toBe('true')
})

it('sends no request on a tap', async () => {
  const calls: Array<string> = []
  const client = stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: townWith([firstText]) }),
  })
  const recording = new Proxy(client, {
    get: (target, name, receiver) => {
      calls.push(String(name))
      return Reflect.get(target, name, receiver)
    },
  })
  renderAppAt('/school/texts/text-1', recording)
  await passSeconds(0)
  const callsBeforeTap = calls.length

  fireEvent.click(screen.getByRole('button', { name: 'course' }))
  await passSeconds(0)

  expect(calls.slice(callsBeforeTap)).toEqual([])
})

it('says there is nothing to read for a text the stage has not reached', async () => {
  await showText('text-9', townWith([firstText]))

  expect(screen.getByText(schoolLessonNothingToRead())).toBeDefined()
})

it('offers the retry on a refused town read', async () => {
  await showText('text-1', townWith([firstText]), { town: refusedRead })

  expect(screen.getByRole('button', { name: townTryAgain() })).toBeDefined()
})
