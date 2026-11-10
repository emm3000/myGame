import type { MemoryTerms, TownCatalog } from '@mygame/domain'
import type { MutateTownDependencies } from '../town/mutateTown'
import type { LessonLibrary } from './LessonLibrary'

export type LearningDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
  readonly townCatalog: TownCatalog
}
