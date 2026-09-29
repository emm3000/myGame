import type { PlotAddress } from '../fief/PlotAddress'
import type { ForageTerms } from '../ports/BuildingCatalog'

export const marchOneWaySeconds = (
  from: PlotAddress,
  to: PlotAddress,
  forage: ForageTerms,
): number =>
  Math.abs(to.province - from.province) * forage.secondsPerProvince +
  Math.abs(to.plot - from.plot) * forage.secondsPerPlot
