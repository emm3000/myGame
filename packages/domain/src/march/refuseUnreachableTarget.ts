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
  if (fief.coordinates.province === province && fief.coordinates.plot === plot) {
    return err({ kind: 'MarchToOwnPlot' })
  }
  const holders = await map.holdersIn(kingdom, province)
  if (holders.some((holder) => holder.plot === plot)) {
    return err({ kind: 'PlotHeld', province, plot })
  }
  return ok(undefined)
}
