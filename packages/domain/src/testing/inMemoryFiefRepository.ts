import type { Fief } from '../fief/Fief'
import type { PlayerId } from '../player/PlayerId'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok } from '../Result'

export type InMemoryFiefRepository = FiefRepository & {
  savedFiefs(): ReadonlyArray<Fief>
  storedFiefOf(playerId: PlayerId): Fief | undefined
}

export const inMemoryFiefRepository = (existing: ReadonlyArray<Fief>): InMemoryFiefRepository => {
  const fiefs = new Map(existing.map((fief) => [fief.playerId, fief]))
  return {
    savedFiefs: () => [...fiefs.values()],
    storedFiefOf: (playerId) => fiefs.get(playerId),
    occupiedPlots: async () =>
      [...fiefs.values()].map(({ coordinates: { kingdom, province, plot } }) => ({
        kingdom,
        province,
        plot,
      })),
    holdsFief: async (playerId) => fiefs.has(playerId),
    fiefOf: async (playerId) => ok(fiefs.get(playerId)),
    save: async (fief) => {
      fiefs.set(fief.playerId, fief)
      return ok(undefined)
    },
  }
}
