import type { LessonWord } from './Lesson'
import type { SupportLevel } from './supportLevelOf'

export type SupportText = {
  readonly text: string
  readonly language: 'es' | 'en'
}

export const supportTextOf = (word: LessonWord, { help }: SupportLevel): SupportText =>
  help === 'gloss'
    ? { text: word.gloss, language: 'es' }
    : { text: word.definition, language: 'en' }
