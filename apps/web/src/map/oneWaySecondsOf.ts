import type { FiefOverview } from '@mygame/contracts'

export interface RoadEnd {
  readonly province: number
  readonly plot: number
}

export function oneWaySecondsOf(target: RoadEnd, fief: FiefOverview): number {
  const { secondsPerProvince, secondsPerPlot } = fief.forageTerms
  return (
    Math.abs(target.province - fief.coordinates.province) * secondsPerProvince +
    Math.abs(target.plot - fief.coordinates.plot) * secondsPerPlot
  )
}
