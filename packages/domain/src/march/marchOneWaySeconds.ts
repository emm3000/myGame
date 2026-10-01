import type { MarchTerms } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { PlotAddress } from '../fief/PlotAddress'
import { roadPercentOf } from './roadPercentOf'

export const marchOneWaySeconds = (
  from: PlotAddress,
  to: PlotAddress,
  units: UnitCountsByKind,
  { forage, units: unitTerms }: MarchTerms,
): number => {
  const baseSeconds =
    Math.abs(to.province - from.province) * forage.secondsPerProvince +
    Math.abs(to.plot - from.plot) * forage.secondsPerPlot
  return Math.ceil((baseSeconds * roadPercentOf(units, unitTerms)) / 100)
}
