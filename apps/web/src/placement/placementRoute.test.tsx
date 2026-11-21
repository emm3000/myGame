import { es } from '@mygame/catalog'
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

  expect(screen.getByText(es.placementOfferedLine())).toBeDefined()
  expect(button(es.placementStart())).toBeDefined()
  expect(button(es.placementSkip())).toBeDefined()
})

it('skips the placement and draws the placement the api answers', async () => {
  const skipPlacement = vi.fn<ApiClient['skipPlacement']>(async () => ({
    ok: true,
    value: closedWithoutScores,
  }))
  await showPlacement({ placement: readingInTurn(offered), skipPlacement })

  await click(es.placementSkip())

  expect(skipPlacement).toHaveBeenCalledOnce()
  expect(screen.getByText(es.placementClosedNone())).toBeDefined()
})

it('takes the placement and asks the first word of the band with its choices', async () => {
  await showPlacement({
    placement: readingInTurn(offered),
    beginPlacement: async () => ({ ok: true, value: firstBandAsked }),
  })

  await click(es.placementStart())

  expect(screen.getByRole('heading', { name: 'house' })).toBeDefined()
  expect(screen.getByRole('radio', { name: 'perro' })).toBeDefined()
  expect(screen.getByRole('radio', { name: 'casa' })).toBeDefined()
  expect(screen.getByText(es.placementProgress({ number: 1, total: 2 }))).toBeDefined()
})

it('keeps the next button blocked with its reason until a meaning is chosen', async () => {
  await showPlacement({ placement: readingInTurn(firstBandAsked) })

  expect(button(es.placementNext()).getAttribute('aria-disabled')).toBe('true')
  expect(screen.getByText(es.placementChoose())).toBeDefined()

  await choose('casa')

  expect(button(es.placementNext()).getAttribute('aria-disabled')).not.toBe('true')
})

it('sends the band answers in one request and draws the placement the api answers next', async () => {
  const answerPlacement = vi.fn<ApiClient['answerPlacement']>(async () => ({
    ok: true,
    value: closedWithScores,
  }))
  await showPlacement({ placement: readingInTurn(firstBandAsked), answerPlacement })

  await choose('casa')
  await click(es.placementNext())
  await choose('agua')
  await click(es.placementSendBand({ band: 1 }))

  const sent: PlacementAnswers = {
    band: 1,
    answers: [
      { wordId: 'word-house', choiceId: 'choice-house' },
      { wordId: 'word-water', choiceId: 'choice-water' },
    ],
  }
  expect(answerPlacement.mock.calls).toEqual([[sent]])
  expect(screen.getByText(es.placementResultBand({ band: 1, score: 21 }))).toBeDefined()
})

it('sends the band answers once on a double click', async () => {
  const answerPlacement = vi.fn<ApiClient['answerPlacement']>(() => new Promise(() => undefined))
  await showPlacement({
    placement: readingInTurn({ ...firstBandAsked, items: [...firstBandAsked.items.slice(0, 1)] }),
    answerPlacement,
  })
  await choose('casa')

  await act(async () => {
    fireEvent.click(button(es.placementSendBand({ band: 1 })))
    fireEvent.click(button(es.placementSendBand({ band: 1 })))
  })

  expect(answerPlacement).toHaveBeenCalledOnce()
})

it('shows each band score and whether it is placed out as the wire says', async () => {
  await showPlacement({ placement: readingInTurn(closedWithScores) })

  const bandLines = screen.getAllByRole('listitem').map(({ textContent }) => textContent)

  expect(bandLines).toEqual([
    `${es.placementResultBand({ band: 1, score: 21 })}${es.placementPlacedOut()}`,
    `${es.placementResultBand({ band: 2, score: 30 })}${es.placementNotPlacedOut()}`,
  ])
})

it('re-reads the placement after a refused call and draws its answer', async () => {
  const placement = readingInTurn(offered, firstBandAsked)
  await showPlacement({
    placement,
    beginPlacement: async () => ({ ok: false, refusal: 'Unexpected' }),
  })

  await click(es.placementStart())

  expect(placement).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('heading', { name: 'house' })).toBeDefined()
})

it('offers a retry when the placement cannot be read', async () => {
  const placement = vi
    .fn<ApiClient['placement']>()
    .mockResolvedValueOnce({ ok: false, refusal: 'Unexpected' })
    .mockResolvedValue({ ok: true, value: offered })
  await showPlacement({ placement })

  expect(screen.getByText(es.placementFailed())).toBeDefined()

  await click(es.placementRetry())

  expect(button(es.placementStart())).toBeDefined()
})

const secondBandAsked: Placement = {
  kind: 'asking',
  band: 2,
  scores: [{ band: 1, score: 21, takenAt: knownTown.readAt, isPlacedOut: true }],
  items: [
    {
      wordId: 'word-road',
      word: 'road',
      choices: [
        { choiceId: 'choice-road', gloss: 'camino' },
        { choiceId: 'choice-bread', gloss: 'pan' },
      ],
    },
  ],
}

const answerFirstBand = async (): Promise<void> => {
  await choose('casa')
  await click(es.placementNext())
  await choose('agua')
  await click(es.placementSendBand({ band: 1 }))
}

it('moves focus to the first word once the placement is taken', async () => {
  await showPlacement({
    placement: readingInTurn(offered),
    beginPlacement: async () => ({ ok: true, value: firstBandAsked }),
  })

  await click(es.placementStart())

  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'house' }))
})

it('moves focus to the next word of the band after next', async () => {
  await showPlacement({ placement: readingInTurn(firstBandAsked) })

  await choose('casa')
  await click(es.placementNext())

  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'water' }))
})

it('moves focus to the first word of the next band once a band is sent', async () => {
  await showPlacement({
    placement: readingInTurn(firstBandAsked),
    answerPlacement: async () => ({ ok: true, value: secondBandAsked }),
  })

  await answerFirstBand()

  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'road' }))
})

it('moves focus to the result once the last band is sent', async () => {
  await showPlacement({
    placement: readingInTurn(firstBandAsked),
    answerPlacement: async () => ({ ok: true, value: closedWithScores }),
  })

  await answerFirstBand()

  expect(document.activeElement).toBe(
    screen.getByRole('heading', { name: es.placementResultTitle() }),
  )
})

it('moves focus to the closed line once the placement is skipped', async () => {
  await showPlacement({
    placement: readingInTurn(offered),
    skipPlacement: async () => ({ ok: true, value: closedWithoutScores }),
  })

  await click(es.placementSkip())

  expect(document.activeElement).toBe(screen.getByText(es.placementClosedNone()).closest('p'))
})

it('leaves focus where it was when a placement begun before is read', async () => {
  await showPlacement({ placement: readingInTurn(firstBandAsked) })

  expect(document.activeElement).toBe(document.body)
})
