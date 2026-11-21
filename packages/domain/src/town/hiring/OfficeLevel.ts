import type { LevelTerms } from '../building/LevelTerms'
import type { HireKind } from './HireKind'

export type OfficeLevel = LevelTerms & {
  readonly building: 'office'
  readonly hires: ReadonlyArray<HireKind>
}
