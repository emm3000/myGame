import type { HireKind } from './HireKind'
import type { Stocks } from './Stocks'

type LevelTerms = {
  readonly level: number
  readonly cost: Stocks
  readonly durationSeconds: number
  readonly people: number
}

export type HomesLevel = LevelTerms & {
  readonly building: 'homes'
  readonly peopleSupplied: number
}

export type ProducerLevel = LevelTerms & {
  readonly building: 'farm' | 'factory' | 'powerStation'
  readonly ratePerHour: number
}

export type StorageLevel = LevelTerms & {
  readonly building: 'storage'
  readonly capacityUnits: number
}

export type SchoolLevel = LevelTerms & {
  readonly building: 'school'
  readonly lessonPercent: number
  readonly learningCap: number
}

export type OfficeLevel = LevelTerms & {
  readonly building: 'office'
  readonly hires: ReadonlyArray<HireKind>
}

export type BuildingLevel = HomesLevel | ProducerLevel | StorageLevel | SchoolLevel | OfficeLevel
