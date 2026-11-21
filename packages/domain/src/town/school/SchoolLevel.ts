import type { LevelTerms } from '../building/LevelTerms'

export type SchoolLevel = LevelTerms & {
  readonly building: 'school'
  readonly lessonPercent: number
  readonly learningCap: number
}
