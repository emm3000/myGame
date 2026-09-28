import type { KingdomMapReader, PlayerId, PlotAddress, PlotHolder } from '@mygame/domain'
import type { MemoryFiefRepository } from './MemoryFiefRepository'

export class MemoryKingdomMapReader implements KingdomMapReader {
  constructor(private readonly fiefs: MemoryFiefRepository) {}

  async addressOf(playerId: PlayerId): Promise<PlotAddress | undefined> {
    const held = this.fiefs.heldFiefs().find((fief) => fief.playerId === playerId)
    if (held === undefined) {
      return undefined
    }
    const { kingdom, province, plot } = held.coordinates
    return { kingdom, province, plot }
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
}
