import { es } from '@mygame/catalog'
import type { HoldoutChecks } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, HoldoutCheckChange } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse(knownTown.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const settle = async (): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const firstBandDue: HoldoutChecks = { checks: [{ kind: 'due', band: 1, week: 8 }] }

const firstBandAsking: HoldoutChecks = {
  checks: [
    {
      kind: 'asking',
      band: 1,
      week: 8,
      items: [
        {
          wordId: 'word-house',
          word: 'house',
          choices: [
            { choiceId: 'choice-dog', gloss: 'perro' },
            { choiceId: 'choice-house', gloss: 'casa' },
          ],
        },
        {
          wordId: 'word-water',
          word: 'water',
          choices: [
            { choiceId: 'choice-water', gloss: 'agua' },
            { choiceId: 'choice-walk', gloss: 'caminar' },
          ],
        },
      ],
    },
  ],
}

const otherBandDue: HoldoutChecks = { checks: [{ kind: 'due', band: 2, week: 8 }] }

const reading =
  (checks: HoldoutChecks): ApiClient['holdoutChecks'] =>
  async () => ({ ok: true, value: checks })

const changedTo =
  (checks: HoldoutChecks): (() => Promise<HoldoutCheckChange>) =>
  async () => ({ kind: 'changed', checks })

const showCheck = async (
  overrides: Partial<ApiClient>,
  path = '/school/check/1/8',
): Promise<void> => {
  renderAppAt(path, stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides }))
  await settle()
}

const button = (name: string): HTMLButtonElement => screen.getByRole('button', { name })

const click = async (name: string): Promise<void> => {
  fireEvent.click(button(name))
  await settle()
}

const choose = async (gloss: string): Promise<void> => {
  fireEvent.click(screen.getByRole('radio', { name: gloss }))
  await settle()
}

const answerBoth = async (): Promise<void> => {
  await choose('casa')
  await click(es.placementNext())
  await choose('agua')
}

const alert = (): string | null => screen.getByRole('alert').textContent

it('draws a due check with its band and week, a way to take it and a way to skip it', async () => {
  await showCheck({ holdoutChecks: reading(firstBandDue) })

  expect(screen.getByText(es.holdoutCheckDueLine({ band: 1, week: 8 }))).toBeDefined()
  expect(screen.getByText(es.holdoutCheckSkipLine())).toBeDefined()
  expect(button(es.holdoutCheckStart())).toBeDefined()
  expect(button(es.holdoutCheckSkip())).toBeDefined()
})

it('begins the check of its band and week and asks its first word', async () => {
  const beginHoldoutCheck = vi.fn(changedTo(firstBandAsking))
  await showCheck({ holdoutChecks: reading(firstBandDue), beginHoldoutCheck })

  await click(es.holdoutCheckStart())

  expect(beginHoldoutCheck).toHaveBeenCalledWith({ band: 1, week: 8 })
  expect(screen.getByRole('heading', { name: 'house' })).toBeDefined()
  expect(screen.getByText(es.placementProgress({ number: 1, total: 2 }))).toBeDefined()
})

it('asks a check begun before from its first word', async () => {
  await showCheck({ holdoutChecks: reading(firstBandAsking) })

  expect(screen.getByRole('heading', { name: 'house' })).toBeDefined()
})

it('sends every answer of the check at once', async () => {
  const answerHoldoutCheck = vi.fn(changedTo({ checks: [] }))
  await showCheck({ holdoutChecks: reading(firstBandAsking), answerHoldoutCheck })

  await answerBoth()
  await click(es.holdoutCheckSend())

  expect(answerHoldoutCheck).toHaveBeenCalledOnce()
  expect(answerHoldoutCheck).toHaveBeenCalledWith(
    { band: 1, week: 8 },
    {
      answers: [
        { wordId: 'word-house', choiceId: 'choice-house' },
        { wordId: 'word-water', choiceId: 'choice-water' },
      ],
    },
  )
})

it('draws the check done once its answers are saved', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandAsking),
    answerHoldoutCheck: changedTo({ checks: [] }),
  })

  await answerBoth()
  await click(es.holdoutCheckSend())

  expect(screen.getByText(es.holdoutCheckDone())).toBeDefined()
})

it('holds the send while the answers are on their way', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandAsking),
    answerHoldoutCheck: () => new Promise(() => undefined),
  })

  await answerBoth()
  await click(es.holdoutCheckSend())

  expect(button(es.holdoutCheckSend()).getAttribute('aria-busy')).toBe('true')
  expect(screen.getByRole('group', { name: es.placementPrompt() }).hasAttribute('disabled')).toBe(
    true,
  )
})

it('skips the check and says so', async () => {
  const skipHoldoutCheck = vi.fn(changedTo({ checks: [] }))
  await showCheck({ holdoutChecks: reading(firstBandDue), skipHoldoutCheck })

  await click(es.holdoutCheckSkip())

  expect(skipHoldoutCheck).toHaveBeenCalledWith({ band: 1, week: 8 })
  expect(screen.getByText(es.holdoutCheckSkipped())).toBeDefined()
})

