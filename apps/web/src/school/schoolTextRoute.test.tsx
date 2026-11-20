import { schoolLessonNothingToRead, townTryAgain } from '@mygame/catalog'
import type { OpenText } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import type { AppRouter } from '../router'

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

const answeringText: ApiClient['text'] = async () => ({
  ok: true,
  value: { kind: 'open', text: firstText },
})

const clientWith = (text: ApiClient['text']): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, text })

const showText = async (
  textId: string,
  text: ApiClient['text'] = answeringText,
): Promise<AppRouter> => {
  const router = renderAppAt(`/school/texts/${textId}`, clientWith(text))
  await passSeconds(0)
  return router
}

it('reads the text it opens by its id', async () => {
  const asked: Array<string> = []
  await showText('text-1', async (textId) => {
    asked.push(textId)
    return { ok: true, value: { kind: 'open', text: firstText } }
  })

  expect(asked).toEqual(['text-1'])
})

it('shows the text under its title', async () => {
  await showText('text-1')

  expect(screen.getByRole('heading', { level: 1, name: 'A New Course' })).toBeDefined()
  expect(screen.getByText(/by the river\./).getAttribute('lang')).toBe('en')
})

it('shows a word under 7 days with its gloss beside it', async () => {
  await showText('text-1')

  const gloss = screen.getByText('casa')
  expect(gloss.getAttribute('lang')).toBe('es')
  expect(screen.queryByRole('button', { name: 'house' })).toBeNull()
})

it("shows a stable word's gloss on tap", async () => {
  await showText('text-1')
  const word = screen.getByRole('button', { name: 'course' })

  expect(screen.queryByText('curso')).toBeNull()

  fireEvent.click(word)
  await passSeconds(0)

  expect(screen.getByText('curso').getAttribute('lang')).toBe('es')
  expect(word.getAttribute('aria-expanded')).toBe('true')
})

it('closes the support on a second tap of its word', async () => {
  await showText('text-1')
  const word = screen.getByRole('button', { name: 'course' })

  fireEvent.click(word)
  await passSeconds(0)
  fireEvent.click(word)
  await passSeconds(0)

  expect(screen.queryByText('curso')).toBeNull()
  expect(word.getAttribute('aria-expanded')).toBe('false')
})

it('sends no request on a tap', async () => {
  const calls: Array<string> = []
  const recording = new Proxy(clientWith(answeringText), {
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
  await showText('text-9', async () => ({ ok: true, value: { kind: 'notOpen' } }))

  expect(screen.getByText(schoolLessonNothingToRead())).toBeDefined()
})

it('sends a player with no town to the town home', async () => {
  const router = await showText('text-1', async () => ({ ok: false, refusal: 'TownNotFound' }))

  expect(router.state.location.pathname).toBe('/')
})

it('reads the text again from the retry after a failed read', async () => {
  const answers: Array<Awaited<ReturnType<ApiClient['text']>>> = [
    { ok: false, refusal: 'Unexpected' },
    { ok: true, value: { kind: 'open', text: firstText } },
  ]
  await showText('text-1', async () => answers.shift() ?? { ok: false, refusal: 'Unexpected' })

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: 'A New Course' })).toBeDefined()
})
