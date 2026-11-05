import type { GrammarContent } from '@mygame/contracts'
import type { LessonContentFiles } from '../adapters/json/lessonContentFilesOf'

export type GateContent = LessonContentFiles & {
  readonly grammar: GrammarContent
  readonly forms: ReadonlyMap<string, ReadonlySet<string>>
}
