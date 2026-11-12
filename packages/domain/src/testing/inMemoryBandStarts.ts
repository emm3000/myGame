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
  const indexOf = (playerId: PlayerId, band: number): number =>
    starts.findIndex((stored) => stored.playerId === playerId && stored.start.band === band)
  return {
    bandStartsOf: async (playerId) =>
      ok(starts.filter((stored) => stored.playerId === playerId).map(({ start }) => start)),
    save: async (playerId, start) => {
      if (indexOf(playerId, start.band) === -1) {
        starts.push({ playerId, start })
      }
      return ok(undefined)
    },
    saveCheck: async (playerId, band, check) => {
      const index = indexOf(playerId, band)
      const stored = starts[index]
      if (stored !== undefined) {
        const checks = [
          ...stored.start.checks.filter(({ week }) => week !== check.week),
          check,
        ].sort((first, second) => first.week - second.week)
        starts[index] = { playerId, start: { ...stored.start, checks } }
      }
      return ok(undefined)
    },
  }
}
