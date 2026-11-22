import type { LessonWord } from '../../domain/Lesson'
import type { Scaffold } from './Scaffold'

export const glossOf = (
  word: Pick<LessonWord, 'gloss' | 'definition'>,
  scaffold: Scaffold,
): string => (scaffold === 'es' ? word.gloss : word.definition)
