import type { WordId } from '../learning/Lesson'
import type { PlacementQuestion } from './placementQuestionsOf'

export type PlacementAnswer = {
  readonly wordId: WordId
  readonly choiceId: string
}

const isOffered = (question: PlacementQuestion, answer: PlacementAnswer | undefined): boolean =>
  question.choices.some(({ choiceId }) => choiceId === answer?.choiceId)

const isRight = (question: PlacementQuestion, answer: PlacementAnswer | undefined): boolean =>
  question.choices.find(({ choiceId }) => choiceId === answer?.choiceId)?.word.id ===
  question.word.id

export const rightWordIdsOf = (
  questions: ReadonlyArray<PlacementQuestion>,
  answers: ReadonlyArray<PlacementAnswer>,
): ReadonlyArray<WordId> | undefined => {
  const answerOf = (question: PlacementQuestion): PlacementAnswer | undefined =>
    answers.find(({ wordId }) => wordId === question.word.id)
  const isComplete =
    answers.length === questions.length &&
    new Set(answers.map(({ wordId }) => wordId)).size === answers.length &&
    questions.every((question) => isOffered(question, answerOf(question)))
  if (!isComplete) {
    return undefined
  }
  return questions
    .filter((question) => isRight(question, answerOf(question)))
    .map(({ word }) => word.id)
}
