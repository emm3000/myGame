import type { LessonContentFiles } from '../adapters/json/lessonContentFilesOf'

export type GateContent = LessonContentFiles & {
  readonly englishMessages: Readonly<Record<string, string>>
}
