import type { BandStart } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import { ok } from '../Result'

export type OwnedBandStart = {
  readonly playerId: PlayerId
  readonly start: BandStart
}

export const inMemoryBandStarts = (
  existing: ReadonlyArray<OwnedBandStart>,
): BandStartRepository => {
  const starts = [...existing]
  return {
    bandStartsOf: async (playerId) =>
      ok(starts.filter((stored) => stored.playerId === playerId).map(({ start }) => start)),
    save: async (playerId, start) => {
      const isStarted = starts.some(
        (stored) => stored.playerId === playerId && stored.start.band === start.band,
      )
      if (!isStarted) {
        starts.push({ playerId, start })
      }
      return ok(undefined)
    },
  }
}
