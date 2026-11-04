import type { MemoryTerms } from '@mygame/domain'
import type { MutateAfterResolveDependencies } from '../fief/mutateAfterResolve'
import type { LessonLibrary } from './LessonLibrary'

export type LearningDependencies = MutateAfterResolveDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}
