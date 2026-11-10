import type { SeasonDates } from '../season/SeasonDates'
import type { SeasonKind } from '../season/SeasonKind'
import type { ResourceKind } from './ResourceKind'
import type { Stocks } from './Stocks'

export type ProductionPercent = Readonly<Record<ResourceKind, number>>

export type TownDurationPercent = {
  readonly build: number
  readonly study: number
}

export type TownSeasons = SeasonDates & {
  readonly productionPercent: Readonly<Record<SeasonKind, ProductionPercent>>
  readonly durationPercent: Readonly<Record<SeasonKind, TownDurationPercent>>
}

export type TownSettings = {
  readonly startingStocks: Stocks
  readonly taxRatePerHour: number
  readonly basePeople: number
  readonly cityPeople: number
  readonly storageBaseCapacity: number
  readonly sitesPerArea: number
  readonly terrainBonusPerHour: number
  readonly waitingListCap: number
  readonly seasons: TownSeasons
}
