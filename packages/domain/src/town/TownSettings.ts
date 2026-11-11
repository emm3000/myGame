import type { SeasonDates } from '../season/SeasonDates'
import type { SeasonKind } from '../season/SeasonKind'
import type { ResourceKind } from './ResourceKind'
import type { Stocks } from './Stocks'
import type { Terrain } from './Terrain'

export type ProductionPercent = Readonly<Record<ResourceKind, number>>

export type TownDurationPercent = {
  readonly build: number
  readonly study: number
  readonly hire: number
  readonly road: number
}

export type TownSeasons = SeasonDates & {
  readonly productionPercent: Readonly<Record<SeasonKind, ProductionPercent>>
  readonly durationPercent: Readonly<Record<SeasonKind, TownDurationPercent>>
}

export type JobPayPerHour = Readonly<Record<ResourceKind, number>>

export type JobTerms = {
  readonly secondsPerArea: number
  readonly secondsPerSite: number
  readonly maxHours: number
  readonly payPerHour: Readonly<Record<Terrain, JobPayPerHour>>
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
  readonly job: JobTerms
  readonly seasons: TownSeasons
}