it('draws a check refused as not open inline and keeps the way to take it', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandDue),
    beginHoldoutCheck: async () => ({ kind: 'refused', refusal: 'notOpen' }),
  })

  await click(es.holdoutCheckStart())

  expect(alert()).toBe(es.holdoutCheckRefused())
  expect(button(es.holdoutCheckStart())).toBeDefined()
})

it('draws answers refused as not open inline and keeps the asked word', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandAsking),
    answerHoldoutCheck: async () => ({ kind: 'refused', refusal: 'notOpen' }),
  })

  await answerBoth()
  await click(es.holdoutCheckSend())

  expect(alert()).toBe(es.holdoutCheckRefused())
  expect(screen.getByRole('heading', { name: 'water' })).toBeDefined()
})

it('draws answers refused as invalid inline', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandAsking),
    answerHoldoutCheck: async () => ({ kind: 'refused', refusal: 'invalidRequest' }),
  })

  await answerBoth()
  await click(es.holdoutCheckSend())

  expect(alert()).toBe(es.holdoutCheckRefusalInvalid())
})

it('draws a change the server never answered inline', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandDue),
    skipHoldoutCheck: async () => ({ kind: 'unreachable' }),
  })

  await click(es.holdoutCheckSkip())

  expect(alert()).toBe(es.refusalUnexpected())
  expect(button(es.holdoutCheckSkip())).toBeDefined()
})

it('says the check is not open when the read has no check of its band and week', async () => {
  await showCheck({ holdoutChecks: reading(otherBandDue) })

  expect(screen.getByText(es.holdoutCheckRefused())).toBeDefined()
  expect(screen.queryByRole('button', { name: es.holdoutCheckStart() })).toBeNull()
})

it('says the check is not open on a week no check is taken at', async () => {
  const holdoutChecks = vi.fn(reading(firstBandDue))
  await showCheck({ holdoutChecks }, '/school/check/1/9')

  expect(screen.getByText(es.holdoutCheckRefused())).toBeDefined()
  expect(holdoutChecks).not.toHaveBeenCalled()
})

it('offers a retry when the checks cannot be read and reads them again', async () => {
  const holdoutChecks = vi
    .fn<ApiClient['holdoutChecks']>()
    .mockResolvedValueOnce({ ok: false, refusal: 'Unexpected' })
    .mockResolvedValue({ ok: true, value: firstBandDue })
  await showCheck({ holdoutChecks })

  expect(screen.getByText(es.holdoutCheckFailed())).toBeDefined()
  await click(es.placementRetry())

  expect(button(es.holdoutCheckStart())).toBeDefined()
})

it('begins the check once when its start is pressed twice', async () => {
  const beginHoldoutCheck = vi.fn<ApiClient['beginHoldoutCheck']>(
    () => new Promise(() => undefined),
  )
  await showCheck({ holdoutChecks: reading(firstBandDue), beginHoldoutCheck })

  await act(async () => {
    fireEvent.click(button(es.holdoutCheckStart()))
    fireEvent.click(button(es.holdoutCheckStart()))
  })

  expect(beginHoldoutCheck).toHaveBeenCalledOnce()
})

it('sends an empty answer list for a check asked with no words', async () => {
  const answerHoldoutCheck = vi.fn(changedTo({ checks: [] }))
  await showCheck({
    holdoutChecks: reading({ checks: [{ kind: 'asking', band: 1, week: 8, items: [] }] }),
    answerHoldoutCheck,
  })

  await click(es.holdoutCheckSend())

  expect(answerHoldoutCheck).toHaveBeenCalledWith({ band: 1, week: 8 }, { answers: [] })
  expect(screen.getByText(es.holdoutCheckDone())).toBeDefined()
})

it('moves focus to the first word once the check begins', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandDue),
    beginHoldoutCheck: changedTo(firstBandAsking),
  })

  await click(es.holdoutCheckStart())

  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'house' }))
})

it('moves focus to the next word after next', async () => {
  await showCheck({ holdoutChecks: reading(firstBandAsking) })

  await choose('casa')
  await click(es.placementNext())

  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'water' }))
})

it('moves focus to the line that says the check is done once its answers are sent', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandAsking),
    answerHoldoutCheck: changedTo({ checks: [] }),
  })

  await answerBoth()
  await click(es.holdoutCheckSend())

  expect(document.activeElement).toBe(screen.getByText(es.holdoutCheckDone()).closest('p'))
})

it('moves focus to the line that says the check is skipped once it is skipped', async () => {
  await showCheck({
    holdoutChecks: reading(firstBandDue),
    skipHoldoutCheck: changedTo({ checks: [] }),
  })

  await click(es.holdoutCheckSkip())

  expect(document.activeElement).toBe(screen.getByText(es.holdoutCheckSkipped()).closest('p'))
})

it('leaves focus where it was when a check begun before is read', async () => {
  await showCheck({ holdoutChecks: reading(firstBandAsking) })

  expect(document.activeElement).toBe(document.body)
})
