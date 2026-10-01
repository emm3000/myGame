import type { FiefOverview } from '@mygame/contracts'
import { UnitKindSchema } from '@mygame/contracts'
import type { UnitCounts } from './unitsAtHomeOf'

export interface RoadEnd {
  readonly province: number
  readonly plot: number
}

const roadPercentOf = (party: UnitCounts, fief: FiefOverview): number =>
  UnitKindSchema.options
    .filter((unit) => party[unit] >= 1)
    .reduce((slowest, unit) => Math.max(slowest, fief.unitTerms[unit].roadPercent), 0)

export function oneWaySecondsOf(target: RoadEnd, party: UnitCounts, fief: FiefOverview): number {
  const { secondsPerProvince, secondsPerPlot } = fief.forageTerms
  const baseSeconds =
    Math.abs(target.province - fief.coordinates.province) * secondsPerProvince +
    Math.abs(target.plot - fief.coordinates.plot) * secondsPerPlot
  return Math.ceil((baseSeconds * roadPercentOf(party, fief)) / 100)
}
