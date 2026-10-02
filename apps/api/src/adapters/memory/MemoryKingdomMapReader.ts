import type {
  FiefId,
  HeldAddress,
  KingdomMapReader,
  PlotHolder,
  PlotReservation,
} from '@mygame/domain'
import type { MemoryFiefRepository } from './MemoryFiefRepository'
import { reservedPlotOf } from './reservedPlotOf'

export class MemoryKingdomMapReader implements KingdomMapReader {
  constructor(private readonly fiefs: MemoryFiefRepository) {}

  async addressOf(fiefId: FiefId): Promise<HeldAddress | undefined> {
    const held = this.fiefs.heldFiefs().find((fief) => fief.id === fiefId)
    if (held === undefined) {
      return undefined
    }
    const { kingdom, province, plot } = held.coordinates
    return { address: { kingdom, province, plot }, playerId: held.playerId }
  }

  async lastOccupiedProvince(kingdom: number): Promise<number> {
    return Math.max(
      0,
      ...this.fiefs
        .heldFiefs()
        .filter((fief) => fief.coordinates.kingdom === kingdom)
        .map((fief) => fief.coordinates.province),
    )
  }

  async holdersIn(kingdom: number, province: number): Promise<ReadonlyArray<PlotHolder>> {
    return this.fiefs
      .heldFiefs()
      .filter(
        ({ coordinates }) => coordinates.kingdom === kingdom && coordinates.province === province,
      )
      .map(({ coordinates, name, playerId }) => ({
        plot: coordinates.plot,
        name: name.value,
        playerId,
      }))
      .sort((left, right) => left.plot - right.plot)
  }

  async reservationsIn(kingdom: number, province: number): Promise<ReadonlyArray<PlotReservation>> {
    return this.fiefs
      .heldFiefs()
      .flatMap((fief) => {
        const reserved = reservedPlotOf(fief)
        return reserved?.kingdom === kingdom && reserved.province === province
          ? [{ plot: reserved.plot, playerId: fief.playerId }]
          : []
      })
      .sort((left, right) => left.plot - right.plot)
  }
}
