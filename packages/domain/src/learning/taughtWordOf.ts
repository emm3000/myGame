import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Lesson, LessonWord, WordId } from './Lesson'

export type TaughtWord = {
  readonly lesson: Lesson
  readonly word: LessonWord
}

export const taughtWordOf = (
  wordId: WordId,
  lesson: Lesson | undefined,
): Result<TaughtWord, DomainError> => {
  const word = lesson?.words.find(({ id }) => id === wordId)
  if (lesson === undefined || word === undefined) {
    return err({ kind: 'UnknownWord', wordId })
  }
  return ok({ lesson, word })
}
