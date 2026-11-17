import type { WordNeed } from '@mygame/domain'
import type { LessonContentFiles } from '../adapters/json/lessonContentFilesOf'

export type GateContent = LessonContentFiles & {
  readonly englishMessages: Readonly<Record<string, string>>
  readonly wordNeed: WordNeed
  readonly schoolLevels: ReadonlyArray<number>
}
