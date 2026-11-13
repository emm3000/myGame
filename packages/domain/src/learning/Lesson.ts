import type { ResourceKind } from '../town/ResourceKind'

export type LessonId = string

export type WordId = string

export type WordFrame = {
  readonly frame: string
  readonly gappedFrame: string
}

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

export type SchoolLesson = Omit<Lesson, 'skill'>
