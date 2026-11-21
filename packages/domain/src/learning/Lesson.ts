import type { WordFrame } from './frames/WordFrame'
import type { LessonSkill } from './LessonSkill'

export type LessonId = string

export type WordId = string

export type LaterFrame = WordFrame & {
  readonly fromLessonId: LessonId
}

export type LessonWord = {
  readonly id: WordId
  readonly acceptedForms: readonly [string, ...ReadonlyArray<string>]
  readonly gloss: string
  readonly definition: string
  readonly frames: readonly [WordFrame, ...ReadonlyArray<LaterFrame>]
}

export type Lesson = {
  readonly id: LessonId
  readonly durationSeconds: number
  readonly requiredSchoolLevel: number
  readonly words: ReadonlyArray<LessonWord>
  readonly skill: LessonSkill
}
