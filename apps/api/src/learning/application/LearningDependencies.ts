import type {
  LessonLibrary,
  MemoryTerms,
  MutateTownDependencies,
  TownCatalog,
} from '@mygame/domain'

export type LearningDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
  readonly townCatalog: TownCatalog
}
