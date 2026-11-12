import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { firstItemsRandom } from '../testing/firstItemsRandom'
import { inMemoryBandStarts, type OwnedBandStart } from '../testing/inMemoryBandStarts'
import { inMemoryPlacements, type OwnedPlacement } from '../testing/inMemoryPlacements'
import {
  type PlacementShelf,
  placementContentOf,
  placementWordsOfBand,
} from '../testing/placementWords'
import { Instant } from '../time/Instant'
import { beginPlacement } from './beginPlacement'

const ana = 'player-ana'

const firstSignInAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const frozenClock: Clock = { now: () => firstSignInAt }

const bandOneWords = [...placementWordsOfBand(1, 5, true), ...placementWordsOfBand(1, 31)]

const draftedBands: ReadonlyArray<PlacementShelf> = [
  { band: 1, words: bandOneWords },
  { band: 2, words: placementWordsOfBand(2, 30) },
  { band: 3, words: placementWordsOfBand(3, 29) },
]

type PlacementShape = {
  readonly stored?: ReadonlyArray<OwnedPlacement>
  readonly starts?: ReadonlyArray<OwnedBandStart>
  readonly shelves?: ReadonlyArray<PlacementShelf>
}

const placementOf = ({ stored = [], starts = [], shelves = draftedBands }: PlacementShape) => {
  const placements = inMemoryPlacements(stored)
  const dependencies = {
    placements,
    bandStarts: inMemoryBandStarts(starts),
    ...placementContentOf(shelves),
    random: firstItemsRandom,
    clock: frozenClock,
  }
  return { placements, dependencies }
}

const sampledWordIdsOf = async (
  placements: ReturnType<typeof inMemoryPlacements>,
): Promise<ReadonlyArray<ReadonlyArray<string>>> => {
  const stored = await placements.placementOf(ana)
  assert(stored.ok && stored.value?.kind === 'taken')
  return stored.value.samples.map(({ wordIds }) => wordIds)
}

describe('beginPlacement', () => {
  it('never samples a word a chrome lesson teaches', async () => {
    const { placements, dependencies } = placementOf({})

    await beginPlacement({ playerId: ana }, dependencies)

    const [bandOne] = await sampledWordIdsOf(placements)
    expect(bandOne?.filter((wordId) => wordId.includes('chrome'))).toEqual([])
  })

  it('samples 30 words of each band in order', async () => {
    const { placements, dependencies } = placementOf({})

    await beginPlacement({ playerId: ana }, dependencies)

    const samples = await sampledWordIdsOf(placements)
    expect(samples.map((wordIds) => wordIds.length)).toEqual([30, 30])
    expect(samples[1]?.[0]).toBe('word-card-2-1')
  })

  it('samples no band after one with fewer than 30 words to draw', async () => {
    const { placements, dependencies } = placementOf({
      shelves: [
        { band: 1, words: placementWordsOfBand(1, 30) },
        { band: 2, words: placementWordsOfBand(2, 29) },
        { band: 3, words: placementWordsOfBand(3, 30) },
      ],
    })

    await beginPlacement({ playerId: ana }, dependencies)

    expect((await sampledWordIdsOf(placements)).length).toBe(1)
  })

  it('samples no band whose words the lexicon holds only in part', async () => {
    const { placements, dependencies } = placementOf({
      shelves: [
        { band: 1, words: placementWordsOfBand(1, 30) },
        { band: 2, words: placementWordsOfBand(2, 30), undraftedHeadwords: ['undrafted-2'] },
        { band: 3, words: placementWordsOfBand(3, 30) },
      ],
    })

    await beginPlacement({ playerId: ana }, dependencies)

    expect((await sampledWordIdsOf(placements)).length).toBe(1)
  })

  it('samples no band whose next band has no lessons', async () => {
    const { placements, dependencies } = placementOf({
      shelves: [
        { band: 1, words: placementWordsOfBand(1, 30) },
        { band: 2, words: placementWordsOfBand(2, 30) },
        { band: 3, words: placementWordsOfBand(3, 30), isTaught: false },
      ],
    })

    await beginPlacement({ playerId: ana }, dependencies)

    expect((await sampledWordIdsOf(placements)).length).toBe(1)
  })

  it('refuses a placement while band 1 is partly drafted', async () => {
    const { placements, dependencies } = placementOf({
      shelves: [
        { band: 1, words: placementWordsOfBand(1, 50), undraftedHeadwords: ['undrafted-1'] },
        { band: 2, words: placementWordsOfBand(2, 30) },
      ],
    })

    expect(await beginPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementNotOffered' },
    })
    expect(await placements.placementOf(ana)).toEqual({ ok: true, value: undefined })
  })

  it('stores the instant the placement begins', async () => {
    const { placements, dependencies } = placementOf({})

    await beginPlacement({ playerId: ana }, dependencies)

    const stored = await placements.placementOf(ana)
    assert(stored.ok && stored.value?.kind === 'taken')
    expect(stored.value.begunAt).toEqual(firstSignInAt)
  })

  it('refuses a second placement', async () => {
    const { dependencies } = placementOf({})
    await beginPlacement({ playerId: ana }, dependencies)

    expect(await beginPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementAlreadyTaken' },
    })
  })

  it('refuses a placement after a skip', async () => {
    const { dependencies } = placementOf({
      stored: [{ playerId: ana, placement: { kind: 'skipped', skippedAt: firstSignInAt } }],
    })

    expect(await beginPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementAlreadyTaken' },
    })
  })

  it('offers no placement to a player who started band 1', async () => {
    const { placements, dependencies } = placementOf({
      starts: [{ playerId: ana, start: { band: 1, startedAt: firstSignInAt, heldOutWords: [] } }],
    })

    expect(await beginPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementNotOffered' },
    })
    expect(await placements.placementOf(ana)).toEqual({ ok: true, value: undefined })
  })

  it('offers no placement while band 1 has fewer than 30 words to draw', async () => {
    const { dependencies } = placementOf({
      shelves: [
        { band: 1, words: placementWordsOfBand(1, 29) },
        { band: 2, words: placementWordsOfBand(2, 30) },
      ],
    })

    expect(await beginPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementNotOffered' },
    })
  })
})
