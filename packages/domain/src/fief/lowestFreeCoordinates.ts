import type { DomainError } from '../DomainError'
import { err, type Result } from '../Result'
import { Coordinates } from './Coordinates'
import type { PlotAddress } from './PlotAddress'

const FIRST_KINGDOM = 1

const plotKey = (province: number, plot: number): string => `${province}:${plot}`

export const lowestFreeCoordinates = (
  occupied: ReadonlyArray<PlotAddress>,
  plotsPerProvince: number,
): Result<Coordinates, DomainError> => {
  if (!Number.isInteger(plotsPerProvince) || plotsPerProvince < 1) {
    return err({ kind: 'InvalidPlotsPerProvince', plotsPerProvince })
  }
  const takenPlots = new Set(
    occupied
      .filter((address) => address.kingdom === FIRST_KINGDOM)
      .map((address) => plotKey(address.province, address.plot)),
  )

  let plotIndex = 0
  const provinceOf = (index: number): number => Math.floor(index / plotsPerProvince) + 1
  const plotOf = (index: number): number => (index % plotsPerProvince) + 1
  while (takenPlots.has(plotKey(provinceOf(plotIndex), plotOf(plotIndex)))) {
    plotIndex += 1
  }

  return Coordinates.create(FIRST_KINGDOM, provinceOf(plotIndex), plotOf(plotIndex))
}
