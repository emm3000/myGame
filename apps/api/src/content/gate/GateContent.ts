import type { WordNeed } from '@mygame/domain'
import type { LessonContentFiles } from '../infrastructure/json/readLessonContentFiles'

export type GateContent = LessonContentFiles & {
  readonly englishMessages: Readonly<Record<string, string>>
  readonly wordNeed: WordNeed
  readonly schoolLevels: ReadonlyArray<number>
  readonly topBuildingLevel: number
  readonly spokenRanks?: ReadonlyMap<string, number>
}
