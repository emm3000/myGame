import {
  placementChoose,
  placementClosedNone,
  placementFailed,
  placementNext,
  placementNotPlacedOut,
  placementOfferedLine,
  placementPlacedOut,
  placementProgress,
  placementResultBand,
  placementRetry,
  placementSendBand,
  placementSkip,
  placementStart,
} from '@mygame/catalog'
import type { Placement, PlacementAnswers } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
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

const offered: Placement = { kind: 'offered' }

const firstBandAsked: Placement = {
  kind: 'asking',
  band: 1,
  scores: [],
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
}

const closedWithScores: Placement = {
  kind: 'closed',
  scores: [
    { band: 1, score: 21, takenAt: knownTown.readAt, isPlacedOut: true },
    { band: 2, score: 30, takenAt: knownTown.readAt, isPlacedOut: false },
  ],
}

const closedWithoutScores: Placement = { kind: 'closed', scores: [] }

const readingInTurn = (...placements: ReadonlyArray<Placement>): ApiClient['placement'] => {
  const placement = vi.fn<ApiClient['placement']>()
  for (const answer of placements) {
    placement.mockResolvedValueOnce({ ok: true, value: answer })
  }
  return placement.mockResolvedValue({ ok: true, value: placements.at(-1) ?? offered })
}

const showPlacement = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt('/placement', stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides }))
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

it('offers the placement with a way to take it and a way to skip it', async () => {
  await showPlacement({ placement: readingInTurn(offered) })

  expect(screen.getByText(placementOfferedLine())).toBeDefined()
  expect(button(placementStart())).toBeDefined()
  expect(button(placementSkip())).toBeDefined()
})

it('skips the placement and draws the placement the api answers', async () => {
  const skipPlacement = vi.fn<ApiClient['skipPlacement']>(async () => ({
    ok: true,
    value: closedWithoutScores,
  }))
  await showPlacement({ placement: readingInTurn(offered), skipPlacement })

  await click(placementSkip())

  expect(skipPlacement).toHaveBeenCalledOnce()
  expect(screen.getByText(placementClosedNone())).toBeDefined()
})

it('takes the placement and asks the first word of the band with its choices', async () => {
  await showPlacement({
    placement: readingInTurn(offered),
    beginPlacement: async () => ({ ok: true, value: firstBandAsked }),
  })

  await click(placementStart())

  expect(screen.getByRole('heading', { name: 'house' })).toBeDefined()
  expect(screen.getByRole('radio', { name: 'perro' })).toBeDefined()
  expect(screen.getByRole('radio', { name: 'casa' })).toBeDefined()
  expect(screen.getByText(placementProgress({ number: 1, total: 2 }))).toBeDefined()
})

it('keeps the next button blocked with its reason until a meaning is chosen', async () => {
  await showPlacement({ placement: readingInTurn(firstBandAsked) })

  expect(button(placementNext()).getAttribute('aria-disabled')).toBe('true')
  expect(screen.getByText(placementChoose())).toBeDefined()

  await choose('casa')

  expect(button(placementNext()).getAttribute('aria-disabled')).not.toBe('true')
})

it('sends the band answers in one request and draws the placement the api answers next', async () => {
  const answerPlacement = vi.fn<ApiClient['answerPlacement']>(async () => ({
    ok: true,
    value: closedWithScores,
  }))
  await showPlacement({ placement: readingInTurn(firstBandAsked), answerPlacement })

  await choose('casa')
  await click(placementNext())
  await choose('agua')
  await click(placementSendBand({ band: 1 }))

  const sent: PlacementAnswers = {
    band: 1,
    answers: [
      { wordId: 'word-house', choiceId: 'choice-house' },
      { wordId: 'word-water', choiceId: 'choice-water' },
    ],
  }
  expect(answerPlacement.mock.calls).toEqual([[sent]])
  expect(screen.getByText(placementResultBand({ band: 1, score: 21 }))).toBeDefined()
})

it('sends the band answers once on a double click', async () => {
  const answerPlacement = vi.fn<ApiClient['answerPlacement']>(() => new Promise(() => undefined))
  await showPlacement({
    placement: readingInTurn({ ...firstBandAsked, items: [...firstBandAsked.items.slice(0, 1)] }),
    answerPlacement,
  })
  await choose('casa')

  await act(async () => {
    fireEvent.click(button(placementSendBand({ band: 1 })))
    fireEvent.click(button(placementSendBand({ band: 1 })))
  })

  expect(answerPlacement).toHaveBeenCalledOnce()
})

it('shows each band score and whether it is placed out as the wire says', async () => {
  await showPlacement({ placement: readingInTurn(closedWithScores) })

  expect(screen.getByText(placementResultBand({ band: 1, score: 21 }))).toBeDefined()
  expect(screen.getByText(placementResultBand({ band: 2, score: 30 }))).toBeDefined()
  expect(screen.getByText(placementPlacedOut())).toBeDefined()
  expect(screen.getByText(placementNotPlacedOut())).toBeDefined()
})

it('re-reads the placement after a refused call and draws its answer', async () => {
  const placement = readingInTurn(offered, firstBandAsked)
  await showPlacement({
    placement,
    beginPlacement: async () => ({ ok: false, refusal: 'Unexpected' }),
  })

  await click(placementStart())

  expect(placement).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('heading', { name: 'house' })).toBeDefined()
})

it('offers a retry when the placement cannot be read', async () => {
  const placement = vi
    .fn<ApiClient['placement']>()
    .mockResolvedValueOnce({ ok: false, refusal: 'Unexpected' })
    .mockResolvedValue({ ok: true, value: offered })
  await showPlacement({ placement })

  expect(screen.getByText(placementFailed())).toBeDefined()

  await click(placementRetry())

  expect(button(placementStart())).toBeDefined()
})
