import type { Fief } from '../fief/Fief'
import type { FiefId } from '../fief/FiefId'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok } from '../Result'

export type InMemoryFiefRepository = FiefRepository & {
  savedFiefs(): ReadonlyArray<Fief>
  storedFiefOf(fiefId: FiefId): Fief | undefined
}

const byProvinceThenPlot = (left: Fief, right: Fief): number =>
  left.coordinates.province - right.coordinates.province ||
  left.coordinates.plot - right.coordinates.plot

export const inMemoryFiefRepository = (existing: ReadonlyArray<Fief>): InMemoryFiefRepository => {
  const fiefs = new Map(existing.map((fief) => [fief.id, fief]))
  return {
    savedFiefs: () => [...fiefs.values()],
    storedFiefOf: (fiefId) => fiefs.get(fiefId),
    occupiedPlots: async () =>
      [...fiefs.values()].map(({ coordinates: { kingdom, province, plot } }) => ({
        kingdom,
        province,
        plot,
      })),
    holdsFief: async (playerId) => [...fiefs.values()].some((fief) => fief.playerId === playerId),
    fiefsOf: async (playerId) =>
      [...fiefs.values()]
        .filter((fief) => fief.playerId === playerId)
        .sort(byProvinceThenPlot)
        .map((fief) => fief.id),
    fiefOf: async (fiefId) => ok(fiefs.get(fiefId)),
    save: async (fief) => {
      fiefs.set(fief.id, fief)
      return ok(undefined)
    },
  }
}
