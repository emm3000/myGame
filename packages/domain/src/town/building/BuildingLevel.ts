import type { OfficeLevel } from '../hiring/OfficeLevel'
import type { SchoolLevel } from '../school/SchoolLevel'
import type { LevelTerms } from './LevelTerms'

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
  readonly capacity: number
}

export type BuildingLevel = HomesLevel | ProducerLevel | StorageLevel | SchoolLevel | OfficeLevel
