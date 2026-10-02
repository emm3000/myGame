import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { KingdomMapReader } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'

export type MarchDestination = {
  readonly province: number
  readonly plot: number
}

const isWithin = (value: number, last: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= last

export const refuseUnreachableTarget = async (
  fief: Fief,
  { province, plot }: MarchDestination,
  map: KingdomMapReader,
  plotsPerProvince: number,
): Promise<Result<void, DomainError>> => {
  const { kingdom } = fief.coordinates
  const lastProvince = (await map.lastOccupiedProvince(kingdom)) + 1
  if (!isWithin(province, lastProvince) || !isWithin(plot, plotsPerProvince)) {
    return err({ kind: 'MarchTargetOutOfBounds', province, plot })
  }
  const holder = (await map.holdersIn(kingdom, province)).find((held) => held.plot === plot)
  if (holder?.playerId === fief.playerId) {
    return err({ kind: 'MarchToOwnPlot' })
  }
  if (holder !== undefined) {
    return err({ kind: 'PlotHeld', province, plot })
  }
  const reservations = await map.reservationsIn(kingdom, province)
  if (reservations.some((reservation) => reservation.plot === plot)) {
    return err({ kind: 'PlotReserved', province, plot })
  }
  return ok(undefined)
}
