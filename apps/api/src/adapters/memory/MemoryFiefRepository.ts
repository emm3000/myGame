import {
  type DomainError,
  err,
  type Fief,
  type FiefRepository,
  ok,
  type PlayerId,
  type PlotAddress,
  type Result,
} from '@mygame/domain'

const sharesPlot = (left: Fief, right: Fief): boolean =>
  left.coordinates.kingdom === right.coordinates.kingdom &&
  left.coordinates.province === right.coordinates.province &&
  left.coordinates.plot === right.coordinates.plot

export class MemoryFiefRepository implements FiefRepository {
  private readonly fiefs = new Map<string, Fief>()

  async occupiedPlots(): Promise<ReadonlyArray<PlotAddress>> {
    return [...this.fiefs.values()].map(({ coordinates: { kingdom, province, plot } }) => ({
      kingdom,
      province,
      plot,
    }))
  }

  async holdsFief(playerId: PlayerId): Promise<boolean> {
    return [...this.fiefs.values()].some((fief) => fief.playerId === playerId)
  }

  async fiefOf(playerId: PlayerId): Promise<Result<Fief | undefined, DomainError>> {
    return ok([...this.fiefs.values()].find((fief) => fief.playerId === playerId))
  }

  async save(fief: Fief): Promise<Result<void, DomainError>> {
    const rival = [...this.fiefs.values()].find(
      (stored) => stored.id !== fief.id && sharesPlot(stored, fief),
    )
    if (rival !== undefined) {
      return err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates })
    }
    this.fiefs.set(fief.id, fief)
    return ok(undefined)
  }
}
