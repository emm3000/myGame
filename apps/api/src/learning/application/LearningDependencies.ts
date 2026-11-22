import type { MemoryTerms, MutateTownDependencies, TownCatalog } from '@mygame/domain'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'

export type LearningDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
  readonly townCatalog: TownCatalog
}
