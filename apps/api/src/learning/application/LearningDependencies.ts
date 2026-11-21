import type { MemoryTerms, TownCatalog } from '@mygame/domain'
import type { LessonLibrary } from '../../content/application/ports/LessonLibrary'
import type { MutateTownDependencies } from '../../town/application/mutateTown'

export type LearningDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
  readonly townCatalog: TownCatalog
}
