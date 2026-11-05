import type { MemoryTerms } from '@mygame/domain'
import type { TownCatalog } from '@mygame/domain/town'
import type { MutateTownDependencies } from '../town/mutateTown'
import type { LessonLibrary } from './LessonLibrary'

export type LearningDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
  readonly townCatalog: TownCatalog
}
