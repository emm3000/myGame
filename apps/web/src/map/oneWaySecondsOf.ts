import { type FiefOverview, UnitKindSchema } from '@mygame/contracts'
import type { UnitCounts } from '../units/UnitCounts'

export interface RoadEnd {
  readonly province: number
  readonly plot: number
}

const neutralPercent = 100

const seasonRoadPercentOf = (fief: FiefOverview): number =>
  fief.season === null ? neutralPercent : fief.season.durationPercent.road

const roadPercentOf = (party: UnitCounts, fief: FiefOverview): number =>
  UnitKindSchema.options
    .filter((unit) => party[unit] >= 1)
    .reduce((slowest, unit) => Math.max(slowest, fief.unitTerms[unit].roadPercent), 0)

export function oneWaySecondsOf(target: RoadEnd, party: UnitCounts, fief: FiefOverview): number {
  const { secondsPerProvince, secondsPerPlot } = fief.forageTerms
  const baseSeconds =
    Math.abs(target.province - fief.coordinates.province) * secondsPerProvince +
    Math.abs(target.plot - fief.coordinates.plot) * secondsPerPlot
  return Math.ceil(
    (baseSeconds * roadPercentOf(party, fief) * seasonRoadPercentOf(fief)) /
      (neutralPercent * neutralPercent),
  )
}
