import type { LessonContentFiles } from '../adapters/json/lessonContentFilesOf'

export type GateContent = LessonContentFiles & {
  readonly forms: ReadonlyMap<string, ReadonlySet<string>>
  readonly englishMessages: Readonly<Record<string, string>>
}
