import type { LevelTerms } from '../building/domain/LevelTerms'

export type SchoolLevel = LevelTerms & {
  readonly building: 'school'
  readonly lessonPercent: number
  readonly learningCap: number
}
