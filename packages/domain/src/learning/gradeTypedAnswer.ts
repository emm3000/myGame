import { alignmentDistanceOf } from './alignmentDistanceOf'
import { normalizedAnswerOf } from './normalizedAnswerOf'

export type TypedAnswerGrade = 'correct' | 'nearMiss' | 'wrong'

const NEAR_MISS_MINIMUM_LETTERS = 4

const isNearMissOf = (answer: string, form: string): boolean =>
  [...form].length >= NEAR_MISS_MINIMUM_LETTERS && alignmentDistanceOf(answer, form) === 1

export const gradeTypedAnswer = (
  answer: string,
  acceptedForms: ReadonlyArray<string>,
  isHeadword: (word: string) => boolean,
): TypedAnswerGrade => {
  const typed = normalizedAnswerOf(answer)
  const forms = acceptedForms.map(normalizedAnswerOf)
  if (forms.includes(typed)) {
    return 'correct'
  }
  if (!isHeadword(typed) && forms.some((form) => isNearMissOf(typed, form))) {
    return 'nearMiss'
  }
  return 'wrong'
}
