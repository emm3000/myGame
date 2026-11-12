import { describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryBandStarts, type OwnedBandStart } from '../testing/inMemoryBandStarts'
import { inMemoryPlacements, type OwnedPlacement } from '../testing/inMemoryPlacements'
import { placementContentOf, placementWordsOfBand } from '../testing/placementWords'
import { Instant } from '../time/Instant'
import { skipPlacement } from './skipPlacement'

const ana = 'player-ana'

const firstSignInAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const frozenClock: Clock = { now: () => firstSignInAt }

type SkipShape = {
  readonly stored?: ReadonlyArray<OwnedPlacement>
  readonly starts?: ReadonlyArray<OwnedBandStart>
}

const skipOf = ({ stored = [], starts = [] }: SkipShape) => {
  const placements = inMemoryPlacements(stored)
  const dependencies = {
    placements,
    bandStarts: inMemoryBandStarts(starts),
    ...placementContentOf([
      { band: 1, words: placementWordsOfBand(1, 30) },
      { band: 2, words: placementWordsOfBand(2, 30) },
    ]),
    clock: frozenClock,
  }
  return { placements, dependencies }
}

describe('skipPlacement', () => {
  it('stores the skip with its instant', async () => {
    const { placements, dependencies } = skipOf({})

    await skipPlacement({ playerId: ana }, dependencies)

    expect(await placements.placementOf(ana)).toEqual({
      ok: true,
      value: { kind: 'skipped', skippedAt: firstSignInAt },
    })
  })

  it('refuses a skip after a placement was taken', async () => {
    const { dependencies } = skipOf({
      stored: [
        {
          playerId: ana,
          placement: { kind: 'taken', begunAt: firstSignInAt, samples: [], scores: [] },
        },
      ],
    })

    expect(await skipPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementAlreadyTaken' },
    })
  })

  it('refuses a skip to a player who started band 1', async () => {
    const { dependencies } = skipOf({
      starts: [{ playerId: ana, start: { band: 1, startedAt: firstSignInAt, heldOutWords: [] } }],
    })

    expect(await skipPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementNotOffered' },
    })
  })
})
