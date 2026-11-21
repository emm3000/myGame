import type { SeasonDates } from '../season/SeasonDates'
import type { SeasonKind } from '../season/SeasonKind'
import type { WordNeed } from './building/WordNeed'
import type { TipKind } from './guidance/TipKind'
import type { TownGoal } from './guidance/TownGoal'
import type { JobTerms } from './jobs/JobTerms'
import type { WasteTerms } from './jobs/WasteTerms'
import type { ResourceKind } from './resources/ResourceKind'
import type { Stocks } from './resources/Stocks'

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

export type TownSettings = {
  readonly startingStocks: Stocks
  readonly taxRatePerHour: number
  readonly basePeople: number
  readonly cityPeople: number
  readonly storageBaseCapacity: number
  readonly sitesPerArea: number
  readonly terrainBonusPerHour: number
  readonly waitingListCap: number
  readonly wordNeed: WordNeed
  readonly job: JobTerms
  readonly waste: WasteTerms
  readonly seasons: TownSeasons
  readonly goals: ReadonlyArray<TownGoal>
  readonly tips: ReadonlyArray<TipKind>
}
