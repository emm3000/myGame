import { describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBandStarts, type OwnedBandStart } from '#holdout/testing/inMemoryBandStarts'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import type { Clock } from '#platform/domain/Clock'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import { inMemoryTownStores } from '#town/testing/inMemoryTownStores'
import type { PlacementContent } from '../domain/placementSamplesDrawn'
import { inMemoryPlacements, type OwnedPlacement } from '../testing/inMemoryPlacements'
import { placementContentOf, placementWordsOfBand } from '../testing/placementWords'
import { SkipPlacement, type SkipPlacementCommand } from './SkipPlacement'

const ana = 'player-ana'

const firstSignInAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const frozenClock: Clock = { now: () => firstSignInAt }

type PlacementFixture = PlacementContent & {
  readonly placements: ReturnType<typeof inMemoryPlacements>
  readonly bandStarts: ReturnType<typeof inMemoryBandStarts>
  readonly clock: Clock
}

const skipPlacement = (
  command: SkipPlacementCommand,
  { placements, bandStarts, words, bands, clock }: PlacementFixture,
): ReturnType<SkipPlacement['execute']> =>
  new SkipPlacement({
    unitOfWork: inMemoryUnitOfWork(
      inMemoryTownStores({ placements, bandStarts, accounts: signedUpAccountsOf([ana]) }),
    ),
    lessons: { ...inMemoryLessons([], []), ...words, ...bands },
    clock,
  }).execute(command)

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

describe('SkipPlacement', () => {
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
      starts: [
        {
          playerId: ana,
          start: { band: 1, startedAt: firstSignInAt, heldOutWords: [], checks: [] },
        },
      ],
    })

    expect(await skipPlacement({ playerId: ana }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementNotOffered' },
    })
  })
})
