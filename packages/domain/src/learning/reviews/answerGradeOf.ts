import type { DomainError } from '../../DomainError'
import { err, ok, type Result } from '../../Result'
import type { LessonCatalog } from '../curriculum/ports/LessonCatalog'
import type { HeldCards } from '../HeldCards'
import type { DueReview } from './admitDueReview'
import { gradeTypedAnswer } from './gradeTypedAnswer'
import type { PendingReview } from './PendingReview'
import { reviewFormatOf } from './ReviewFormat'
import type { AnswerGrade } from './ratingOf'
import { recognitionChoicesOf } from './recognitionChoicesOf'

export const answerGradeOf = (
  review: DueReview,
  answer: string,
  pending: PendingReview | undefined,
  held: HeldCards,
  lessons: LessonCatalog,
): Result<AnswerGrade | 'nearMiss', DomainError> => {
  if (reviewFormatOf(review.held.card) === 'recognition') {
    const chosen = recognitionChoicesOf(review.word.id, review.lesson, review.held.card, held).find(
      ({ choiceId }) => choiceId === answer,
    )
    if (chosen === undefined) {
      return err({ kind: 'UnknownChoice', wordId: review.word.id })
    }
    return ok(chosen.wordId === review.word.id ? 'correct' : 'wrong')
  }
  const grade = gradeTypedAnswer(answer, review.word.acceptedForms, (word) =>
    lessons.isHeadword(word),
  )
  if (grade === 'nearMiss' && pending !== undefined && pending.nearMissAnswer !== null) {
    return ok('wrong')
  }
  return ok(grade)
}
