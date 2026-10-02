import type { Fief } from '../fief/Fief'
import type { FiefId } from '../fief/FiefId'
import type { PlotAddress } from '../fief/PlotAddress'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok } from '../Result'

export type InMemoryFiefRepository = FiefRepository & {
  savedFiefs(): ReadonlyArray<Fief>
  storedFiefOf(fiefId: FiefId): Fief | undefined
}

const byProvinceThenPlot = (left: Fief, right: Fief): number =>
  left.coordinates.province - right.coordinates.province ||
  left.coordinates.plot - right.coordinates.plot

const reservedPlotOf = ({ coordinates, march }: Fief): PlotAddress | undefined =>
  march.kind === 'away' && march.order === 'found' && march.recalledAt === undefined
    ? { kingdom: coordinates.kingdom, province: march.province, plot: march.plot }
    : undefined

export const inMemoryFiefRepository = (existing: ReadonlyArray<Fief>): InMemoryFiefRepository => {
  const fiefs = new Map(existing.map((fief) => [fief.id, fief]))
  return {
    savedFiefs: () => [...fiefs.values()],
    storedFiefOf: (fiefId) => fiefs.get(fiefId),
    occupiedPlots: async () => [
      ...[...fiefs.values()].map(({ coordinates: { kingdom, province, plot } }) => ({
        kingdom,
        province,
        plot,
      })),
      ...[...fiefs.values()].flatMap((fief) => reservedPlotOf(fief) ?? []),
    ],
    holdsFief: async (playerId) => [...fiefs.values()].some((fief) => fief.playerId === playerId),
    fiefsOf: async (playerId) =>
      [...fiefs.values()]
        .filter((fief) => fief.playerId === playerId)
        .sort(byProvinceThenPlot)
        .map((fief) => fief.id),
    foundingsOnTheRoadOf: async (playerId) =>
      [...fiefs.values()].filter(
        (fief) => fief.playerId === playerId && reservedPlotOf(fief) !== undefined,
      ).length,
    fiefOf: async (fiefId) => ok(fiefs.get(fiefId)),
    save: async (fief) => {
      fiefs.set(fief.id, fief)
      return ok(undefined)
    },
  }
}
