import { alignmentDistanceOf } from './alignmentDistanceOf'
import { normalizedAnswerOf } from './normalizedAnswerOf'

export type TypedAnswerGrade = 'correct' | 'nearMiss' | 'wrong'

const NEAR_MISS_MINIMUM_LETTERS = 4

const isNearMissOf = (answer: string, form: string): boolean =>
  [...form].length >= NEAR_MISS_MINIMUM_LETTERS && alignmentDistanceOf(answer, form) === 1

const isWordNearMissOf = (
  answer: string,
  form: string,
  isHeadword: (word: string) => boolean,
): boolean => !isHeadword(answer) && isNearMissOf(answer, form)

const isUnitWithOneSpaceDropped = (answer: string, unit: string): boolean =>
  [...unit.matchAll(/ /g)].some(
    ({ index }) => unit.slice(0, index) + unit.slice(index + 1) === answer,
  )

const isUnitNearMissOf = (
  answer: string,
  unit: string,
  isHeadword: (word: string) => boolean,
): boolean => {
  if (isUnitWithOneSpaceDropped(answer, unit)) {
    return true
  }
  const typedWords = answer.split(' ')
  const unitWords = unit.split(' ')
  if (typedWords.length !== unitWords.length) {
    return false
  }
  const slips = unitWords.flatMap((word, at) => {
    const typedWord = typedWords[at] ?? ''
    return typedWord === word ? [] : [{ typedWord, word }]
  })
  const [slip, ...others] = slips
  return (
    slip !== undefined &&
    others.length === 0 &&
    isWordNearMissOf(slip.typedWord, slip.word, isHeadword)
  )
}

const isNearMissOfForm = (
  answer: string,
  form: string,
  isHeadword: (word: string) => boolean,
): boolean =>
  form.includes(' ')
    ? isUnitNearMissOf(answer, form, isHeadword)
    : isWordNearMissOf(answer, form, isHeadword)

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
  if (forms.some((form) => isNearMissOfForm(typed, form, isHeadword))) {
    return 'nearMiss'
  }
  return 'wrong'
}
