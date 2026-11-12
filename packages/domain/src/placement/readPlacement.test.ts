import { assert, describe, expect, it } from 'vitest'
import type { BandStart } from '../learning/BandStart'
import { inMemoryBandStarts, type OwnedBandStart } from '../testing/inMemoryBandStarts'
import { inMemoryPlacements, type OwnedPlacement } from '../testing/inMemoryPlacements'
import {
  inMemoryPlacementWords,
  type PlacementShelf,
  placementWordsOfBand,
} from '../testing/placementWords'
import { Instant } from '../time/Instant'
import type { TakenPlacement } from './Placement'
import { readPlacement } from './readPlacement'

const ana = 'player-ana'

const firstSignInAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const bandOneWords = placementWordsOfBand(1, 30)

const draftedBands: ReadonlyArray<PlacementShelf> = [
  { band: 1, words: bandOneWords },
  { band: 2, words: placementWordsOfBand(2, 30) },
]

const begunPlacement: TakenPlacement = {
  kind: 'taken',
  begunAt: firstSignInAt,
  samples: [
    { band: 1, wordIds: bandOneWords.map(({ id }) => id) },
    { band: 2, wordIds: placementWordsOfBand(2, 30).map(({ id }) => id) },
  ],
  scores: [],
}

const bandOneStart: BandStart = { band: 1, startedAt: firstSignInAt, heldOutWords: [] }

type ReadShape = {
  readonly stored?: ReadonlyArray<OwnedPlacement>
  readonly starts?: ReadonlyArray<OwnedBandStart>
  readonly shelves?: ReadonlyArray<PlacementShelf>
}

const read = ({ stored = [], starts = [], shelves = draftedBands }: ReadShape) =>
  readPlacement(
    { playerId: ana },
    {
      placements: inMemoryPlacements(stored),
      bandStarts: inMemoryBandStarts(starts),
      words: inMemoryPlacementWords(shelves),
    },
  )

const begun = (placement: TakenPlacement = begunPlacement): ReadonlyArray<OwnedPlacement> => [
  { playerId: ana, placement },
]

describe('readPlacement', () => {
  it('offers a placement to a player who has neither taken nor skipped one', async () => {
    expect(await read({})).toEqual({ ok: true, value: { kind: 'offered' } })
  })

  it('offers no placement to a player who started band 1', async () => {
    expect(await read({ starts: [{ playerId: ana, start: bandOneStart }] })).toEqual({
      ok: true,
      value: { kind: 'closed', scores: [] },
    })
  })

  it('closes a skipped placement', async () => {
    const skipped = { kind: 'skipped', skippedAt: firstSignInAt } as const

    expect(await read({ stored: [{ playerId: ana, placement: skipped }] })).toEqual({
      ok: true,
      value: { kind: 'closed', scores: [] },
    })
  })

  it("asks band 1's sampled words first, in their drawn order", async () => {
    const view = await read({ stored: begun() })

    assert(view.ok && view.value.kind === 'asking')
    expect(view.value.band).toBe(1)
    expect(view.value.items.map(({ word }) => word)).toEqual(bandOneWords.map(({ word }) => word))
  })

  it('offers each word its own gloss among 4 choices', async () => {
    const view = await read({ stored: begun() })

    assert(view.ok && view.value.kind === 'asking')
    const [firstItem] = view.value.items
    expect(firstItem?.choices.length).toBe(4)
    expect(firstItem?.choices.filter(({ gloss }) => gloss === 'gloss-card-1-1').length).toBe(1)
  })

  it('never offers a choice that shares the asked word gloss', async () => {
    const twins = bandOneWords.map((word) => ({ ...word, gloss: 'same gloss' }))
    const view = await read({
      stored: begun(),
      shelves: [{ band: 1, words: [...twins.slice(0, 29), ...bandOneWords.slice(29)] }],
    })

    assert(view.ok && view.value.kind === 'asking')
    expect(view.value.items[0]?.choices.map(({ gloss }) => gloss)).toEqual(
      expect.arrayContaining(['same gloss', 'gloss-card-1-30']),
    )
    expect(view.value.items[0]?.choices.length).toBe(2)
  })

  it('answers the same choice ids on every read', async () => {
    const first = await read({ stored: begun() })
    const second = await read({ stored: begun() })

    expect(second).toEqual(first)
  })

  it('never uses a word id as a choice id', async () => {
    const view = await read({ stored: begun() })

    assert(view.ok && view.value.kind === 'asking')
    const choiceIds = view.value.items.flatMap(({ choices }) =>
      choices.map(({ choiceId }) => choiceId),
    )
    expect(choiceIds.filter((choiceId) => choiceId.startsWith('word-'))).toEqual([])
  })

  it('asks the next band once a band is passed', async () => {
    const passedBandOne = {
      ...begunPlacement,
      scores: [{ band: 1, score: 29, takenAt: firstSignInAt }],
    }

    const view = await read({ stored: begun(passedBandOne) })

    assert(view.ok && view.value.kind === 'asking')
    expect(view.value.band).toBe(2)
  })

  it('stops at the first band failed', async () => {
    const failedBandOne = {
      ...begunPlacement,
      scores: [{ band: 1, score: 28, takenAt: firstSignInAt }],
    }

    expect(await read({ stored: begun(failedBandOne) })).toEqual({
      ok: true,
      value: { kind: 'closed', scores: failedBandOne.scores },
    })
  })

  it('closes once every sampled band is scored', async () => {
    const scores = [
      { band: 1, score: 30, takenAt: firstSignInAt },
      { band: 2, score: 29, takenAt: firstSignInAt },
    ]

    expect(await read({ stored: begun({ ...begunPlacement, scores }) })).toEqual({
      ok: true,
      value: { kind: 'closed', scores },
    })
  })

  it('closes the check once the band it asks has started', async () => {
    expect(
      await read({ stored: begun(), starts: [{ playerId: ana, start: bandOneStart }] }),
    ).toEqual({ ok: true, value: { kind: 'closed', scores: [] } })
  })
})
