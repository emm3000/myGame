import type { ResourceKind } from '../town/ResourceKind'

export type LessonId = string

export type WordId = string

export type LessonWord = {
  readonly id: WordId
  readonly acceptedForms: readonly [string, ...ReadonlyArray<string>]
  readonly gloss: string
  readonly frame: string
  readonly gappedFrame: string
}

export type LessonSkill = {
  readonly resource: ResourceKind
  readonly ratePercent: number
}

export type Lesson = {
  readonly id: LessonId
  readonly durationSeconds: number
  readonly requiredSchoolLevel: number
  readonly words: ReadonlyArray<LessonWord>
  readonly skill: LessonSkill
}
