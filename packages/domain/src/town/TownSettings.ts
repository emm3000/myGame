import type { SeasonDates } from '../season/SeasonCalendar'
import type { SeasonKind } from '../season/SeasonKind'
import type { ResourceKind } from './ResourceKind'
import type { Stocks } from './Stocks'

export type ProductionPercent = Readonly<Record<ResourceKind, number>>

export type TownSeasons = SeasonDates & {
  readonly productionPercent: Readonly<Record<SeasonKind, ProductionPercent>>
}

export type TownSettings = {
  readonly startingStocks: Stocks
  readonly taxRatePerHour: number
  readonly basePeople: number
  readonly cityPeople: number
  readonly storageBaseCapacity: number
  readonly sitesPerArea: number
  readonly terrainBonusPerHour: number
  readonly seasons: TownSeasons
}
